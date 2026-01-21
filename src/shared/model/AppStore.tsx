import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import type {
    Character,
    CharacterClass,
    Clan,
    ClanApplication,
    ClanEvent,
    ClanMember,
    ClanSettings
} from '@/shared/types';
import {clanApi, eventsApi, userApi} from '@/shared/api';
import {useToast} from '@/app/providers/ToastContext';
import {useAuth} from '@/app/providers/AuthContext';
import {startOfIsoWeek} from '@/shared/lib/date';

interface AppStoreValue {
    clan: Clan | null;
    events: ClanEvent[];
    historyEvents: ClanEvent[];
    loading: boolean;
    loadingHistory: boolean;
    hasMoreHistory: boolean;
    refreshAll: (silent?: boolean, weekIso?: string) => Promise<void>;
    loadMoreHistory: () => Promise<void>;
    createClan: (name: string, icon: string, description: string) => Promise<void>;
    applyToClan: (clanId: string, message?: string) => Promise<void>;
    leaveClan: (clanId: string) => Promise<void>;
    listClans: () => Promise<Clan[]>;
    updateClanSettings: (settings: Partial<ClanSettings>) => Promise<void>;
    createEvent: (payload: {
        name: string;
        type: ClanEvent['type'];
        date: string;
        description?: string;
        opponent?: string;
        rallyTime?: string;
    }) => Promise<void>;
    rsvp: (eventId: string, characterId: string, status: 'GOING' | 'NOT_GOING' | 'UNDECIDED') => Promise<void>;
    setSquads: (eventId: string, squads: ClanEvent['squads']) => Promise<void>;
    deleteEvent: (id: string) => Promise<void>;
    updatePermissions: (role: NonNullable<Clan['members']>[number]['role'], permissions: string[]) => Promise<void>;
    setRhythmReportUploadedThisWeek: (uploaded: boolean) => Promise<void>;
    setForbiddenReportUploadedThisWeek: (uploaded: boolean) => Promise<void>;
    resolveCharacterNames: (ids: string[]) => Promise<Record<string, { name: string; class: CharacterClass }>>;
    getClanRoster: () => Promise<(Character & ClanMember)[]>;
    getApplications: () => Promise<ClanApplication[]>;
    processApplication: (appId: string, decision: 'APPROVE' | 'REJECT') => Promise<void>;
    changeMemberRole: (memberId: string, role: string) => Promise<void>;
    kickMember: (memberId: string) => Promise<void>;
    hasPermission: (permission: string) => boolean;
}

const AppStore = createContext<AppStoreValue | undefined>(undefined);

export function AppStoreProvider({children}: { children: React.ReactNode }) {
    const {user} = useAuth();
    const [clan, setClan] = useState<Clan | null>(null);
    const [events, setEvents] = useState<ClanEvent[]>([]);
    const [historyEvents, setHistoryEvents] = useState<ClanEvent[]>([]);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);
    const {notify} = useToast();
    const weeklyEventsChecked = React.useRef(false);
    const currentWeekIso = React.useRef<string | undefined>(undefined);

    const checkWeeklyEvents = async () => {
        if (weeklyEventsChecked.current) return;
        weeklyEventsChecked.current = true;

        try {
            const ev = await eventsApi.listEvents();
            const start = startOfIsoWeek(new Date());
            const end = new Date(start);
            end.setDate(end.getDate() + 7);

            const exists = (t: ClanEvent['type']) => ev.some(e => e.type === t && new Date(e.date) >= start && new Date(e.date) < end);

            //const tasks = [];
            //if (!exists('RHYTHM')) {
            // tasks.push(eventsApi.createEvent({ name: 'Ритм гильдии', type: 'RHYTHM', date: thisWeekWednesdayAt('19:30').toISOString(), description: 'Автосоздано' }));
            //}
            //if (!exists('FORBIDDEN_KNOWLEDGE')) {
            //  tasks.push(eventsApi.createEvent({ name: 'Запретное учение', type: 'FORBIDDEN_KNOWLEDGE', date: thisWeekWednesdayAt('20:00').toISOString(), description: 'Автосоздано' }));
            //}
            //if (!exists('CLAN_HALL')) {
            //tasks.push(eventsApi.createEvent({ name: 'Клан Холл', type: 'CLAN_HALL', date: start.toISOString(), description: 'Недельный прогресс' }));
            //}

            //if (tasks.length > 0) {
            //await Promise.all(tasks);
            //}
        } catch (e) {
            console.error('Failed to check weekly events', e);
        }
    };

    const refreshAll = React.useCallback(async (silent: boolean = false, weekIso?: string) => {
        if (!silent) setLoading(true);
        if (weekIso) currentWeekIso.current = weekIso;
        try {
            // We pass user.mainCharacterId explicitly to be safe, though API defaults to it
            // But wait, userApi.getMyClan() in mock detects it from session.
            const targetWeek = weekIso || currentWeekIso.current;
            const [c, ev, perms] = await Promise.all([
                userApi.getMyClan(targetWeek),
                eventsApi.listEvents({ history: false }),
                userApi.getMyPermissions()
            ]);

            setEvents(ev);
            setHistoryEvents([]); // Reset history on refresh
            setHasMoreHistory(true);
            setLoadingHistory(false);

            if (c && (!c.members || c.members.length === 0)) {
                try {
                    const roster = await clanApi.getClanRoster(c.id) as (Character & ClanMember)[];
                    c.members = roster.map(r => ({
                        userId: r.userId,
                        characterId: r.characterId,
                        name: r.name,
                        class: r.class,
                        role: r.role,
                        joinDate: r.joinDate
                    }));
                } catch (e) {
                    console.error('Failed to fetch clan roster to populate members', e);
                }
            }

            setClan(c);
            setEvents(ev);
            setPermissions(perms);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    const hasPermission = (p: string) => permissions.includes(p);

    useEffect(() => {
        if (user) {
            void refreshAll();
            void checkWeeklyEvents();

            const interval = setInterval(() => {
                void refreshAll(true);
            }, 15000);
            return () => clearInterval(interval);
        } else {
            setClan(null);
            setEvents([]);
        }
    }, [user?.mainCharacterId, user?.id, refreshAll]);

    const createClan = useCallback(async (name: string, icon: string, description: string) => {
        await clanApi.createClan({name, icon, description});
        notify('Клан создан', 'success');
        await refreshAll();
    }, [notify, refreshAll]);

    const applyToClan = useCallback(async (clanId: string, message: string = '') => {
        await clanApi.applyToClan(clanId, {message});
        notify('Заявка отправлена', 'success');
        await refreshAll();
    }, [notify, refreshAll]);

    const getApplications = useCallback(async () => {
        if (!clan) return [];
        return clanApi.getClanApplications(clan.id);
    }, [clan]);

    const processApplication = useCallback(async (appId: string, decision: 'APPROVE' | 'REJECT') => {
        if (!clan) return;
        await clanApi.processApplication(clan.id, appId, {decision});
        notify(`Заявка ${decision === 'APPROVE' ? 'принята' : 'отклонена'}`, 'success');
        await refreshAll();
    }, [clan, notify, refreshAll]);

    const leaveClan = useCallback(async (clanId: string) => {
        try {
            await clanApi.leaveClan(clanId);
            notify('Вы покинули клан', 'success');
        } finally {
            setClan(null);
            setEvents([]);
            setPermissions([]);
        }
    }, [notify]);

    const listClans = useCallback(async () => {
        return clanApi.listClans();
    }, []);

    const updateClanSettings: AppStoreValue['updateClanSettings'] = useCallback(async (settings) => {
        if (!clan) return;
        await clanApi.updateClanSettings(clan.id, settings);
        notify('Настройки клана обновлены', 'success');
        await refreshAll();
    }, [clan, notify, refreshAll]);

    const createEvent: AppStoreValue['createEvent'] = useCallback(async (payload) => {
        await eventsApi.createEvent(payload as any);
        notify('Событие создано', 'success');
        await refreshAll();
    }, [notify, refreshAll]);

    const rsvp: AppStoreValue['rsvp'] = useCallback(async (eventId, characterId, status) => {
        await eventsApi.rsvpToEvent(eventId, {characterId, status});
        await refreshAll();
    }, [refreshAll]);

    const setSquads: AppStoreValue['setSquads'] = useCallback(async (eventId, squads) => {
        await eventsApi.setEventSquads(eventId, squads || []);
        notify('Отряды обновлены', 'success');
        await refreshAll();
    }, [notify, refreshAll]);

    const deleteEvent: AppStoreValue['deleteEvent'] = useCallback(async (id) => {
        await eventsApi.deleteEvent(id);
        notify('Событие удалено', 'success');
        await refreshAll();
    }, [notify, refreshAll]);

    const setRhythmReportUploadedThisWeek: AppStoreValue['setRhythmReportUploadedThisWeek'] = useCallback(async (uploaded) => {
        // Найти событие RHYTHM на этой неделе (среда 19:30); если нет — создать.
        const wed = thisWeekWednesdayAt('19:30');
        const startOfWeek = startOfIsoWeek(new Date());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 7);
        const ev = events.find(e => e.type === 'RHYTHM' && new Date(e.date) >= startOfWeek && new Date(e.date) < endOfWeek);
        let targetId: string;
        if (ev) {
            targetId = ev.id;
        } else {
            const created = await eventsApi.createEvent({
                name: 'Ритм гильдии',
                type: 'RHYTHM',
                date: wed.toISOString(),
                description: 'Автосоздано (мок)'
            });
            targetId = created.id;
        }
        await eventsApi.updateEvent(targetId, {reportUploaded: uploaded});
        notify(uploaded ? 'Отчёт по Ритму загружен' : 'Отчёт по Ритму снят', 'success');
        await refreshAll();
    }, [events, notify, refreshAll]);

    const setForbiddenReportUploadedThisWeek: AppStoreValue['setForbiddenReportUploadedThisWeek'] = useCallback(async (uploaded) => {
        // Найти событие FORBIDDEN_KNOWLEDGE на этой неделе (среда 20:00); если нет — создать.
        const wedFk = thisWeekWednesdayAt('20:00');
        const startOfWeek = startOfIsoWeek(new Date());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 7);
        const ev = events.find(e => e.type === 'FORBIDDEN_KNOWLEDGE' && new Date(e.date) >= startOfWeek && new Date(e.date) < endOfWeek);
        let targetId: string;
        if (ev) {
            targetId = ev.id;
        } else {
            const created = await eventsApi.createEvent({
                name: 'Запретное учение',
                type: 'FORBIDDEN_KNOWLEDGE',
                date: wedFk.toISOString(),
                description: 'Автосоздано (мок)'
            });
            targetId = created.id;
        }
        await eventsApi.updateEvent(targetId, {reportUploaded: uploaded});
        notify(uploaded ? 'Отчёт по ЗУ загружен' : 'Отчёт по ЗУ снят', 'success');
        await refreshAll();
    }, [events, notify, refreshAll]);

    const resolveCharacterNames: AppStoreValue['resolveCharacterNames'] = useCallback(async (ids) => {
        return await clanApi.lookupCharacters({ids});
    }, []);

    const updatePermissions: AppStoreValue['updatePermissions'] = useCallback(async (role, permissions) => {
        if (!clan) return;
        await clanApi.updateRolePermissions(clan.id, {role, permissions});
        notify('Права обновлены', 'success');
        await refreshAll();
    }, [clan, notify, refreshAll]);

    const getClanRoster: AppStoreValue['getClanRoster'] = useCallback(async () => {
        if (!clan) return [];
        return await clanApi.getClanRoster(clan.id);
    }, [clan]);

    const changeMemberRole = useCallback(async (memberId: string, role: string) => {
        if (!clan) return;
        await clanApi.changeMemberRole(clan.id, memberId, role);
        notify('Роль обновлена', 'success');
        // Run refresh in background to keep UI snappy
        refreshAll().catch(err => console.error('Background refresh failed', err));
    }, [clan, notify, refreshAll]);

    const kickMember = useCallback(async (memberId: string) => {
        if (!clan) return;
        await clanApi.kickMember(clan.id, memberId);
        notify('Персонаж исключен из клана', 'success');
        refreshAll().catch(err => console.error('Background refresh failed', err));
    }, [clan, notify, refreshAll]);

    const loadMoreHistory: AppStoreValue['loadMoreHistory'] = useCallback(async () => {
        if (loadingHistory || !hasMoreHistory) return;
        setLoadingHistory(true);
        try {
            const limit = 10;
            const ev = await eventsApi.listEvents({
                limit,
                offset: historyEvents.length,
                history: true
            });
            if (ev.length < limit) {
                setHasMoreHistory(false);
            }
            setHistoryEvents(prev => [...prev, ...ev]);
        } catch (e) {
            console.error('Failed to load history', e);
        } finally {
            setLoadingHistory(false);
        }
    }, [historyEvents.length, loadingHistory, hasMoreHistory]);

    const value = useMemo<AppStoreValue>(() => ({
        clan,
        events,
        historyEvents,
        loading,
        loadingHistory,
        hasMoreHistory,
        refreshAll,
        loadMoreHistory,
        createClan,
        updateClanSettings,
        createEvent,
        rsvp,
        setSquads,
        deleteEvent,
        updatePermissions,
        setRhythmReportUploadedThisWeek,
        setForbiddenReportUploadedThisWeek,
        resolveCharacterNames,
        getClanRoster,
        applyToClan,
        leaveClan,
        listClans,
        getApplications,
        processApplication,
        changeMemberRole,
        kickMember,
        hasPermission
    }), [
        clan, events, historyEvents, loading, loadingHistory, hasMoreHistory, refreshAll, loadMoreHistory, createClan, updateClanSettings, createEvent, rsvp, setSquads, deleteEvent, updatePermissions, setRhythmReportUploadedThisWeek, setForbiddenReportUploadedThisWeek, resolveCharacterNames, getClanRoster,
        applyToClan, leaveClan, listClans, getApplications, processApplication, changeMemberRole, kickMember, permissions
    ]);

    return <AppStore.Provider value={value}>{children}</AppStore.Provider>;
}

export function useAppStore() {
    const ctx = useContext(AppStore);
    if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider');
    return ctx;
}

function thisWeekWednesdayAt(timeHHmm: string) {
    const [hh, mm] = timeHHmm.split(':').map(n => parseInt(n, 10));
    const start = startOfIsoWeek(new Date()); // Monday 00:00
    const wed = new Date(start);
    wed.setDate(start.getDate() + 2); // Wed: Mon + 2 days
    wed.setHours(hh || 0, mm || 0, 0, 0);
    return wed;
}

function thisWeekSaturdayAt(timeHHmm: string) {
    const [hh, mm] = timeHHmm.split(':').map(n => parseInt(n, 10));
    const start = startOfIsoWeek(new Date()); // Monday 00:00
    const sat = new Date(start);
    sat.setDate(start.getDate() + 5); // Sat: Mon + 5 days
    sat.setHours(hh || 0, mm || 0, 0, 0);
    return sat;
}
