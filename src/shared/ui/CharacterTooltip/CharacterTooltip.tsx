import React, {useState, useRef} from 'react';
import {createPortal} from 'react-dom';
import type {Character} from '@/shared/types';
import {calculatePowerDetails} from '@/shared/lib/power';
import s from './CharacterTooltip.module.scss';

interface Props {
    character: Character;
    children: React.ReactNode;
}

export default function CharacterTooltip({character, children}: Props) {
    const details = calculatePowerDetails(character);
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({top: 0, left: 0});
    const [placement, setPlacement] = useState<'top' | 'bottom'>('top');
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // Check if there is enough space above (approx 350px needed)
            const fitsTop = rect.top > 350;
            const newPlacement = fitsTop ? 'top' : 'bottom';

            setPlacement(newPlacement);
            setCoords({
                top: newPlacement === 'top' ? rect.top - 8 : rect.bottom + 8,
                left: rect.left + rect.width / 2
            });
            setVisible(true);
        }
    };

    const handleMouseLeave = () => {
        setVisible(false);
    };

    return (
        <div
            className={s.container}
            ref={containerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
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
                    <div className={s.header}>Характеристики</div>
                    <div className={s.statRow}><span>Физ. атака:</span>
                        <span>{character.minAttack}-{character.maxAttack}</span></div>
                    <div className={s.statRow}><span>Шанс крита:</span> <span>{character.critChance}%</span></div>
                    <div className={s.statRow}><span>Крит. урон:</span> <span>{character.critDamage}%</span></div>
                    <div className={s.statRow}><span>Боевой дух:</span> <span>{character.spirit}</span></div>
                    <div className={s.statRow}><span>ПА:</span> <span>{character.attackLevel}</span></div>
                    <div className={s.statRow}><span>ПЗ:</span> <span>{character.defenseLevel}</span></div>
                    <div className={s.statRow}><span>Физ. пробив:</span> <span>{character.physPenetration}</span></div>
                    <div className={s.statRow}><span>Маг. пробив:</span> <span>{character.magPenetration}</span></div>
                    <div className={s.statRow}><span>Аспд/Пение:</span>
                        <span>{character.atkPerSec} / {character.chanting}%</span></div>
                    <div className={s.divider}/>
                    <div className={s.statRow}><span>HP:</span> <span>{character.health}</span></div>
                    <div className={s.statRow}><span>Физ. деф:</span> <span>{character.physDef}</span></div>
                    <div className={s.statRow}><span>Маг. деф:</span> <span>{character.magDef}</span></div>
                    <div className={s.statRow}><span>УФУ/УМУ:</span>
                        <span>{character.physReduction}% / {character.magReduction}%</span></div>

                    <div className={s.divider}/>
                    <div className={s.header} style={{color: '#ff9e64'}}>Детализация силы
                        ({Math.round(details.total).toLocaleString()})
                    </div>
                    <div className={s.statRow}><span>Тип урона:</span>
                        <span>{details.isPhysical ? 'Физ.' : 'Маг.'}</span></div>
                    <div className={s.statRow}><span>DPS (raw):</span>
                        <span>{Math.round(details.rawDps).toLocaleString()}</span></div>
                </div>,
                document.body
            )}
        </div>
    );
}
