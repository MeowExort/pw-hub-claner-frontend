import React, {useState, useEffect, useMemo} from 'react';
import {Modal} from '@/shared/ui/Modal/Modal';
import {useAppStore} from '@/shared/model/AppStore';
import {ClanEvent, Character, ClanMember} from '@/shared/types';
import {ClassIcon} from '@/shared/ui/ClassIcon';
import styles from '@/app/styles/App.module.scss';
import s from './EventFeedbackModal.module.scss';
import {useAuth} from '@/app/providers/AuthContext';

interface EventFeedbackModalProps {
    event: ClanEvent;
    overrideSquadId?: string;
    onClose?: () => void;
}

export default function EventFeedbackModal({event, overrideSquadId, onClose}: EventFeedbackModalProps) {
    const {user} = useAuth();
    const {getClanRoster, submitEventFeedback, hasPermission} = useAppStore();
    const [roster, setRoster] = useState<(Character & ClanMember)[]>([]);
    const [search, setSearch] = useState('');
    const [showAddMember, setShowAddMember] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const isAdmin = hasPermission('CAN_EDIT_EVENTS');
    
    // Squads to fill feedback for
    const targetSquads = useMemo(() => {
        if (overrideSquadId) {
            return (event.squads || []).filter(s => s.id === overrideSquadId);
        }
        if (isAdmin) return event.squads || [];
        return (event.squads || []).filter(s => s.leaderId === user?.mainCharacterId && !s.feedbackSubmitted);
    }, [event.squads, isAdmin, user, overrideSquadId]);

    const [attendance, setAttendance] = useState<Record<string, { characterId: string, attended: boolean, isReplacement?: boolean }>>({});

    useEffect(() => {
        getClanRoster().then(setRoster);
    }, [getClanRoster]);

    useEffect(() => {
        const initial: Record<string, { characterId: string, attended: boolean, isReplacement?: boolean }> = {};
        targetSquads.forEach(sq => {
            sq.members.forEach(mId => {
                // If it's an override (officer filling for someone), we might want to see current status if available?
                // But for now, default to attended: true as before.
                initial[mId] = { characterId: mId, attended: true };
            });
        });
        setAttendance(initial);
    }, [targetSquads]);

    const toggleAttendance = (charId: string, attended: boolean) => {
        setAttendance(prev => ({
            ...prev,
            [charId]: { ...prev[charId], attended }
        }));
    };

    const addReplacement = (char: Character & ClanMember) => {
        if (attendance[char.id]) return;
        setAttendance(prev => ({
            ...prev,
            [char.id]: { characterId: char.id, attended: true, isReplacement: true }
        }));
        setShowAddMember(false);
        setSearch('');
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const squadId = overrideSquadId || (isAdmin && targetSquads.length > 1 ? 'ALL' : targetSquads[0]?.id);
            if (!squadId) return;

            const data = Object.values(attendance);
            await submitEventFeedback(event.id, squadId, data);
            onClose?.();
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredRoster = roster.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) && !attendance[c.id]
    ).slice(0, 10);

    return (
        <Modal 
            isOpen={true} 
            onClose={() => onClose?.()} // Closable only if onClose is provided
            title={`Обратная связь: ${event.name}`}
            footer={
                <button 
                    className="btn" 
                    onClick={handleSubmit} 
                    disabled={submitting || Object.keys(attendance).length === 0}
                >
                    {submitting ? 'Сохранение...' : 'Отправить'}
                </button>
            }
        >
            <div className={s.container}>
                <p className={s.hint}>Пожалуйста, отметьте присутствующих на событии.</p>
                
                <div className={s.memberList}>
                    {Object.entries(attendance).map(([charId, data]) => {
                        const char = roster.find(r => r.id === charId);
                        return (
                            <div key={charId} className={s.memberRow}>
                                <div className={s.memberInfo}>
                                    {char && <ClassIcon cls={char.class} size={16} />}
                                    <span className={s.memberName}>
                                        {char?.name || 'Загрузка...'}
                                        {data.isReplacement && <span className={s.replacementLabel}>(Донабор)</span>}
                                    </span>
                                </div>
                                <div className={s.actions}>
                                    <button 
                                        className={`${s.statusBtn} ${data.attended ? s.activeGreen : ''}`}
                                        onClick={() => toggleAttendance(charId, true)}
                                        title="Пришел"
                                    >
                                        ✓
                                    </button>
                                    <button 
                                        className={`${s.statusBtn} ${!data.attended ? s.activeRed : ''}`}
                                        onClick={() => toggleAttendance(charId, false)}
                                        title="Не пришел"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className={s.addSection}>
                    {!showAddMember ? (
                        <button className="btn secondary fullWidth" onClick={() => setShowAddMember(true)}>
                            + Добавить из состава (Донабор)
                        </button>
                    ) : (
                        <div className={s.searchBox}>
                            <input 
                                className="input" 
                                autoFocus
                                placeholder="Поиск по нику..." 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            {search && (
                                <div className={s.searchResults}>
                                    {filteredRoster.map(c => (
                                        <div key={c.id} className={s.searchItem} onClick={() => addReplacement(c)}>
                                            <ClassIcon cls={c.class} size={14} />
                                            <span>{c.name}</span>
                                        </div>
                                    ))}
                                    {filteredRoster.length === 0 && <div className={s.noResults}>Ничего не найдено</div>}
                                </div>
                            )}
                            <button className="btn secondary" style={{marginTop: 8}} onClick={() => setShowAddMember(false)}>
                                Отмена
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
