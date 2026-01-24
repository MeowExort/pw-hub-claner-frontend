import React, {useMemo, useState, useEffect} from 'react';
import {useAppStore} from '@/shared/model/AppStore';
import type {Squad, Character} from '@/shared/types';
import CharacterTooltip from '@/shared/ui/CharacterTooltip/CharacterTooltip';
import {socket} from '@/shared/api/socket';
import {ClassIcon} from '@/shared/ui/ClassIcon';
import {useAuth} from '@/app/providers/AuthContext';

export default function EventRosterViewerModal({eventId, onClose}: { eventId: string; onClose: () => void }) {
    const {events, getClanRoster} = useAppStore();
    const {user} = useAuth();
    const ev = events.find(e => e.id === eventId);

    const [rosterMap, setRosterMap] = useState<Record<string, Character>>({});
    const [isSynced, setIsSynced] = useState(false);

    useEffect(() => {
        getClanRoster().then(roster => {
            const map: Record<string, Character> = {};
            roster.forEach(c => map[c.id] = c);
            setRosterMap(map);
        }).catch(console.error);
    }, [getClanRoster]);

    const [localSquads, setLocalSquads] = useState<Squad[]>(() => {
        return ev?.squads || [];
    });

    // Filter squads to show only mine
    const displayedSquads = useMemo(() => {
        const myIds = user?.characters?.map(c => c.id) || [];
        if (myIds.length === 0) return [];
        return localSquads.filter(s => s.members.some(m => myIds.includes(m)));
    }, [localSquads, user?.characters]);
    console.log(displayedSquads);

    // Socket connection (Read Only)
    useEffect(() => {
        if (!ev) return;
        setIsSynced(false);
        socket.connect();
        socket.emit('joinEvent', {eventId: ev.id});

        const handleSquadsUpdated = (squads: Squad[]) => {
            setLocalSquads(squads);
            setIsSynced(true);
        };

        socket.on('squadsUpdated', handleSquadsUpdated);

        return () => {
            socket.emit('leaveEvent', {eventId: ev.id});
            socket.off('squadsUpdated', handleSquadsUpdated);
            socket.disconnect();
        };
    }, [ev?.id]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!ev) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}
             style={{alignItems: 'center', justifyContent: 'center', display: 'flex'}}>
            <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '500px',
                    height: 'auto',
                    maxHeight: '95vh',
                    maxWidth: '95vw',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#1a1b26',
                    borderRadius: 8,
                    padding: 20
                }}
            >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
                    <div style={{fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center'}}>
                        Ваш отряд — {ev.name}
                        {!isSynced && <span style={{
                            fontSize: '0.8rem',
                            color: '#888',
                            marginLeft: 8,
                            fontWeight: 400
                        }}>(Синхронизация...)</span>}
                    </div>
                    <button className="btn secondary" onClick={onClose}>Закрыть</button>
                </div>

                <div
                    className="grid"
                    style={{flex: 1, overflow: 'hidden'}}
                >
                    {displayedSquads.length === 0 ? (
                        <div className="card" style={{padding: 32, textAlign: 'center', color: 'var(--muted)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            {localSquads.length === 0 
                                ? 'Отряды еще не сформированы' 
                                : 'Ваши персонажи не найдены в составе сформированных отрядов. Если вы были в донаборе, обратитесь к ПЛу для подтверждения участия.'}
                        </div>
                    ) : (
                        <div style={{
                            overflowY: 'auto',
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            gap: 12,
                            alignContent: 'flex-start',
                            height: '100%'
                        }}>
                            {displayedSquads.map(s => (
                                <div key={s.id} className="card" style={{height: 'fit-content', overflow: 'visible'}}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 8
                                    }}>
                                        <div style={{fontWeight: 600}}>{s.name}</div>
                                    </div>
                                    <div style={{display: 'grid', gap: 6}}>
                                        {s.members.map((m, idx) => {
                                            const isLeader = s.leaderId === m;
                                            const charData = rosterMap[m];
                                            const displayName = charData?.name || m;
                                            const status = ev.participants.find(p => p.characterId === m)?.status;

                                            let statusColor = 'transparent';
                                            let statusIcon = null;
                                            if (status === 'GOING') {
                                                statusColor = '#4fd1c5';
                                                statusIcon =
                                                    <span style={{color: statusColor, fontWeight: 'bold'}}>✓</span>;
                                            } else if (status === 'NOT_GOING') {
                                                statusColor = '#f87171';
                                                statusIcon =
                                                    <span style={{color: statusColor, fontWeight: 'bold'}}>✕</span>;
                                            } else if (status === 'UNDECIDED') {
                                                statusColor = '#fbbf24';
                                                statusIcon =
                                                    <span style={{color: statusColor, fontWeight: 'bold'}}>?</span>;
                                            }

                                            const content = (
                                                <div
                                                    className="card"
                                                    style={{
                                                        padding: '6px 8px',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        background: isLeader ? 'rgba(122, 162, 247, 0.15)' : '#24283b',
                                                        border: isLeader ? '1px solid rgba(122, 162, 247, 0.3)' : 'none',
                                                        borderLeft: status ? `3px solid ${statusColor}` : isLeader ? '1px solid rgba(122, 162, 247, 0.3)' : 'none',
                                                        cursor: 'default'
                                                    }}
                                                >
                                                    <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                                                        {isLeader && <span>👑</span>}
                                                        {(!isLeader && idx === 0 && s.leaderId === '') &&
                                                            <span style={{opacity: 0.5}}>1.</span>}
                                                        {statusIcon && <div style={{
                                                            width: 14,
                                                            display: 'flex',
                                                            justifyContent: 'center'
                                                        }}>{statusIcon}</div>}
                                                        <ClassIcon cls={charData?.class} size={16}/>
                                                        <span>{displayName}</span>
                                                    </div>
                                                </div>
                                            );

                                            return (
                                                <div key={m}>
                                                    {charData ? <CharacterTooltip
                                                        character={charData}>{content}</CharacterTooltip> : content}
                                                </div>
                                            );
                                        })}
                                        {s.members.length === 0 && <div style={{
                                            color: 'var(--muted)',
                                            fontSize: 12,
                                            textAlign: 'center',
                                            padding: 10
                                        }}>Пусто</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
