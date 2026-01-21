import React from 'react';
import {Character, CHARACTER_STAT_LABELS} from '@/shared/types';
import {calculatePowerDetails} from '@/shared/lib/power';
import {formatNumber} from '@/shared/lib/number';
import styles from './CharacterHistoryModal.module.scss';

interface Props {
    v1: Character;
    v2: Character;
}

export default function VersionComparison({v1, v2}: Props) {
    const details1 = calculatePowerDetails(v1);
    const details2 = calculatePowerDetails(v2);

    const renderStat = (key: string, label: string, isPercent = false) => {
        const val1 = (v1 as any)[key];
        const val2 = (v2 as any)[key];
        const diff = val2 - val1;
        const isBetter = diff > 0;
        const isSame = Math.abs(diff) < 0.0001;

        return (
            <div key={key} className={styles.diffRow} style={{gridTemplateColumns: '1.5fr 1fr 1fr 1fr'}}>
                <div className={styles.statName}>{label}</div>
                <div>{formatNumber(val1, isPercent ? 1 : 0)}{isPercent ? '%' : ''}</div>
                <div style={{fontWeight: 700}}>{formatNumber(val2, isPercent ? 1 : 0)}{isPercent ? '%' : ''}</div>
                <div style={{
                    color: isSame ? 'var(--muted)' : (isBetter ? 'var(--success)' : 'var(--danger)'),
                    fontWeight: 800,
                    textAlign: 'right'
                }}>
                    {isSame ? '—' : (diff > 0 ? '▲' : '▼') + formatNumber(Math.abs(diff), isPercent ? 1 : 0) + (isPercent ? '%' : '')}
                </div>
            </div>
        );
    };

    const statsToCompare = [
        {key: 'level', label: CHARACTER_STAT_LABELS.level},
        {key: 'minAttack', label: CHARACTER_STAT_LABELS.minAttack},
        {key: 'maxAttack', label: CHARACTER_STAT_LABELS.maxAttack},
        {key: 'attackLevel', label: CHARACTER_STAT_LABELS.attackLevel},
        {key: 'critChance', label: CHARACTER_STAT_LABELS.critChance, isPercent: true},
        {key: 'critDamage', label: CHARACTER_STAT_LABELS.critDamage, isPercent: true},
        {key: 'spirit', label: CHARACTER_STAT_LABELS.spirit},
        {key: 'physPenetration', label: CHARACTER_STAT_LABELS.physPenetration},
        {key: 'magPenetration', label: CHARACTER_STAT_LABELS.magPenetration},
        {key: 'health', label: CHARACTER_STAT_LABELS.health},
        {key: 'physDef', label: CHARACTER_STAT_LABELS.physDef},
        {key: 'magDef', label: CHARACTER_STAT_LABELS.magDef},
        {key: 'defenseLevel', label: CHARACTER_STAT_LABELS.defenseLevel},
    ];

    const powerDiff = details2.total - details1.total;

    return (
        <div className={styles.versionView}>
            <div className={styles.powerCard}>
                <div className={styles.powerLabel}>Разница боевой мощи</div>
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '20px'}}>
                    <span style={{fontSize: '1.5rem', color: 'var(--muted)', textDecoration: 'line-through', opacity: 0.5}}>
                        {formatNumber(details1.total)}
                    </span>
                    <span className={styles.powerValue}>
                        {formatNumber(details2.total)}
                    </span>
                </div>
                {powerDiff !== 0 && (
                    <div style={{
                        color: powerDiff > 0 ? 'var(--success)' : 'var(--danger)',
                        fontWeight: 800,
                        fontSize: '1.2rem',
                        marginTop: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}>
                        <span style={{fontSize: '1.4rem'}}>{powerDiff > 0 ? '▲' : '▼'}</span> 
                        {formatNumber(Math.abs(powerDiff))}
                    </div>
                )}
            </div>

            <div className={styles.diffGrid} style={{gridTemplateColumns: '1.5fr 1fr 1fr 1fr', paddingBottom: '12px', borderBottom: '1px solid var(--border)'}}>
                <div className={styles.label}>Параметр</div>
                <div className={styles.label}>Было</div>
                <div className={styles.label}>Стало</div>
                <div className={styles.label} style={{textAlign: 'right'}}>Разница</div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column'}}>
                {statsToCompare.map(s => renderStat(s.key, s.label, s.isPercent))}
            </div>
        </div>
    );
}
