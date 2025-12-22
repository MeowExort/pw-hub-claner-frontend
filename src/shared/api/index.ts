import type {User, Character, Clan, MyActivityData, ClanEvent, ClanSettings, Squad, WeeklyStats} from '@/shared/types';

// Resolve API base URL from Vite env, with production-safe default
const __env = (import.meta as any).env || {};
const __mode = __env.MODE || __env.NODE_ENV || 'development';
const API_URL = __env.VITE_API_URL || (__mode === 'production' ? 'https://api.claner.pw-hub.ru/api' : 'http://localhost:3000/api');

const getHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

const handleResponse = async (res: Response) => {
    if (!res.ok) {
        if (res.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('access_token');
            throw new Error('Unauthorized');
        }
        const text = await res.text();
        try {
            const json = JSON.parse(text);
            throw new Error(json.message || json.error || res.statusText);
        } catch (e: any) {
            throw new Error(text || res.statusText);
        }
    }
    return res.json();
};

export const userApi = {
    getCurrentUser: async (): Promise<User | null> => {
        const token = localStorage.getItem('access_token');
        if (!token) return null;
        try {
            const res = await fetch(`${API_URL}/users/me`, {
                headers: getHeaders(),
            });
            return handleResponse(res);
        } catch (e) {
            console.error("Failed to fetch user", e);
            return null;
        }
    },

    createCharacter: async (payload: Omit<Character, 'id'>): Promise<Character> => {
        const res = await fetch(`${API_URL}/users/me/characters`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        return handleResponse(res);
    },

    updateCharacter: async (payload: Partial<Character> & { id: string }): Promise<Character> => {
        const {id, ...body} = payload;
        const res = await fetch(`${API_URL}/users/me/characters/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(body),
        });
        return handleResponse(res);
    },

    switchActiveCharacter: async (payload: { characterId: string }): Promise<User> => {
        const res = await fetch(`${API_URL}/users/me/active-character`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        return handleResponse(res);
    },

    getMyClan: async (weekIso?: string): Promise<Clan | null> => {
        try {
            const url = weekIso ? `${API_URL}/users/me/clan?weekIso=${weekIso}` : `${API_URL}/users/me/clan`;
            const res = await fetch(url, {
                headers: getHeaders(),
            });
            return handleResponse(res);
        } catch (e) {
            // 404 means no clan usually
            return null;
        }
    },

    getMyActivity: async (week?: string): Promise<MyActivityData | null> => {
        try {
            const url = week ? `${API_URL}/users/me/activity?week=${week}` : `${API_URL}/users/me/activity`;
            const res = await fetch(url, {
                headers: getHeaders(),
            });
            return handleResponse(res);
        } catch (e) {
            return null;
        }
    },

    getMyPermissions: async (): Promise<string[]> => {
        try {
            const res = await fetch(`${API_URL}/users/me/permissions`, {
                headers: getHeaders(),
            });
            return handleResponse(res);
        } catch (e) {
            return [];
        }
    },

    updateMyActivity: async (patch: Partial<MyActivityData>): Promise<MyActivityData> => {
        const res = await fetch(`${API_URL}/users/me/activity`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(patch)
        });
        return handleResponse(res);
    }
};

export const clanApi = {
    listClans: async (): Promise<Clan[]> => {
        const res = await fetch(`${API_URL}/clans`, {headers: getHeaders()});
        return handleResponse(res);
    },
    createClan: async (payload: { name: string, icon: string, description: string }): Promise<Clan> => {
        const res = await fetch(`${API_URL}/clans`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(res);
    },
    getClanRoster: async (id: string) => {
        const res = await fetch(`${API_URL}/clans/${id}/members`, {headers: getHeaders()});
        return handleResponse(res);
    },
    leaveClan: async (clanId: string) => {
        const res = await fetch(`${API_URL}/clans/${clanId}/members/me`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (res.ok) return;
        await handleResponse(res);
    },
    getClanApplications: async (id: string) => {
        const res = await fetch(`${API_URL}/clans/${id}/applications`, {headers: getHeaders()});
        return handleResponse(res);
    },
    applyToClan: async (clanId: string, payload: { message?: string }) => {
        const res = await fetch(`${API_URL}/clans/${clanId}/applications`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(res);
    },
    processApplication: async (id: string, appId: string, payload: { decision: 'APPROVE' | 'REJECT' }) => {
        const res = await fetch(`${API_URL}/clans/${id}/applications/${appId}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(res);
    },
    updateClanSettings: async (id: string, settings: Partial<ClanSettings>) => {
        const res = await fetch(`${API_URL}/clans/${id}/settings`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(settings)
        });
        return handleResponse(res);
    },
    changeMemberRole: async (clanId: string, memberId: string, role: string) => {
        const res = await fetch(`${API_URL}/clans/${clanId}/members/${memberId}/role`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({role})
        });
        return handleResponse(res);
    },
    updateRolePermissions: async (id: string, payload: { role: string, permissions: string[] }) => {
        const res = await fetch(`${API_URL}/clans/${id}/permissions`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(res);
    },
    lookupCharacters: async (payload: { ids: string[] }) => {
        const res = await fetch(`${API_URL}/characters/lookup`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(res);
    },

    getAuditLogs: async (clanId: string, limit = 100, offset = 0, filters?: any) => {
        const params = new URLSearchParams({limit: String(limit), offset: String(offset)});
        if (filters) {
            if (filters.action) params.append('action', filters.action);
            if (filters.actorId) params.append('actorId', filters.actorId);
            if (filters.target) params.append('target', filters.target);
            if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.append('dateTo', filters.dateTo);
        }

        const res = await fetch(`${API_URL}/clans/${clanId}/audit?${params.toString()}`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    uploadHistory: async (id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_URL}/clans/${id}/history/upload`, {
            method: 'POST',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
            },
            body: formData
        });
        return handleResponse(res);
    },

    getUploadTask: async (id: string, taskId: string) => {
        const res = await fetch(`${API_URL}/clans/${id}/history/tasks/${taskId}`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    getWeeklySummary: async (id: string, week: string): Promise<WeeklyStats[]> => {
        const res = await fetch(`${API_URL}/clans/${id}/summary?week=${week}`, {
            method: 'GET',
            headers: getHeaders()
        });
        return handleResponse(res);
    },

    updateWeeklySummary: async (id: string, week: string, payload: any): Promise<WeeklyStats[]> => {
        const res = await fetch(`${API_URL}/clans/${id}/summary?week=${week}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(res);
    }
};

export const eventsApi = {
    listEvents: async (): Promise<ClanEvent[]> => {
        const res = await fetch(`${API_URL}/events`, {headers: getHeaders()});
        return handleResponse(res);
    },
    createEvent: async (payload: any) => {
        const res = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(res);
    },
    rsvpToEvent: async (id: string, payload: any) => {
        const res = await fetch(`${API_URL}/events/${id}/rsvp`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(res);
    },
    setEventSquads: async (id: string, squads: Squad[]) => {
        const res = await fetch(`${API_URL}/events/${id}/squads`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(squads)
        });
        return handleResponse(res);
    },
    updateEvent: async (id: string, payload: Partial<ClanEvent>) => {
        const res = await fetch(`${API_URL}/events/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });
        return handleResponse(res);
    }
};

export const tasksApi = {
    getTasks: async () => {
        const res = await fetch(`${API_URL}/tasks`, {headers: getHeaders()});
        return handleResponse(res);
    },
    getHistory: async (taskId?: string) => {
        const params = new URLSearchParams();
        if (taskId) params.append('taskId', taskId);
        const res = await fetch(`${API_URL}/tasks/history?${params.toString()}`, {headers: getHeaders()});
        return handleResponse(res);
    },
    runTask: async (id: string) => {
        const res = await fetch(`${API_URL}/tasks/${id}/run`, {
            method: 'POST',
            headers: getHeaders()
        });
        return handleResponse(res);
    }
};

