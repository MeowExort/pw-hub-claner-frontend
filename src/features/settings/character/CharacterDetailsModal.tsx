import React, {useState} from 'react';
import {Character} from '@/shared/types';
import {CharacterPower} from '@/entities/character/ui/CharacterPower';
import CharacterHistoryModal from '@/features/settings/character/CharacterHistoryModal';
import {formatNumber} from '@/shared/lib/number';
import {Modal} from '@/shared/ui/Modal/Modal';
import s from './CharacterDetailsModal.module.scss';

interface Props {
    character: Character;
    onClose: () => void;
}

export default function CharacterDetailsModal({character, onClose}: Props) {
    const [showHistory, setShowHistory] = useState(false);

    const footer = (
        <div className={s.footerActions}>
            <button
                className="btn secondary small"
                onClick={() => setShowHistory(true)}
                title="История изменений"
            >
                📜 История
            </button>
            <button className="btn secondary small" onClick={onClose}>Закрыть</button>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={character.name}
            footer={footer}
            maxWidth="800px"
        >
            <div className={s.content}>
                <div className={s.detailsGrid}>
                    <div className={s.column}>
                        <h3 className={s.sectionTitle}>Характеристики</h3>
                        <div className={s.statsList}>
                            <StatRow label="Класс" value={character.class}/>
                            <StatRow label="Сервер" value={character.server}/>
                            <StatRow label="Атака" value={`${formatNumber(character.minAttack)} - ${formatNumber(character.maxAttack)}`}/>
                            <StatRow label="ПА / ПЗ" value={`${formatNumber(character.attackLevel)} / ${formatNumber(character.defenseLevel)}`}/>
                            <StatRow label="Боевой дух" value={formatNumber(character.spirit)}/>
                            <StatRow label="Шанс крита" value={`${formatNumber(character.critChance, 1)}%`}/>
                            <StatRow label="Крит. урон" value={`${formatNumber(character.critDamage)}%`}/>
                            <StatRow label="Физ. пробив" value={formatNumber(character.physPenetration)}/>
                            <StatRow label="Маг. пробив" value={formatNumber(character.magPenetration)}/>
                            <StatRow label="Аспд" value={formatNumber(character.atkPerSec, 2)}/>
                            <StatRow label="Пение" value={`${formatNumber(character.chanting)}%`}/>
                            <div className={s.divider}/>
                            <StatRow label="Здоровье (HP)" value={formatNumber(character.health)}/>
                            <StatRow label="Физ. защита" value={formatNumber(character.physDef)}/>
                            <StatRow label="Маг. защита" value={formatNumber(character.magDef)}/>
                            <StatRow label="УФУ / УМУ" value={`${formatNumber(character.physReduction, 1)}% / ${formatNumber(character.magReduction, 1)}%`}/>
                        </div>
                    </div>

                    <div className={s.column}>
                        <h3 className={`${s.sectionTitle} ${s.warning}`}>Боевая мощь</h3>
                        
                        <CharacterPower character={character} style={{ marginBottom: '24px' }} />

                        {character.pwobsLink && (
                            <div className={s.linkSection}>
                                <div className={s.linkTitle}>Ссылка PwObs</div>
                                <a
                                    href={character.pwobsLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={s.link}
                                    title={character.pwobsLink}
                                >
                                    {character.pwobsLink}
                                </a>
                            </div>
                        )}

                        <div className={s.idSection}>
                            <div className={s.idRow}>
                                <span className={s.idLabel}>ID Персонажа:</span>
                                <span className={s.idValue}>{character.id}</span>
                            </div>
                            {character.gameCharId && (
                                <div className={s.idRow}>
                                    <span className={s.idLabel}>ID Игровой:</span>
                                    <span className={s.idValue}>{character.gameCharId}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showHistory && (
                <CharacterHistoryModal
                    characterId={character.id}
                    characterName={character.name}
                    onClose={() => setShowHistory(false)}
                />
            )}
        </Modal>
    );
}

function StatRow({label, value}: { label: string, value: string | number }) {
    return (
        <div className={s.statRow}>
            <span className={s.statLabel}>{label}:</span>
            <span className={s.statValue}>{value}</span>
        </div>
    );
}
