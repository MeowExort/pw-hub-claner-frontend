import React, {useMemo, useState, useEffect, useRef} from 'react';
import styles from '@/app/styles/App.module.scss';
import {useAppStore} from '@/shared/model/AppStore';
import {useAuth} from '@/app/providers/AuthContext';
import CustomEventModal from '@/features/event/create/CustomEventModal';
import EventRosterModal from '@/features/event/roster/EventRosterModal';
import EventRosterViewerModal from '@/features/event/roster/EventRosterViewerModal';
import EventFeedbackModal from '@/features/event/feedback/EventFeedbackModal';
import { SquadFeedbackMonitorModal } from '@/features/event/feedback/SquadFeedbackMonitorModal';
import type { ClanEvent } from '@/shared/types';

export default function EventsPage() {
    const { events, historyEvents, loadingHistory, hasMoreHistory, loadMoreHistory, rsvp, deleteEvent, hasPermission } = useAppStore();
    const { user } = useAuth();
    const [showCreate, setShowCreate] = useState(false);
    const [rosterFor, setRosterFor] = useState<string | null>(null);
    const [monitorFor, setMonitorFor] = useState<string | null>(null);
    const [feedbackFor, setFeedbackFor] = useState<{ eventId: string, squadId: string } | null>(null);
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMoreHistory && !loadingHistory) {
                    loadMoreHistory();
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMoreHistory, loadingHistory, loadMoreHistory]);

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Вы уверены, что хотите удалить событие "${name}"?`)) {
            await deleteEvent(id);
        }
    };

    // Determine the primary character for RSVP operations (Main or First)
    const targetCharId = user?.mainCharacterId || (user?.characters?.[0]?.id);

    const renderEventCard = (e: ClanEvent) => {
        const myStatus = targetCharId
            ? e.participants.find(p => p.characterId === targetCharId)?.status
            : undefined;
        const isAutoPve = ['CLAN_HALL', 'RHYTHM', 'FORBIDDEN_KNOWLEDGE'].includes(e.type);
        const isPast = new Date(e.date) < new Date();

        return (
            <div className="card" key={e.id}
                 style={{display: 'flex', flexDirection: 'column', height: '100%', opacity: isPast ? 0.8 : 1}}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 12
                }}>
                    <div>
                        <div style={{fontWeight: 700, fontSize: '1.1rem'}}>{e.name}</div>
                        <div style={{color: 'var(--muted)', fontSize: 12, marginTop: 4}}>
                            {new Date(e.date).toLocaleString()}
                        </div>
                        <div style={{color: 'var(--muted)', fontSize: 12}}>
                            {e.type} • {e.status}
                        </div>
                    </div>
                    <div style={{display: 'flex', gap: 8, alignItems: 'flex-start'}}>
                        <div className="btn secondary"
                             style={{cursor: 'default', fontSize: 12, padding: '4px 8px'}}>
                            {e.participants.length} уч.
                        </div>
                        {!isPast && hasPermission('CAN_DELETE_EVENTS') && (
                            <button
                                className="btn"
                                onClick={() => handleDelete(e.id, e.name)}
                                style={{
                                    background: '#f7768e',
                                    color: '#fff',
                                    padding: '4px 8px',
                                    fontSize: 12,
                                    minWidth: 'auto'
                                }}
                                title="Удалить событие"
                            >
                                🗑️
                            </button>
                        )}
                    </div>
                </div>

                <div style={{flex: 1}}>
                    {/* Spacer or content */}
                </div>

                <div style={{marginBottom: 12}}>
                    {isPast && hasPermission('CAN_EDIT_EVENTS') && (e.squads || []).some(s => !s.feedbackSubmitted) && (
                        <button 
                            className="btn" 
                            style={{width: '100%', marginBottom: 8, background: 'var(--warning)', color: '#000'}}
                            onClick={() => setMonitorFor(e.id)}
                        >
                            ОС от ПЛов
                        </button>
                    )}
                    {!['CLAN_HALL', 'RHYTHM', 'FORBIDDEN_KNOWLEDGE'].includes(e.type) && (() => {
                        const canManage = hasPermission('CAN_MANAGE_SQUADS');
                        const isMember = targetCharId && e.squads?.some(s => s.members.includes(targetCharId));
                        const isParticipant = targetCharId && e.participants?.some(p => p.characterId === targetCharId && p.attendance);
                        
                        if (canManage || isMember || isParticipant) {
                            return (
                                <button className="btn secondary" style={{width: '100%'}}
                                        onClick={() => setRosterFor(e.id)}>
                                    {canManage ? 'Роспись отрядов' : 'Ваш отряд'}
                                </button>
                            );
                        }
                        
                        return (
                            <div style={{fontSize: 12, color: 'var(--muted)', textAlign: 'center'}}>
                                {isPast ? 'Отряды не были сформированы' : 'Вы еще не расписаны'}
                            </div>
                        );
                    })()}
                </div>

                {/* RSVP Section */}
                <div style={{borderTop: '1px solid var(--border)', paddingTop: 12}}>
                    {isAutoPve ? (
                        <div style={{fontSize: 12, color: 'var(--muted)', textAlign: 'center'}}>
                            Автоматический учёт активности
                        </div>
                    ) : isPast ? (
                        <div style={{fontSize: 12, color: 'var(--muted)', textAlign: 'center'}}>
                            Событие завершено {myStatus ? `(Ваш статус: ${myStatus})` : ''}
                        </div>
                    ) : (
                        targetCharId ? (
                            <div style={{display: 'flex', gap: 6}}>
                                <button
                                    className={`btn ${myStatus === 'GOING' ? '' : 'secondary'}`}
                                    style={{flex: 1}}
                                    onClick={() => rsvp(e.id, targetCharId, 'GOING')}
                                    disabled={myStatus === 'GOING'}
                                >
                                    Пойду
                                </button>
                                <button
                                    className={`btn ${myStatus === 'NOT_GOING' ? '' : 'secondary'}`}
                                    style={{flex: 1}}
                                    onClick={() => rsvp(e.id, targetCharId, 'NOT_GOING')}
                                    disabled={myStatus === 'NOT_GOING'}
                                >
                                    Пас
                                </button>
                                <button
                                    className={`btn ${myStatus === 'UNDECIDED' ? '' : 'secondary'}`}
                                    onClick={() => rsvp(e.id, targetCharId, 'UNDECIDED')}
                                    disabled={myStatus === 'UNDECIDED'}
                                >
                                    ?
                                </button>
                            </div>
                        ) : (
                            <div style={{fontSize: 12, color: 'var(--danger)', textAlign: 'center'}}>
                                Создайте персонажа для участия
                            </div>
                        )
                    )}
                </div>
            </div>
        );
    };

    return (
        <div>
            <div className={styles.pageTitle}>События</div>
            <div style={{display: 'flex', gap: 8, marginBottom: 12}}>
                {hasPermission('CAN_CREATE_EVENTS') && (
                    <button className="btn" onClick={() => setShowCreate(true)}>Создать событие</button>
                )}
            </div>
            
            <div className="grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12, marginBottom: 24}}>
                {events.map(e => renderEventCard(e))}
                {events.length === 0 && <div className="card">Актуальных событий пока нет</div>}
            </div>

            { (historyEvents.length > 0 || hasMoreHistory) && (
                <>
                    <div className={styles.pageTitle} style={{marginTop: 40, fontSize: '1.2rem'}}>История событий</div>
                    <div className="grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12}}>
                        {historyEvents.map(e => renderEventCard(e))}
                    </div>
                    
                    <div ref={observerTarget} style={{ height: 20, marginTop: 12, display: 'flex', justifyContent: 'center' }}>
                        {loadingHistory && <div className="spinner" />}
                    </div>
                </>
            )}

            {showCreate && <CustomEventModal onClose={() => setShowCreate(false)}/>}
            {rosterFor && (hasPermission('CAN_MANAGE_SQUADS') ? (
                <EventRosterModal eventId={rosterFor} onClose={() => setRosterFor(null)}/>
            ) : (
                <EventRosterViewerModal eventId={rosterFor} onClose={() => setRosterFor(null)}/>
            ))}
            {monitorFor && (() => {
                const ev = [...events, ...historyEvents].find(e => e.id === monitorFor);
                if (!ev) return null;
                return (
                    <SquadFeedbackMonitorModal 
                        event={ev} 
                        onClose={() => setMonitorFor(null)} 
                        onSelectSquad={(squadId) => {
                            setFeedbackFor({ eventId: ev.id, squadId });
                            setMonitorFor(null);
                        }}
                    />
                );
            })()}
            {feedbackFor && (() => {
                const ev = [...events, ...historyEvents].find(e => e.id === feedbackFor.eventId);
                if (!ev) return null;
                return (
                    <EventFeedbackModal 
                        event={ev} 
                        overrideSquadId={feedbackFor.squadId}
                        onClose={() => setFeedbackFor(null)}
                    />
                );
            })()}
        </div>
    );
}
