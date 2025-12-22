import React, {useMemo, useState} from 'react';
import {useAppStore} from '@/shared/model/AppStore';
import {useMyActivity} from '@/shared/model/MyActivityStore';
import {isoWeekKey, getStartOfWeekFromIso} from '@/shared/lib/date';
import s from '@/app/styles/Dashboard.module.scss';
import {WeekSwitcher} from '@/shared/ui/WeekSwitcher';

export default function EventCalendar() {
    const {events, refreshAll} = useAppStore();
    const {week, setWeek} = useMyActivity();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const changeWeek = (offset: number) => {
        let newWeek = '';
        if (offset === 0) {
            newWeek = isoWeekKey(new Date());
        } else {
            const currentStart = getStartOfWeekFromIso(week);
            currentStart.setDate(currentStart.getDate() + (offset * 7));
            newWeek = isoWeekKey(currentStart);
        }
        setWeek(newWeek);
        refreshAll(false, newWeek);
    };

    const weekDays = useMemo(() => {
        const start = getStartOfWeekFromIso(week);

        const daysRu = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

        const arr: { date: Date; iso: string; label: string; num: number }[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const sod = startOfDay(d);
            arr.push({
                date: sod,
                iso: sod.toISOString(),
                label: daysRu[i],
                num: d.getDate()
            });
        }
        return arr;
    }, [week]);

    const eventsByDay = useMemo(() => {
        const map = new Map<string, typeof events>();
        for (const e of events) {
            if (e.type === 'CLAN_HALL') continue;
            const d = startOfDay(new Date(e.date)).toISOString();
            const arr = map.get(d) ?? [];
            arr.push(e);
            map.set(d, arr);
        }
        return map;
    }, [events]);

    const todayIso = startOfDay(new Date()).toISOString();

    return (
        <section className={s.cardSection}>
            <div className={s.sectionTitle}>
                <WeekSwitcher weekIso={week} onSwitch={changeWeek}/>
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
                <div className={s.calendar}>
                    {weekDays.map(d => {
                        const key = d.iso;
                        const dayEvents = eventsByDay.get(key) ?? [];
                        const hasEvent = dayEvents.length > 0;
                        const marker = markerFor(dayEvents);
                        const classes = [s.calendarDay];
                        if (key === todayIso) classes.push(s.calendarDayActive);
                        if (hasEvent) classes.push(s.calendarDayEvent);
                        return (
                            <div key={key} className={classes.join(' ')}>
                                {d.label}
                                <br/>
                                <span>
                {d.num}
                                    {marker && <strong>{marker}</strong>}
              </span>
                                {hasEvent && (
                                    <div className={s.calendarDayTooltip}>
                                        {dayEvents.map(e => (
                                            <div key={e.id} className={s.tooltipItem}>
                      <span className={s.tooltipTime}>
                        {new Date(e.date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                      </span>
                                                {e.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}


function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function markerFor(list: ReturnType<typeof useAppStore>['events']) {
    if (!list || list.length === 0) return '';
    // Priority: Rhythm (Р), Dragon/custom (Д), FK (У)
    const has = (t: string) => list.some(e => e.type === t);
    const hasDragon = list.some(e => e.name.toLowerCase().includes('дракон'));
    if (has('RHYTHM')) return 'Р';
    if (hasDragon || has('CUSTOM') || has('SADEMAN')) return 'Д';
    if (has('FORBIDDEN_KNOWLEDGE')) return 'У';
    if (has('GVG')) return 'Г';
    if (has('MTV')) return 'Т';
    return '';
}
