import React, {useState, useEffect} from 'react';
import {useAppStore} from '@/shared/model/AppStore';
import s from '@/app/styles/Dashboard.module.scss';
import {ClassIcon} from '@/shared/ui/ClassIcon';
import {CharacterClass} from '@/shared/types';

const STATUS_LABELS: Record<string, string> = {
    GOING: 'Иду',
    NOT_GOING: 'Не иду',
    UNDECIDED: 'Думаю'
};

export default function ActivityFeed() {
    const {events, resolveCharacterNames} = useAppStore();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [names, setNames] = useState<Record<string, { name: string; class: CharacterClass }>>({});

    useEffect(() => {
        const ids = new Set<string>();
        events.forEach(e => {
            e.participants.forEach(p => ids.add(p.characterId));
        });

        if (ids.size > 0) {
            resolveCharacterNames(Array.from(ids))
                .then(setNames)
                .catch(console.error);
        }
    }, [events, resolveCharacterNames]);

    const items = [...events]
        .flatMap(e => (
            [
                {ts: new Date(e.date).getTime(), content: <>Создано событие: {e.name}</>, time: new Date(e.date)},
                ...e.participants.map(p => {
                    const info = names[p.characterId];
                    return {
                        ts: new Date(e.date).getTime(),
                        content: (
                            <span style={{display: 'flex', alignItems: 'center'}}>
                Отпись:&nbsp;
                                {info ? (
                                    <>
                                        <ClassIcon cls={info.class} size={16}/>
                                        {info.name}
                                    </>
                                ) : p.characterId}
                                &nbsp;— {STATUS_LABELS[p.status] || p.status} ({e.name})
              </span>
                        ),
                        time: new Date(e.date)
                    };
                })
            ]
        ))
        .sort((a, b) => b.ts - a.ts)
        .slice(0, 10);

    return (
        <section className={s.cardSection}>
            <div className={s.sectionTitle}>
                <span>📊 Последняя активность клана</span>
                <button
                    className="btn secondary small"
                    style={{
                        marginLeft: 'auto',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onClick={() => setIsCollapsed(v => !v)}
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
                <>
                    {items.length === 0 && <div>Пока нет активности</div>}
                    <div style={{display: 'grid', gap: 10}}>
                        {items.map((it, i) => (
                            <div key={i} style={{padding: 10, background: 'rgba(255,255,255,.05)', borderRadius: 6}}>
                                <div style={{fontSize: '.95rem'}}>{it.content}</div>
                                <div style={{color: 'var(--muted)', fontSize: 12}}>
                                    {it.time.toLocaleString('ru-RU', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        day: '2-digit',
                                        month: '2-digit'
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
