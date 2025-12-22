import React, {useMemo, useState} from 'react';
import styles from '@/app/styles/App.module.scss';
import {useAppStore} from '@/shared/model/AppStore';
import {useAuth} from '@/app/providers/AuthContext';
import CustomEventModal from '@/features/event/create/CustomEventModal';
import EventRosterModal from '@/features/event/roster/EventRosterModal';

export default function EventsPage() {
    const {events, rsvp, hasPermission} = useAppStore();
    const {user} = useAuth();
    const [showCreate, setShowCreate] = useState(false);
    const [rosterFor, setRosterFor] = useState<string | null>(null);

    // Determine the primary character for RSVP operations (Main or First)
    const targetCharId = user?.mainCharacterId || (user?.characters?.[0]?.id);

    return (
        <div>
            <div className={styles.pageTitle}>События</div>
            <div style={{display: 'flex', gap: 8, marginBottom: 12}}>
                {hasPermission('CAN_CREATE_EVENTS') && (
                    <button className="btn" onClick={() => setShowCreate(true)}>Создать событие</button>
                )}
            </div>
            <div className="grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12}}>
                {events.map(e => {
                    const myStatus = targetCharId
                        ? e.participants.find(p => p.characterId === targetCharId)?.status
                        : undefined;
                    const isAutoPve = ['CLAN_HALL', 'RHYTHM', 'FORBIDDEN_KNOWLEDGE'].includes(e.type);

                    return (
                        <div className="card" key={e.id}
                             style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
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
                                <div className="btn secondary"
                                     style={{cursor: 'default', fontSize: 12, padding: '4px 8px'}}>
                                    {e.participants.length} уч.
                                </div>
                            </div>

                            <div style={{flex: 1}}>
                                {/* Spacer or content */}
                            </div>

                            <div style={{marginBottom: 12}}>
                                {!['CLAN_HALL', 'RHYTHM', 'FORBIDDEN_KNOWLEDGE'].includes(e.type) && (
                                    hasPermission('CAN_MANAGE_SQUADS') ? (
                                        <button className="btn secondary" style={{width: '100%'}}
                                                onClick={() => setRosterFor(e.id)}>Роспись отрядов</button>
                                    ) : (
                                        (e.squads && e.squads.length > 0) ? (
                                            <button className="btn secondary" style={{width: '100%'}}
                                                    onClick={() => setRosterFor(e.id)}>Ваш отряд</button>
                                        ) : (
                                            <div style={{fontSize: 12, color: 'var(--muted)', textAlign: 'center'}}>Вы
                                                еще не расписаны</div>
                                        )
                                    )
                                )}
                            </div>

                            {/* RSVP Section */}
                            <div style={{borderTop: '1px solid var(--border)', paddingTop: 12}}>
                                {isAutoPve ? (
                                    <div style={{fontSize: 12, color: 'var(--muted)', textAlign: 'center'}}>
                                        Автоматический учёт активности
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
                })}
                {events.length === 0 && <div className="card">Событий пока нет</div>}
            </div>

            {showCreate && <CustomEventModal onClose={() => setShowCreate(false)}/>}
            {rosterFor && <EventRosterModal eventId={rosterFor} onClose={() => setRosterFor(null)}/>}
        </div>
    );
}
