export const ls = {
    get<T>(key: string, fallback: T): T {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw) as T;
        } catch {
            return fallback;
        }
    },
    set<T>(key: string, value: T) {
        localStorage.setItem(key, JSON.stringify(value));
    }
};

export function uid(prefix = ''): string {
    return prefix + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function nowIso() {
    return new Date().toISOString();
}
