import React, {useState, useRef} from 'react';
import {createPortal} from 'react-dom';
import type {Character} from '@/shared/types';
import {CHARACTER_STAT_LABELS} from '@/shared/types';
import {formatNumber} from '@/shared/lib/number';
import {CharacterPower} from '@/entities/character/ui/CharacterPower';
import s from './CharacterTooltip.module.scss';

interface Props {
    character: Character;
    children: React.ReactNode;
}

export default function CharacterTooltip({character, children}: Props) {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({top: 0, left: 0});
    const [placement, setPlacement] = useState<'top' | 'bottom'>('top');
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // Expanded dimensions for two-column layout
            const tooltipWidth = 520;
            const tooltipHeight = 400;

            // Check vertical space
            const fitsTop = rect.top > tooltipHeight;
            const newPlacement = fitsTop ? 'top' : 'bottom';

            // Calculate horizontal position
            let left = rect.left + rect.width / 2;
            const viewportWidth = window.innerWidth;

            // Keep within viewport horizontal bounds
            if (left - tooltipWidth / 2 < 10) {
                left = tooltipWidth / 2 + 10;
            } else if (left + tooltipWidth / 2 > viewportWidth - 10) {
                left = viewportWidth - tooltipWidth / 2 - 10;
            }

            setPlacement(newPlacement);
            setCoords({
                top: newPlacement === 'top' ? rect.top - 8 : rect.bottom + 8,
                left: left
            });
            setVisible(true);
        }
    };

    const handleMouseLeave = () => {
        setVisible(false);
    };

    const handleFocus = () => {
        handleMouseEnter();
    };

    return (
        <div
            className={s.container}
            ref={containerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleFocus}
            onBlur={handleMouseLeave}
            tabIndex={0}
        >
            {children}
            {visible && createPortal(
                <div
                    className={s.tooltip}
                    data-placement={placement}
                    style={{
                        position: 'fixed',
                        top: coords.top,
                        left: coords.left,
                        transform: placement === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)'
                    }}
                >
                    <div className={s.columns}>
                        <div className={s.column}>
                            <div className={s.header}>Характеристики</div>
                            <div className={s.statRow}><span>Атака:</span>
                                <span>{formatNumber(character.minAttack)}-{formatNumber(character.maxAttack)}</span></div>
                            <div className={s.statRow}><span>{CHARACTER_STAT_LABELS.critChance}:</span> <span>{formatNumber(character.critChance, 1)}%</span></div>
                            <div className={s.statRow}><span>{CHARACTER_STAT_LABELS.critDamage}:</span> <span>{formatNumber(character.critDamage)}%</span></div>
                            <div className={s.statRow}><span>{CHARACTER_STAT_LABELS.spirit}:</span> <span>{formatNumber(character.spirit)}</span></div>
                            <div className={s.statRow}><span>{CHARACTER_STAT_LABELS.attackLevel}:</span> <span>{formatNumber(character.attackLevel)}</span></div>
                            <div className={s.statRow}><span>{CHARACTER_STAT_LABELS.defenseLevel}:</span> <span>{formatNumber(character.defenseLevel)}</span></div>
                            <div className={s.statRow}><span>{CHARACTER_STAT_LABELS.physPenetration}:</span> <span>{formatNumber(character.physPenetration)}</span></div>
                            <div className={s.statRow}><span>{CHARACTER_STAT_LABELS.magPenetration}:</span> <span>{formatNumber(character.magPenetration)}</span></div>
                            <div className={s.statRow}><span>{CHARACTER_STAT_LABELS.atkPerSec}/{CHARACTER_STAT_LABELS.chanting}:</span>
                                <span>{formatNumber(character.atkPerSec, 2)} / {formatNumber(character.chanting)}%</span></div>
                            <div className={s.divider}/>
                            <div className={s.statRow}><span>{CHARACTER_STAT_LABELS.health}:</span> <span>{formatNumber(character.health)}</span></div>
                            <div className={s.statRow}><span>{CHARACTER_STAT_LABELS.physDef}:</span> <span>{formatNumber(character.physDef)}</span></div>
                            <div className={s.statRow}><span>{CHARACTER_STAT_LABELS.magDef}:</span> <span>{formatNumber(character.magDef)}</span></div>
                            <div className={s.statRow}><span>{CHARACTER_STAT_LABELS.physReduction}/{CHARACTER_STAT_LABELS.magReduction}:</span>
                                <span>{formatNumber(character.physReduction, 1)}% / {formatNumber(character.magReduction, 1)}%</span></div>
                        </div>

                        <div className={s.column}>
                            <CharacterPower 
                                character={character} 
                                showStats={true} 
                                className={s.powerComponent}
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
