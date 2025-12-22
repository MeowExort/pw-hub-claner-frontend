import React, {createContext, useContext, useEffect, useMemo, useState, useRef} from 'react';
import type {Character, User} from '@/shared/types';
import {userApi} from '@/shared/api';
import {useToast} from './ToastContext';
import {generateVerifier, generateChallenge} from '@/shared/lib/pkce';
import {isTokenExpired} from '@/shared/lib/jwt';

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    login: () => Promise<void>;
    register: () => Promise<void>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
    createCharacter: (payload: Omit<Character, 'id'>) => Promise<Character>;
    updateCharacter: (payload: Partial<Character> & { id: string }) => Promise<Character>;
    switchCharacter: (characterId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const OIDC_CONFIG = {
    authority: 'https://api.pw-hub.ru',
    clientId: 'claner',
    redirectUri: window.location.origin,
    scope: 'openid claner:profile claner:characters:manage claner:clans:read claner:clans:join claner:clans:manage claner:events:read claner:events:participate claner:events:manage offline_access',
};

export function AuthProvider({children}: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const {notify} = useToast();
    const processedRef = useRef(false);

    const refreshAccessToken = async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) return false;

        try {
            console.log('[Auth] Refreshing access token...');
            const response = await fetch(`${OIDC_CONFIG.authority}/connect/token`, {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: new URLSearchParams({
                    client_id: OIDC_CONFIG.clientId,
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                }),
            });

            if (!response.ok) {
                throw new Error('Refresh failed');
            }

            const data = await response.json();
            localStorage.setItem('access_token', data.access_token);
            if (data.refresh_token) {
                localStorage.setItem('refresh_token', data.refresh_token);
            }
            console.log('[Auth] Token refreshed successfully');
            return true;
        } catch (e) {
            console.error('[Auth] Failed to refresh token', e);
            return false;
        }
    };

    useEffect(() => {
        const checkToken = async () => {
            const token = localStorage.getItem('access_token');
            if (token && isTokenExpired(token, 300)) { // 5 minutes buffer
                console.log('[Auth] Token expiring soon, refreshing...');
                await refreshAccessToken();
            }
        };

        checkToken(); // Check immediately on mount
        const interval = setInterval(checkToken, 60 * 1000); // Check every minute

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleCallback = async () => {
            if (processedRef.current) return;

            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            if (code) {
                processedRef.current = true;
                console.log('[Auth] Code detected, starting exchange...');

                const verifier = sessionStorage.getItem('pkce_verifier');
                if (!verifier) {
                    console.error('[Auth] No PKCE verifier found in sessionStorage.');
                    return;
                }

                // sessionStorage.removeItem('pkce_verifier'); // Moved to success
                window.history.replaceState({}, document.title, window.location.pathname);

                try {
                    console.log('[Auth] Sending token request...');
                    const response = await fetch(`${OIDC_CONFIG.authority}/connect/token`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                        body: new URLSearchParams({
                            client_id: OIDC_CONFIG.clientId,
                            code,
                            redirect_uri: OIDC_CONFIG.redirectUri,
                            grant_type: 'authorization_code',
                            code_verifier: verifier,
                        }),
                    });

                    console.log('[Auth] Token response:', response.status);

                    if (!response.ok) {
                        const text = await response.text();
                        throw new Error(`Token exchange failed: ${text}`);
                    }

                    const data = await response.json();
                    sessionStorage.removeItem('pkce_verifier'); // Remove only after success
                    localStorage.setItem('access_token', data.access_token);
                    if (data.refresh_token) {
                        localStorage.setItem('refresh_token', data.refresh_token);
                    }
                    notify('Вход выполнен', 'success');
                    console.log('[Auth] Token saved, fetching user...');

                    // Use unified API to fetch user (will pick real because access_token is set)
                    try {
                        let me = await userApi.getCurrentUser();
                        if (me) {
                            if (me.characters.length > 0 && !me.mainCharacterId) {
                                const lastChar = me.characters[me.characters.length - 1];
                                try {
                                    await userApi.switchActiveCharacter({characterId: lastChar.id});
                                    me = await userApi.getCurrentUser();
                                } catch (e) {
                                    console.error("Failed to auto-switch character", e);
                                }
                            }
                            setUser(me);
                        } else {
                            console.warn('[Auth] getCurrentUser returned null after login');
                        }
                    } catch (e) {
                        console.error("Failed to fetch real user", e);
                    }

                } catch (e: any) {
                    console.error('[Auth] Exchange error:', e);
                    notify(e.message ?? 'Ошибка входа OIDC', 'error');
                }
            }
        };

        handleCallback().then(() => {
            // Initialize user from storage (mock) or real api
            (async () => {
                try {
                    let me = await userApi.getCurrentUser();
                    if (me && me.characters.length > 0 && !me.mainCharacterId) {
                        const lastChar = me.characters[me.characters.length - 1];
                        try {
                            await userApi.switchActiveCharacter({characterId: lastChar.id});
                            me = await userApi.getCurrentUser();
                        } catch (e) {
                            console.error("Failed to auto-switch character", e);
                        }
                    }
                    setUser(me);
                } finally {
                    setLoading(false);
                }
            })();
        });
    }, []);

    const login = async () => {
        try {
            const verifier = generateVerifier();
            const challenge = await generateChallenge(verifier);
            sessionStorage.setItem('pkce_verifier', verifier);

            const params = new URLSearchParams({
                client_id: OIDC_CONFIG.clientId,
                redirect_uri: OIDC_CONFIG.redirectUri,
                response_type: 'code',
                scope: OIDC_CONFIG.scope,
                code_challenge: challenge,
                code_challenge_method: 'S256',
            });

            window.location.href = `${OIDC_CONFIG.authority}/connect/authorize?${params.toString()}`;
        } catch (e: any) {
            notify(e.message ?? 'Ошибка начала входа', 'error');
            throw e;
        }
    };

    const register = async () => {
        // Redirect to register page or just login
        await login();
    };

    const logout = async () => {
        localStorage.removeItem('access_token');
        setUser(null);
        notify('Вы вышли из системы');
    };

    const refresh = async () => {
        const me = await userApi.getCurrentUser();
        setUser(me);
    };

    const createCharacter = async (payload: Omit<Character, 'id'>) => {
        const char = await userApi.createCharacter(payload);
        await refresh();
        notify('Персонаж создан', 'success');
        return char;
    };

    const updateCharacter = async (payload: Partial<Character> & { id: string }) => {
        const char = await userApi.updateCharacter(payload);
        await refresh();
        notify('Персонаж обновлен', 'success');
        return char;
    };

    const switchCharacter = async (characterId: string) => {
        await userApi.switchActiveCharacter({characterId});
        await refresh();
        notify('Персонаж переключен', 'success');
    };

    const value = useMemo<AuthContextValue>(() => ({
        user,
        loading,
        login,
        register,
        logout,
        refresh,
        createCharacter,
        updateCharacter,
        switchCharacter
    }), [user, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
