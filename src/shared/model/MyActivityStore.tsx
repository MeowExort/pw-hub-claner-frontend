import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {userApi} from '@/shared/api';
import {useAuth} from '@/app/providers/AuthContext';
import {isoWeekKey} from '@/shared/lib/date';
import type {MyActivityData} from '@/shared/types';

interface MyActivityValue {
    data: MyActivityData | null;
    loading: boolean;
    week: string;
    setWeek: (w: string) => void;
    refresh: () => Promise<void>;
    update: (patch: Partial<MyActivityData>) => Promise<void>;
}

const Ctx = createContext<MyActivityValue | undefined>(undefined);

export function MyActivityProvider({children}: { children: React.ReactNode }) {
    const {user} = useAuth();
    const [data, setData] = useState<MyActivityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [week, setWeek] = useState(isoWeekKey(new Date()));

    const refresh = async () => {
        if (!user) {
            setData(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const d = await userApi.getMyActivity(week);
            setData(d);
        } finally {
            setLoading(false);
        }
    };

    const update = async (patch: Partial<MyActivityData>) => {
        const d = await userApi.updateMyActivity(patch);
        setData(d);
    };

    useEffect(() => {
        void refresh();
    }, [user, week]);

    const value = useMemo<MyActivityValue>(() => ({
        data,
        loading,
        week,
        setWeek,
        refresh,
        update
    }), [data, loading, week]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMyActivity() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error('useMyActivity must be used within MyActivityProvider');
    return ctx;
}
