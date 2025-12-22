import React, {useState} from 'react';
import {Character} from '@/shared/types';
import {calculatePowerDetails} from '@/shared/lib/power';

interface Props {
    character: Character;
    onClose: () => void;
}

export default function CharacterDetailsModal({character, onClose}: Props) {
    const details = calculatePowerDetails(character);
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{width: 'min(700px, 95vw)'}}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <h2 style={{margin: 0}}>{character.name}</h2>
                    <div
                        style={{
                            fontSize: '1.2rem',
                            fontWeight: 700,
                            color: 'var(--warning)',
                            position: 'relative',
                            cursor: 'help'
                        }}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        Сила: {details.total.toLocaleString()}

                        {showTooltip && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '8px',
                                background: '#1f2335',
                                border: '1px solid #414868',
                                borderRadius: '8px',
                                padding: '12px',
                                zIndex: 100,
                                minWidth: '220px',
                                fontSize: '0.85rem',
                                color: '#c0caf5',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                            }}>
                                <div style={{
                                    fontWeight: 700,
                                    marginBottom: 8,
                                    color: '#ff9e64',
                                    borderBottom: '1px solid #414868',
                                    paddingBottom: 4
                                }}>Детализация силы
                                </div>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}><span>Тип урона:</span>
                                    <span style={{color: '#fff'}}>{details.isPhysical ? 'Физ.' : 'Маг.'}</span></div>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}><span>База (ср.):</span>
                                    <span style={{color: '#fff'}}>{Math.round(details.baseAvgDamage)}</span></div>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}><span>Множ. крита:</span>
                                    <span style={{color: '#fff'}}>x{details.multipliers.crit.toFixed(2)}</span></div>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}><span>Множ. ПА:</span>
                                    <span style={{color: '#fff'}}>x{details.multipliers.attackLevel.toFixed(2)}</span>
                                </div>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}><span>Множ. БД:</span>
                                    <span style={{color: '#fff'}}>x{details.multipliers.spirit.toFixed(2)}</span></div>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}><span>Множ. пробива:</span>
                                    <span style={{color: '#fff'}}>x{details.multipliers.penetration.toFixed(2)}</span>
                                </div>
                                {details.isPhysical ? (
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
                                        <span>Скорость:</span> <span
                                        style={{color: '#fff'}}>x{details.attackRate.toFixed(2)}</span></div>
                                ) : (
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
                                        <span>Скорость каста:</span> <span
                                        style={{color: '#fff'}}>x{(details.multipliers.castSpeed || 1).toFixed(2)}</span>
                                    </div>
                                )}
                                <div style={{
                                    borderTop: '1px solid #414868',
                                    marginTop: 8,
                                    paddingTop: 8,
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}>
                                    <span>DPS (raw):</span> <span
                                    style={{color: '#fff'}}>{Math.round(details.rawDps).toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
                    <div>
                        <h3 style={{
                            marginTop: 0,
                            borderBottom: '1px solid var(--border)',
                            paddingBottom: '0.5rem'
                        }}>Основное</h3>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.95rem'}}>
                            <div style={{color: 'var(--muted)'}}>Класс:</div>
                            <div>{character.class}</div>
                            <div style={{color: 'var(--muted)'}}>Сервер:</div>
                            <div>{character.server}</div>
                            <div style={{color: 'var(--muted)'}}>Уровень:</div>
                            <div>{character.level}</div>
                            <div style={{color: 'var(--muted)'}}>HP:</div>
                            <div>{character.health}</div>
                            {character.pwobsLink && (
                                <>
                                    <div style={{color: 'var(--muted)'}}>PwObs:</div>
                                    <div>
                                        <a
                                            href={character.pwobsLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{color: 'var(--primary)'}}
                                        >
                                            Профиль
                                        </a>
                                    </div>
                                </>
                            )}
                        </div>

                        <h3 style={{
                            marginTop: '1.5rem',
                            borderBottom: '1px solid var(--border)',
                            paddingBottom: '0.5rem'
                        }}>Атака</h3>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.95rem'}}>
                            <div style={{color: 'var(--muted)'}}>Атака:</div>
                            <div>{character.minAttack} - {character.maxAttack}</div>
                            <div style={{color: 'var(--muted)'}}>Крит:</div>
                            <div>{character.critChance}% (x{character.critDamage}%)</div>
                            <div style={{color: 'var(--muted)'}}>ПА:</div>
                            <div>{character.attackLevel}</div>
                            <div style={{color: 'var(--muted)'}}>Пение:</div>
                            <div>{character.chanting}%</div>
                            <div style={{color: 'var(--muted)'}}>Аспд:</div>
                            <div>{character.atkPerSec}</div>
                            <div style={{color: 'var(--muted)'}}>Пробив:</div>
                            <div>Физ {character.physPenetration} / Маг {character.magPenetration}</div>
                        </div>
                    </div>

                    <div>
                        <h3 style={{
                            marginTop: 0,
                            borderBottom: '1px solid var(--border)',
                            paddingBottom: '0.5rem'
                        }}>Защита</h3>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.95rem'}}>
                            <div style={{color: 'var(--muted)'}}>Физ. деф:</div>
                            <div>{character.physDef} ({character.physReduction}%)</div>
                            <div style={{color: 'var(--muted)'}}>Маг. деф:</div>
                            <div>{character.magDef} ({character.magReduction}%)</div>
                            <div style={{color: 'var(--muted)'}}>ПЗ:</div>
                            <div>{character.defenseLevel}</div>
                            <div style={{color: 'var(--muted)'}}>Боевой дух:</div>
                            <div>{character.spirit}</div>
                        </div>

                        <div style={{
                            marginTop: '2rem',
                            padding: '1rem',
                            background: 'var(--bg-elev)',
                            borderRadius: '8px'
                        }}>
                            <div style={{color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '0.5rem'}}>ID
                                Персонажа
                            </div>
                            <div style={{fontFamily: 'monospace', fontSize: '0.85rem'}}>{character.id}</div>
                            {character.gameCharId && (
                                <>
                                    <div style={{
                                        color: 'var(--muted)',
                                        fontSize: '0.9rem',
                                        marginBottom: '0.5rem',
                                        marginTop: '1rem'
                                    }}>ID Игрового персонажа
                                    </div>
                                    <div style={{
                                        fontFamily: 'monospace',
                                        fontSize: '0.85rem'
                                    }}>{character.gameCharId}</div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '2rem'}}>
                    <button className="btn" onClick={onClose}>Закрыть</button>
                </div>
            </div>
        </div>
    );
}
