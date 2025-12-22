import React, {useState} from 'react';
import {useMyActivity} from '@/shared/model/MyActivityStore';
import s from '@/app/styles/Dashboard.module.scss';

export default function ClanHallWidget() {
    const {data} = useMyActivity();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const today = new Date();
    const day = today.getDay(); // 0-6
    const availableKhStages = data?.clanHall?.availableStage ?? (day === 0 ? 7 : Math.max(0, day));
    const nextStage = data?.clanHall?.nextStage ?? Math.min(availableKhStages + 1, 7);
    const attended = data?.clanHall?.attendedStages ?? [];
    const history = data?.clanHall?.history ?? [];

    const stageCounts = data?.clanHall?.stageCounts ?? {};
    const currentChecks = stageCounts[String(availableKhStages)] ?? 0;

    const maxChecks = 120;
    const progressPct = Math.min(100, (currentChecks / maxChecks) * 100);

    if (!data?.clanHall) {
        return null;
    }

    const getStageTooltip = (n: number) => {
        const entry = history.find(h => h.stage === n);
        if (entry) {
            return new Date(entry.date).toLocaleString('ru-RU', {
                weekday: 'short',
                day: 'numeric',
                month: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        if (n > availableKhStages) return 'Недоступно';
        return 'Не посещено';
    };

    const getStageClass = (n: number) => {
        if (n > availableKhStages) return s.khStageLocked;

        const entry = history.find(h => h.stage === n);
        if (!entry) return s.khStageMissed;

        const date = new Date(entry.date);
        const dayOfWeek = date.getDay();
        const targetDay = n === 7 ? 0 : n;

        if (dayOfWeek === targetDay) return s.khStageCompleted;
        return s.khStageMissed;
    };

    return (
        <section className={s.cardSection}>
            <div className={s.sectionTitle}>
                <span>🏛️ Клан Холл</span>
                <span style={{marginLeft: 'auto'}}/>
                <button
                    className="btn secondary small"
                    style={{
                        marginRight: 8,
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
                    <div className={s.activityCard}>
                        <div className={s.activityIcon}>🏛️</div>
                        <div className={s.activityName}>Клан Холл</div>
                        <div className={s.activityDetails}>Этапы на этой неделе</div>
                        <div className={s.khStages}>
                            {Array.from({length: 7}, (_, i) => i + 1).map(n => (
                                <div
                                    key={n}
                                    className={`${s.khStage} ${getStageClass(n)}`}
                                    title={getStageTooltip(n)}
                                >
                                    {n}
                                </div>
                            ))}
                        </div>

                        <div style={{marginTop: 12, width: '100%'}}>
                            <div className={s.progressBar}>
                                <div className={s.progressFill} style={{width: `${progressPct}%`}}/>
                            </div>
                            <div className={s.progressText}>
                                Прогресс этапа {availableKhStages}: {currentChecks} / {maxChecks}
                            </div>
                        </div>

                        <div className={`${s.chip} ${s.chipAvailable}`}
                             style={{marginTop: 8}}>Этап {availableKhStages} доступен
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}
