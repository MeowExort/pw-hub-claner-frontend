import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {createPortal} from 'react-dom';

type Toast = { id: string; message: string; type?: 'info' | 'success' | 'error' };

interface ToastContextValue {
    notify: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({children}: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const notify = useCallback((message: string, type: Toast['type'] = 'info') => {
        const t: Toast = {id: Math.random().toString(36).slice(2), message, type};
        setToasts(prev => [...prev, t]);
        setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3500);
    }, []);

    const value = useMemo(() => ({notify}), [notify]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            {createPortal(
                <div id="toast-root">
                    {toasts.map(t => (
                        <div key={t.id} className="toast" role="status" aria-live="polite">
                            {t.message}
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}
