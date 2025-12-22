import React, {useMemo} from 'react';
import {getStartOfWeekFromIso} from '@/shared/lib/date';

interface WeekSwitcherProps {
    weekIso: string;
    onSwitch: (offset: number) => void;
    className?: string;
    style?: React.CSSProperties;
}

export const WeekSwitcher: React.FC<WeekSwitcherProps> = ({weekIso, onSwitch, className, style}) => {
    const periodLabel = useMemo(() => {
        const start = getStartOfWeekFromIso(weekIso);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const fmt = (d: Date) => d.toLocaleString('ru-RU', {day: 'numeric', month: 'short'});
        return `${fmt(start)} — ${fmt(end)}`;
    }, [weekIso]);

    return (
        <div className={className} style={{display: 'flex', alignItems: 'center', gap: 12, ...style}}>
            <span>📅 {periodLabel}</span>
            <div style={{display: 'flex', alignItems: 'center', gap: 2}}>
                <button className="btn secondary small" style={{padding: '2px 6px'}} onClick={() => onSwitch(-1)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6"/>
                    </svg>
                </button>
                <button className="btn secondary small" style={{fontSize: 12, padding: '2px 6px'}}
                        onClick={() => onSwitch(0)}>
                    Сегодня
                </button>
                <button className="btn secondary small" style={{padding: '2px 6px'}} onClick={() => onSwitch(1)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6"/>
                    </svg>
                </button>
            </div>
        </div>
    );
};
