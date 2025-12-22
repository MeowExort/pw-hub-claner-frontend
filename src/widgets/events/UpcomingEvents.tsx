import React, {useMemo, useState} from 'react';
import {useAppStore} from '@/shared/model/AppStore';
import {useAuth} from '@/app/providers/AuthContext';
import s from '@/app/styles/Dashboard.module.scss';
import EventRosterModal from '@/features/event/roster/EventRosterModal';

export default function UpcomingEvents() {
    const {events, rsvp, hasPermission} = useAppStore();
    const {user} = useAuth();
    const [rosterFor, setRosterFor] = useState<string | null>(null);

    const canManage = hasPermission('CAN_MANAGE_SQUADS');

    const activeCharId = user?.mainCharacterId;

    const upcoming = useMemo(() => {
        const now = new Date();
        return [...events]
            .filter(e => e.status !== 'COMPLETED' && new Date(e.date) > now && !e.participants.find(p => p.characterId === activeCharId))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5);
    }, [events]);

    const hasPending = useMemo(() => {
        return upcoming.some(e => {
            const isAuto = ['CLAN_HALL', 'RHYTHM', 'FORBIDDEN_KNOWLEDGE'].includes(e.type);
            if (isAuto) return false;
            if (!activeCharId) return false;

            const p = e.participants.find(p => p.characterId === activeCharId);
            const st = p?.status;
            return st !== 'GOING' && st !== 'NOT_GOING';
        });
    }, [upcoming, activeCharId]);

    const [manualState, setManualState] = useState<'EXPANDED' | 'COLLAPSED' | null>(null);
    const isCollapsed = manualState === 'COLLAPSED' || (manualState === null && !hasPending);

    const toggleCollapse = () => {
        setManualState(prev => {
            const current = prev === 'COLLAPSED' || (prev === null && !hasPending);
            return current ? 'EXPANDED' : 'COLLAPSED';
        });
    };

    return (
        <section className={s.cardSection}>
            <div className={s.sectionTitle}>
                <span>🗓️ Требуется отпись</span>
                <button
                    className="btn secondary small"
                    style={{
                        marginLeft: 'auto',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onClick={toggleCollapse}
                    title={isCollapsed ? 'Развернуть' : 'Свернуть'}
                >
                    {isCollapsed ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 15l-6-6-6 6"/>
                        </svg>
                    )}
                </button>
            </div>
            {!isCollapsed && (
                <div className={s.eventsList}>
                    {upcoming.map(e => {
                        const goingCount = e.participants.filter(p => p.status === 'GOING').length;
                        const total = Math.max(goingCount, 120);
                        const progress = Math.min(100, Math.round((goingCount / total) * 100));
                        return (
                            <div key={e.id} className={s.eventCard}>
                                <div className={s.eventHeader}>
                                    <div className={s.eventTitle}>
                                        <span>{iconForEvent(e.type, e.name)}</span>
                                        <span>{e.name}</span>
                                    </div>
                                    <div className={s.eventActions}>
                                        {['CLAN_HALL', 'RHYTHM', 'FORBIDDEN_KNOWLEDGE'].includes(e.type) ? (
                                            <div style={{fontSize: 12, color: 'var(--muted)'}}>Автоматический учёт</div>
                                        ) : (
                                            <>
                                                {canManage ? (
                                                    <button className="btn"
                                                            onClick={() => setRosterFor(e.id)}>Роспись</button>
                                                ) : (
                                                    (e.squads && e.squads.length > 0) ? (
                                                        <button className="btn secondary"
                                                                onClick={() => setRosterFor(e.id)}>Ваш отряд</button>
                                                    ) : (
                                                        <span style={{
                                                            fontSize: 12,
                                                            color: 'var(--muted)',
                                                            marginRight: 8
                                                        }}>Вы еще не расписаны</span>
                                                    )
                                                )}
                                                {activeCharId && (() => {
                                                    const st = e.participants.find(p => p.characterId === activeCharId)?.status;
                                                    return (
                                                        <div style={{display: 'flex', gap: 6}}>
                                                            <button className="btn"
                                                                    onClick={() => rsvp(e.id, activeCharId, 'GOING')}
                                                                    disabled={st === 'GOING'}>Пойду
                                                            </button>
                                                            <button className="btn secondary"
                                                                    onClick={() => rsvp(e.id, activeCharId, 'NOT_GOING')}
                                                                    disabled={st === 'NOT_GOING'}>Не пойду
                                                            </button>
                                                        </div>
                                                    );
                                                })()}
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div style={{color: 'var(--muted)', textTransform: 'capitalize'}}>
                                    {new Date(e.date).toLocaleString('ru-RU', {
                                        weekday: 'long',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                                {e.type === 'CLAN_HALL' ? (
                                    <div className={s.progressText}>
                                        <div className={s.progressBar}>
                                            <div className={s.progressFill} style={{width: `${progress}%`}}/>
                                        </div>
                                        <div className={s.progressText}>Этап 3: {goingCount} / {total} участников</div>
                                    </div>
                                ) : (
                                    <div className={s.progressText}>{goingCount} участников идут</div>
                                )}
                            </div>
                        );
                    })}
                    {upcoming.length === 0 && <div className="card">Нет запланированных событий</div>}
                </div>
            )}

            {rosterFor && <EventRosterModal eventId={rosterFor} onClose={() => setRosterFor(null)}/>}
        </section>
    );
}

function iconForEvent(type: string, name?: string) {
    if (name && name.toLowerCase().includes('дракон')) return '🐉';
    switch (type) {
        case 'CLAN_HALL':
            return '🏛️';
        case 'RHYTHM':
            return '💃';
        case 'FORBIDDEN_KNOWLEDGE':
            return '📚';
        default:
            return '📅';
    }
}
