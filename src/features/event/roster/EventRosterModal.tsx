import React, {useMemo, useState, useEffect} from 'react';
import {useAppStore} from '@/shared/model/AppStore';
import {useToast} from '@/app/providers/ToastContext';
import type {Squad, Character, ClanMember} from '@/shared/types';
import {uid} from '@/shared/lib/storage';
import CharacterTooltip from '@/shared/ui/CharacterTooltip/CharacterTooltip';
import {socket} from '@/shared/api/socket';
import {useAuth} from '@/app/providers/AuthContext';
import {ClassIcon} from '@/shared/ui/ClassIcon';
import {addMemberToSquad} from './rosterUtils';

export default function EventRosterModal({eventId, onClose}: { eventId: string; onClose: () => void }) {
    const {events, hasPermission, getClanRoster} = useAppStore();
    const {notify} = useToast();
    const {user} = useAuth();
    const ev = events.find(e => e.id === eventId);
    const canEdit = hasPermission('CAN_MANAGE_SQUADS');

    const [rosterMap, setRosterMap] = useState<Record<string, Character & ClanMember>>({});
    const [loadingRoster, setLoadingRoster] = useState(false);
    const [isSynced, setIsSynced] = useState(false);

    useEffect(() => {
        setLoadingRoster(true);
        getClanRoster().then(roster => {
            const map: Record<string, Character & ClanMember> = {};
            roster.forEach(c => map[c.id] = c);
            setRosterMap(map);
        })
            .catch(console.error)
            .finally(() => setLoadingRoster(false));
    }, [getClanRoster]);

    const [localSquads, setLocalSquads] = useState<Squad[]>(() => {
        if (ev?.squads?.length) return ev.squads;
        if (canEdit) {
            return [];
        }
        return [];
    });

    // Socket connection
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

    const modifySquads = (updateFn: (prev: Squad[]) => Squad[]) => {
        setLocalSquads(prev => {
            const next = updateFn(prev);
            if (canEdit && ev) {
                socket.emit('updateSquads', {
                    eventId: ev.id,
                    squads: next,
                    userId: user?.id
                });
            }
            return next;
        });
    };

    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        squadId: string;
        charId: string
    } | null>(null);

    // Close context menu on click anywhere
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (contextMenu) {
                    setContextMenu(null);
                } else {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [contextMenu, onClose]);

    const [includeAllRoster, setIncludeAllRoster] = useState(false);

    const availableChars = useMemo(() => {
        const assigned = new Set(localSquads.flatMap(s => s.members));
        const participantMap = new Map((ev?.participants ?? []).map(p => [p.characterId, p.status]));

        let candidates: string[] = [];
        if (includeAllRoster) {
            const pIds = (ev?.participants ?? []).map(p => p.characterId);
            const rIds = Object.keys(rosterMap);
            candidates = Array.from(new Set([...pIds, ...rIds]));
        } else {
            candidates = (ev?.participants ?? []).map(p => p.characterId);
        }

        const unassigned = candidates.filter(id => !assigned.has(id));

        return unassigned.sort((a, b) => {
            const sA = participantMap.get(a);
            const sB = participantMap.get(b);

            const score = (s?: string) => {
                if (s === 'GOING') return 0;
                if (s === 'UNDECIDED') return 1;
                if (s === 'NOT_GOING') return 2;
                return 3;
            };

            const scA = score(sA);
            const scB = score(sB);
            if (scA !== scB) return scA - scB;

            return (rosterMap[a]?.name || '').localeCompare(rosterMap[b]?.name || '');
        });
    }, [ev, localSquads, rosterMap, includeAllRoster]);

    if (!ev) return null;

    const onDropToSquad = (squadId: string, characterId: string) => {
        if (!canEdit) return;
        modifySquads(prev => addMemberToSquad(prev, squadId, characterId, rosterMap));
    };

    const unassignCharacter = (characterId: string) => {
        if (!canEdit) return;
        modifySquads(prev => prev.map(s => {
            const newMembers = s.members.filter(m => m !== characterId);
            const newLeader = s.leaderId === characterId ? '' : s.leaderId;
            return {...s, members: newMembers, leaderId: newLeader};
        }));
    };

    const createSquadWithMember = (characterId: string) => {
        if (!canEdit) return;
        modifySquads(prev => {
            const cleaned = prev.map(s => {
                const newMembers = s.members.filter(m => m !== characterId);
                const newLeader = s.leaderId === characterId ? '' : s.leaderId;
                return {...s, members: newMembers, leaderId: newLeader};
            });

            const char = rosterMap[characterId];
            const isPL = char?.role === 'PL';

            const newSquad: Squad = {
                id: uid('sq_'),
                name: `Отряд ${cleaned.length + 1}`,
                leaderId: isPL ? characterId : '',
                members: [characterId]
            };
            return [...cleaned, newSquad];
        });
    };

    const onDragStartChar = (e: React.DragEvent, characterId: string) => {
        if (!canEdit) return;
        e.dataTransfer.setData('text/plain', characterId);
    };

    const onDragOver = (e: React.DragEvent) => {
        if (!canEdit) return;
        e.preventDefault();
    };

    const removeFromSquad = (squadId: string, characterId: string) => {
        if (!canEdit) return;
        modifySquads(prev => prev.map(s => {
            if (s.id !== squadId) return s;
            const newMembers = s.members.filter(m => m !== characterId);
            // If leader is removed, clear leaderId
            const newLeader = s.leaderId === characterId ? '' : s.leaderId;
            return {...s, members: newMembers, leaderId: newLeader};
        }));
    };

    const addSquad = () => {
        if (!canEdit) return;
        modifySquads(prev => [...prev, {id: uid('sq_'), name: `Отряд ${prev.length + 1}`, leaderId: '', members: []}]);
    };

    const renameSquad = (squadId: string, newName: string) => {
        if (!canEdit) return;
        modifySquads(prev => prev.map(s => s.id === squadId ? {...s, name: newName} : s));
    };

    const handleContextMenu = (e: React.MouseEvent, squadId: string, charId: string) => {
        if (!canEdit) return;
        e.preventDefault();
        e.stopPropagation(); // Prevent modal click
        setContextMenu({x: e.clientX, y: e.clientY, squadId, charId});
    };

    const makeLeader = (squadId: string, charId: string) => {
        if (!canEdit) return;
        modifySquads(prev => prev.map(s => {
            if (s.id !== squadId) return s;

            // Move to top
            const others = s.members.filter(m => m !== charId);
            return {
                ...s,
                leaderId: charId,
                members: [charId, ...others]
            };
        }));
        setContextMenu(null);
    };

    const moveUp = (squadId: string, charId: string) => {
        if (!canEdit) return;
        modifySquads(prev => prev.map(s => {
            if (s.id !== squadId) return s;
            const idx = s.members.indexOf(charId);
            if (idx <= 0) return s;
            const newMembers = [...s.members];
            [newMembers[idx - 1], newMembers[idx]] = [newMembers[idx], newMembers[idx - 1]];
            return {...s, members: newMembers};
        }));
        setContextMenu(null);
    };

    const isMySquadView = !canEdit && localSquads.length > 0;

    const copySquad = (s: Squad) => {
        const memberNames = s.members
            .filter(mId => mId !== s.leaderId)
            .map(mId => rosterMap[mId]?.name || 'Unknown')
            .join(', ');
        const text = `${s.name}: ${memberNames}`;
        navigator.clipboard.writeText(text).then(() => {
            notify('Скопировано в буфер обмена', 'success');
        });
    };

    const myCharacterIds = useMemo(() => user?.characters?.map(c => c.id) || [], [user]);

    const displayedSquads = useMemo(() => {
        if (!isMySquadView) return localSquads;
        return localSquads.filter(s => s.members.some(m => myCharacterIds.includes(m)));
    }, [isMySquadView, localSquads, myCharacterIds]);

    return (
        <div className="modal-backdrop" onClick={onClose}
             style={{alignItems: 'center', justifyContent: 'center', display: 'flex'}}>
            <div
                className="modal"
                onClick={(e) => {
                    e.stopPropagation();
                    setContextMenu(null);
                }}
                style={{
                    width: isMySquadView ? '500px' : '98vw',
                    height: isMySquadView ? 'auto' : '95vh',
                    maxHeight: '95vh',
                    maxWidth: isMySquadView ? '90vw' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#1a1b26',
                    borderRadius: 8,
                    padding: 20
                }}
            >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
                    <div style={{fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center'}}>
                        {isMySquadView ? `Ваш отряд — ${ev.name}` : `Роспись отрядов — ${ev.name}`}
                        {!isSynced && <span style={{
                            fontSize: '0.8rem',
                            color: '#888',
                            marginLeft: 8,
                            fontWeight: 400
                        }}>(Синхронизация...)</span>}
                    </div>
                    <div style={{display: 'flex', gap: 12}}>
                        {canEdit && <button className="btn secondary" onClick={addSquad}>+ Отряд</button>}
                        <button className="btn secondary" onClick={onClose}>Закрыть</button>
                    </div>
                </div>

                <div
                    className="grid"
                    style={{
                        gridTemplateColumns: canEdit ? '300px 1fr' : '1fr',
                        gap: 16,
                        flex: 1,
                        overflow: isMySquadView ? 'visible' : 'hidden'
                    }}
                    onDragOver={onDragOver}
                    onDrop={(e) => {
                        e.preventDefault();
                        unassignCharacter(e.dataTransfer.getData('text/plain'));
                    }}
                >
                    {canEdit && (
                        <div className="card" style={{display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 8
                            }}>
                                <div style={{fontWeight: 600}}>Доступные ({availableChars.length})</div>
                            </div>
                            <div style={{marginBottom: 4, fontSize: 13, display: 'flex', gap: 8, alignItems: 'center'}}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    cursor: 'pointer',
                                    userSelect: 'none'
                                }}>
                                    <input type="checkbox" checked={includeAllRoster}
                                           onChange={e => setIncludeAllRoster(e.target.checked)}/>
                                    Весь состав
                                    {loadingRoster &&
                                        <span style={{fontSize: 11, color: 'var(--muted)'}}>(...)</span>}
                                </label>
                                {canEdit && (
                                    <button 
                                        className="btn secondary small" 
                                        onClick={() => {
                                            const allIds = availableChars;
                                            if (allIds.length === 0) return;
                                            
                                            modifySquads(prev => {
                                                let currentSquads = [...prev];
                                                allIds.forEach(id => {
                                                    // Find squad with < 12 members
                                                    let targetSquad = currentSquads.find(s => s.members.length < 12);
                                                    if (!targetSquad) {
                                                        const newSquad: Squad = {
                                                            id: uid('sq_'),
                                                            name: `Отряд ${currentSquads.length + 1}`,
                                                            leaderId: '',
                                                            members: []
                                                        };
                                                        currentSquads.push(newSquad);
                                                        targetSquad = newSquad;
                                                    }
                                                    targetSquad.members.push(id);
                                                });
                                                return currentSquads;
                                            });
                                        }}
                                        style={{padding: '2px 6px', fontSize: '11px'}}
                                    >
                                        Раскидать всех
                                    </button>
                                )}
                            </div>
                            <div style={{
                                overflowY: 'auto',
                                flex: 1,
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 4,
                                alignContent: 'flex-start'
                            }}>
                                {availableChars.map(id => {
                                    const status = ev.participants.find(p => p.characterId === id)?.status;
                                    let statusColor = 'transparent';
                                    let statusTitle = 'Не ответил';
                                    let statusIcon = null;

                                    if (status === 'GOING') {
                                        statusColor = '#4fd1c5';
                                        statusTitle = 'Пойдет';
                                        statusIcon = <span style={{color: statusColor, fontWeight: 'bold'}}>✓</span>;
                                    } else if (status === 'NOT_GOING') {
                                        statusColor = '#f87171';
                                        statusTitle = 'Пас';
                                        statusIcon = <span style={{color: statusColor, fontWeight: 'bold'}}>✕</span>;
                                    } else if (status === 'UNDECIDED') {
                                        statusColor = '#fbbf24';
                                        statusTitle = 'Думает';
                                        statusIcon = <span style={{color: statusColor, fontWeight: 'bold'}}>?</span>;
                                    }

                                    return (
                                        <div
                                            key={id}
                                            className="card"
                                            draggable={canEdit}
                                            onDragStart={(e) => onDragStartChar(e, id)}
                                            title={`${rosterMap[id]?.name} (${statusTitle})`}
                                            style={{
                                                padding: '4px 8px',
                                                cursor: 'grab',
                                                background: '#24283b',
                                                display: 'flex',
                                                alignItems: 'center',
                                                borderLeft: status ? `3px solid ${statusColor}` : '3px solid transparent',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            {status && (
                                                <div style={{
                                                    marginRight: 6,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    width: 14,
                                                    justifyContent: 'center'
                                                }}>
                                                    {statusIcon}
                                                </div>
                                            )}
                                            <ClassIcon cls={rosterMap[id]?.class} size={12}/>
                                            <span style={{marginLeft: 6}}>{rosterMap[id]?.name || id}</span>
                                        </div>
                                    );
                                })}
                                {availableChars.length === 0 &&
                                    <div style={{color: 'var(--muted)'}}>Нет доступных персонажей</div>}
                            </div>
                        </div>
                    )}

                    {(!canEdit && displayedSquads.length === 0) ? (
                        <div className="card" style={{padding: 32, textAlign: 'center', color: 'var(--muted)'}}>
                            Вас еще не расписали в отряд
                        </div>
                    ) : (
                        <div style={{
                            overflowY: 'auto',
                            display: 'grid',
                            gridTemplateColumns: isMySquadView ? '1fr' : 'repeat(auto-fill, minmax(210px, 1fr))',
                            gap: 8,
                            alignContent: 'flex-start'
                        }}>
                            {displayedSquads.map(s => (
                                <div key={s.id} className="card" onDragOver={onDragOver} onDrop={e => {
                                    e.stopPropagation();
                                    onDropToSquad(s.id, e.dataTransfer.getData('text/plain'));
                                }} style={{height: 'fit-content', overflow: 'visible'}}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 8
                                    }}>
                                        {canEdit ? (
                                            <div style={{display: 'flex', alignItems: 'center', gap: 6, width: '100%'}}>
                                                <input
                                                    className="input"
                                                    value={s.name}
                                                    onChange={(e) => renameSquad(s.id, e.target.value)}
                                                    style={{fontWeight: 600, padding: '2px 6px', flex: 1}}
                                                />
                                                <span style={{fontSize: '0.8rem', color: 'var(--muted)', whiteSpace: 'nowrap'}}>
                                                    {s.members.length}/12
                                                </span>
                                            </div>
                                        ) : (
                                            <div style={{fontWeight: 600}}>{s.name} ({s.members.length})</div>
                                        )}
                                        <div style={{display: 'flex', gap: 4, alignItems: 'center'}}>
                                            {s.leaderId && myCharacterIds.includes(s.leaderId) && (
                                                <button 
                                                    className="btn secondary small" 
                                                    onClick={() => copySquad(s)}
                                                    title="Скопировать состав"
                                                >
                                                    📋
                                                </button>
                                            )}
                                            {canEdit && (
                                                <button 
                                                    className="btn secondary small"
                                                    onClick={() => modifySquads(prev => prev.filter(x => x.id !== s.id))}
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{display: 'grid', gap: 4}}>
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
                                                    draggable={canEdit}
                                                    onDragStart={(e) => onDragStartChar(e, m)}
                                                    onContextMenu={(e) => handleContextMenu(e, s.id, m)}
                                                    style={{
                                                        padding: '4px 6px',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        background: isLeader ? 'rgba(122, 162, 247, 0.15)' : '#24283b',
                                                        border: isLeader ? '1px solid rgba(122, 162, 247, 0.3)' : 'none',
                                                        borderLeft: status ? `3px solid ${statusColor}` : isLeader ? '1px solid rgba(122, 162, 247, 0.3)' : 'none',
                                                        cursor: 'default',
                                                        fontSize: '0.85rem'
                                                    }}
                                                >
                                                    <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            color: 'var(--muted)',
                                                            width: '18px',
                                                            textAlign: 'right'
                                                        }}>
                                                            {idx + 1}.
                                                        </span>
                                                        {isLeader && <span title="Лидер отряда">👑</span>}
                                                        {statusIcon && <div style={{
                                                            width: 14,
                                                            display: 'flex',
                                                            justifyContent: 'center'
                                                        }}>{statusIcon}</div>}
                                                        <ClassIcon cls={charData?.class} size={14}/>
                                                        <span style={{
                                                            fontWeight: isLeader ? 600 : 400,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}>{displayName}</span>
                                                    </div>
                                                    {canEdit && (
                                                        <button
                                                            className="btn secondary small"
                                                            onClick={() => removeFromSquad(s.id, m)}
                                                            title="Убрать из отряда"
                                                        >
                                                            ×
                                                        </button>
                                                    )}
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
                                        }}>{canEdit ? 'Перетащите сюда' : 'Пусто'}</div>}
                                    </div>
                                </div>
                            ))}
                            {canEdit && (
                                <div
                                    className="card"
                                    onDragOver={onDragOver}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        createSquadWithMember(e.dataTransfer.getData('text/plain'));
                                    }}
                                    style={{
                                        minHeight: 100,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px dashed var(--border)',
                                        background: 'transparent',
                                        cursor: 'default',
                                        color: 'var(--muted)'
                                    }}
                                >
                                    + Новый отряд
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        background: '#24283b',
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        zIndex: 9999,
                        minWidth: 150
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        style={{padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #333'}}
                        onClick={() => makeLeader(contextMenu.squadId, contextMenu.charId)}
                    >
                        👑 Назначить ПЛом
                    </div>
                    <div
                        style={{padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #333'}}
                        onClick={() => moveUp(contextMenu.squadId, contextMenu.charId)}
                    >
                        ⬆️ Поднять выше
                    </div>
                    <div
                        style={{padding: '8px 12px', cursor: 'pointer', color: '#f7768e'}}
                        onClick={() => {
                            removeFromSquad(contextMenu.squadId, contextMenu.charId);
                            setContextMenu(null);
                        }}
                    >
                        × Убрать из отряда
                    </div>
                </div>
            )}
        </div>
    );
}
