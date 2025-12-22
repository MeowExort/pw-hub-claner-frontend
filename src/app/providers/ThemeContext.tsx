import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import type {ThemeName} from '@/shared/types';

interface ThemeContextValue {
    theme: ThemeName;
    setTheme: (t: ThemeName) => void;
    themes: ThemeName[];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const storageKey = 'pw.theme';
const defaultTheme: ThemeName = 'blue';

export function ThemeProvider({children}: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeName>(() => {
        const s = localStorage.getItem(storageKey) as ThemeName | null;
        return s ?? defaultTheme;
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(storageKey, theme);
    }, [theme]);

    const setTheme = (t: ThemeName) => setThemeState(t);

    const value = useMemo<ThemeContextValue>(() => ({
        theme,
        setTheme,
        themes: ['blue', 'purple', 'teal', 'orange', 'pink', 'green']
    }), [theme]);
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
