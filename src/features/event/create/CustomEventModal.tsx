import React, {useState, useEffect, useMemo} from 'react';
import type {EventType} from '@/shared/types';
import {useAppStore} from '@/shared/model/AppStore';

export default function CustomEventModal({onClose}: { onClose: () => void }) {
    const {createEvent} = useAppStore();
    const [type, setType] = useState<EventType>('SADEMAN');
    const [name, setName] = useState('');
    const [date, setDate] = useState(() => new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16));
    const [description, setDescription] = useState('');

    // PVP specific
    const [opponentName, setOpponentName] = useState('');
    const [rallyOffset, setRallyOffset] = useState(30);
    const [useCustomRally, setUseCustomRally] = useState(false);
    const [customRallyDate, setCustomRallyDate] = useState('');

    const presets: { key: EventType; label: string }[] = [
        {key: 'SADEMAN', label: 'Дракон Садеман'},
        {key: 'MTV', label: 'MTV (Межсерверная)'},
        {key: 'GVG', label: 'GVG (Территории)'},
        {key: 'CUSTOM', label: 'Свой шаблон'}
    ];

    const isPvp = ['MTV', 'GVG', 'SADEMAN'].includes(type);
    const hasOpponent = ['MTV', 'GVG'].includes(type);
    const [useCustomDate, setUseCustomDate] = useState(false);

    const toLocalIso = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const availableSlots = useMemo(() => {
        const slots: Date[] = [];
        if (!isPvp) return slots;

        const now = new Date();
        const addNext = (dayOfWeek: number, hour: number, minute: number = 0) => {
            const d = new Date(now);
            d.setHours(hour, minute, 0, 0);
            const currentDay = d.getDay();
            const diff = (dayOfWeek - currentDay + 7) % 7;
            if (diff === 0 && d < now) {
                d.setDate(d.getDate() + 7);
            } else {
                d.setDate(d.getDate() + diff);
            }
            slots.push(d);
        };

        if (type === 'GVG') {
            addNext(4, 22); // Thu
            addNext(0, 20); // Sun
            addNext(0, 22); // Sun
        } else if (type === 'MTV') {
            addNext(6, 20); // Sat
        } else if (type === 'SADEMAN') {
            addNext(6, 22); // Sat
        }
        return slots.sort((a, b) => a.getTime() - b.getTime());
    }, [type, isPvp]);

    useEffect(() => {
        if (type === 'SADEMAN') setName('Дракон Садеман');
        else if (type === 'MTV') setName('MTV');
        else if (type === 'GVG') setName('GVG');
        else if (['MTV', 'GVG', 'SADEMAN'].includes(name)) setName('');

        if (availableSlots.length > 0) {
            setDate(toLocalIso(availableSlots[0]));
            setUseCustomDate(false);
        } else {
            setUseCustomDate(true);
        }
    }, [type, availableSlots]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const dateObj = new Date(date);
        let rallyTime: string | undefined;

        if (isPvp) {
            if (useCustomRally && customRallyDate) {
                rallyTime = new Date(customRallyDate).toISOString();
            } else {
                const r = new Date(dateObj);
                r.setMinutes(r.getMinutes() - rallyOffset);
                rallyTime = r.toISOString();
            }
        }

        await createEvent({
            name: name || presets.find(p => p.key === type)?.label || 'Событие',
            type,
            date: dateObj.toISOString(),
            description,
            opponent: (isPvp && hasOpponent) ? opponentName : undefined,
            rallyTime
        });
        onClose();
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div style={{fontWeight: 700, marginBottom: 12}}>Создать событие</div>
                <form onSubmit={submit} className="grid" style={{gridTemplateColumns: '1fr', gap: 12}}>
                    <select className="input" value={type} onChange={e => setType(e.target.value as EventType)}>
                        {presets.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </select>

                    <input className="input" placeholder="Название (необязательно)" value={name}
                           onChange={e => setName(e.target.value)}/>

                    {availableSlots.length > 0 && (
                        <div style={{marginBottom: 8}}>
                            <div style={{fontSize: 12, marginBottom: 4}}>Время начала:</div>
                            <select
                                className="input"
                                value={useCustomDate ? 'custom' : date}
                                onChange={e => {
                                    if (e.target.value === 'custom') {
                                        setUseCustomDate(true);
                                    } else {
                                        setUseCustomDate(false);
                                        setDate(e.target.value);
                                    }
                                }}
                            >
                                {availableSlots.map(slot => {
                                    const iso = toLocalIso(slot);
                                    const display = slot.toLocaleString('ru-RU', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });
                                    return <option key={iso} value={iso}>{display}</option>;
                                })}
                                <option value="custom">Указать вручную...</option>
                            </select>
                        </div>
                    )}

                    {(useCustomDate || availableSlots.length === 0) && (
                        <input className="input" type="datetime-local" value={date}
                               onChange={e => setDate(e.target.value)}/>
                    )}

                    {isPvp && (
                        <div style={{border: '1px solid var(--border)', padding: 8, borderRadius: 4}}>
                            <div style={{fontSize: 12, fontWeight: 600, marginBottom: 8}}>Параметры PVP</div>
                            {hasOpponent && (
                                <input className="input" placeholder="Противник (клан или название)"
                                       value={opponentName} onChange={e => setOpponentName(e.target.value)}
                                       style={{marginBottom: 8}}/>
                            )}

                            <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                                <label style={{fontSize: 12}}>Сбор:</label>
                                <select className="input" style={{width: 'auto'}}
                                        value={useCustomRally ? 'custom' : 'auto'}
                                        onChange={e => setUseCustomRally(e.target.value === 'custom')}>
                                    <option value="auto">За 30 мин</option>
                                    <option value="custom">Указать время</option>
                                </select>
                            </div>
                            {useCustomRally && (
                                <input className="input" type="datetime-local" style={{marginTop: 8}}
                                       value={customRallyDate} onChange={e => setCustomRallyDate(e.target.value)}/>
                            )}
                        </div>
                    )}

                    <textarea className="input" placeholder="Описание" value={description}
                              onChange={e => setDescription(e.target.value)}/>
                    <div style={{display: 'flex', gap: 8, justifyContent: 'flex-end'}}>
                        <button type="button" className="btn secondary" onClick={onClose}>Отмена</button>
                        <button type="submit" className="btn">Создать</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
