import React, { useState } from 'react';
import { Character } from '@/shared/types';
import { calculatePowerDetails } from '@/shared/lib/power';
import { formatNumber } from '@/shared/lib/number';
import s from './CharacterPower.module.scss';

interface CharacterPowerProps {
    character: Character;
    label?: string;
    className?: string;
    style?: React.CSSProperties;
    showStats?: boolean;
}

export const CharacterPower: React.FC<CharacterPowerProps> = ({ character, label = 'Сила персонажа', className, style, showStats: initialShowStats = false }) => {
    const [expanded, setExpanded] = useState(initialShowStats);
    const details = calculatePowerDetails(character);
    
    const speed = details.isPhysical ? details.attackRate : (details.multipliers.castSpeed || 1);

    return (
        <div className={`${s.powerCard} ${className || ''}`} style={style}>
            <div className={s.powerLabel}>{label}</div>
            <div className={s.powerValue}>
                {formatNumber(details.total)}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                Расчетный показатель
            </div>

            <div className={s.detailsToggle} onClick={() => setExpanded(!expanded)}>
                {expanded ? 'Скрыть детали' : 'Подробнее'}
            </div>

            {expanded && (
                <div className={s.statsGrid}>
                    <div className={s.statRow}>
                        <span className={s.statLabel}>База (ср.):</span>
                        <span className={s.statValue}>{formatNumber(Math.round(details.baseAvgDamage))}</span>
                    </div>
                    <div className={s.statRow}>
                        <span className={s.statLabel}>Множ. крита:</span>
                        <span className={s.statValue}>x{details.multipliers.crit.toFixed(2)}</span>
                    </div>
                    <div className={s.statRow}>
                        <span className={s.statLabel}>Множ. ПА:</span>
                        <span className={s.statValue}>x{details.multipliers.attackLevel.toFixed(2)}</span>
                    </div>
                    <div className={s.statRow}>
                        <span className={s.statLabel}>Множ. БД:</span>
                        <span className={s.statValue}>x{details.multipliers.spirit.toFixed(2)}</span>
                    </div>
                    <div className={s.statRow}>
                        <span className={s.statLabel}>Множ. пробива:</span>
                        <span className={s.statValue}>x{details.multipliers.penetration.toFixed(2)}</span>
                    </div>
                    <div className={s.statRow}>
                        <span className={s.statLabel}>Скорость:</span>
                        <span className={s.statValue}>x{speed.toFixed(2)}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
