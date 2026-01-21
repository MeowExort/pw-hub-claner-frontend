import React, {useEffect, useState} from 'react';
import {userApi} from '@/shared/api';
import {ClassIcon} from '@/shared/ui/ClassIcon';
import {CharacterPower} from '@/entities/character/ui/CharacterPower';
import {Character, CHARACTER_STAT_LABELS} from '@/shared/types';
import {formatNumber} from '@/shared/lib/number';
import VersionComparison from './VersionComparison';
import styles from './CharacterHistoryModal.module.scss';

import {Modal} from '@/shared/ui/Modal/Modal';

interface HistoryItem {
    id: string;
    createdAt: string;
    oldData: any;
    newData: any;
    snapshot: any;
    changedBy: {
        id: string;
        characters: any[];
    }
}

interface Props {
    characterId: string;
    characterName: string;
    onClose: () => void;
    isPublic?: boolean;
}

export default function CharacterHistoryModal({characterId, characterName, onClose, isPublic}: Props) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [viewingVersion, setViewingVersion] = useState<HistoryItem | null>(null);
    const [compareSelection, setCompareSelection] = useState<string[]>([]);

    useEffect(() => {
        const fetchFn = isPublic ? userApi.getPublicCharacterHistory : userApi.getCharacterHistory;
        fetchFn(characterId)
            .then(setHistory)
            .catch(err => setError('Ошибка загрузки истории'))
            .finally(() => setLoading(false));
    }, [characterId, isPublic]);

    const getChangerName = (item: HistoryItem) => {
        const char = item.changedBy.characters[0];
        return char ? char.name : 'Система';
    };

    const getChangerClass = (item: HistoryItem) => {
        const char = item.changedBy.characters[0];
        return char ? char.class : null;
    };

    const handleCompareToggle = (id: string) => {
        setCompareSelection(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            if (prev.length >= 2) return [prev[1], id];
            return [...prev, id];
        });
    };

    const selectedItems = history
        .filter(h => compareSelection.includes(h.id))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (viewingVersion) {
        const char = viewingVersion.snapshot as Character;
        return (
            <Modal
                isOpen={true}
                onClose={() => setViewingVersion(null)}
                title={`Версия от ${new Date(viewingVersion.createdAt).toLocaleString('ru-RU')}`}
                maxWidth="800px"
                footer={<button className="btn secondary" onClick={() => setViewingVersion(null)}>Назад к списку</button>}
            >
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem'}}>
                    <div>
                        <h3 style={{
                            marginTop: 0,
                            borderBottom: '1px solid var(--border)',
                            paddingBottom: '0.5rem'
                        }}>Характеристики</h3>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem', marginTop: '1rem'}}>
                            <StatRow label="Класс" value={char.class}/>
                            <StatRow label="Сервер" value={char.server}/>
                            <StatRow label="Атака" value={`${formatNumber(char.minAttack)} - ${formatNumber(char.maxAttack)}`}/>
                            <StatRow label="ПА / ПЗ" value={`${formatNumber(char.attackLevel)} / ${formatNumber(char.defenseLevel)}`}/>
                            <StatRow label="Боевой дух" value={formatNumber(char.spirit)}/>
                            <StatRow label="Шанс крита" value={`${formatNumber(char.critChance, 1)}%`}/>
                            <StatRow label="Крит. урон" value={`${formatNumber(char.critDamage)}%`}/>
                            <StatRow label="Физ. пробив" value={formatNumber(char.physPenetration)}/>
                            <StatRow label="Маг. пробив" value={formatNumber(char.magPenetration)}/>
                            <StatRow label="Аспд" value={formatNumber(char.atkPerSec, 2)}/>
                            <StatRow label="Пение" value={`${formatNumber(char.chanting)}%`}/>
                            <div style={{height: '1px', background: 'var(--border)', margin: '4px 0'}}/>
                            <StatRow label="Здоровье (HP)" value={formatNumber(char.health)}/>
                            <StatRow label="Физ. защита" value={formatNumber(char.physDef)}/>
                            <StatRow label="Маг. защита" value={formatNumber(char.magDef)}/>
                            <StatRow label="УФУ / УМУ" value={`${formatNumber(char.physReduction, 1)}% / ${formatNumber(char.magReduction, 1)}%`}/>
                        </div>
                    </div>

                    <div>
                        <h3 style={{
                            marginTop: 0,
                            borderBottom: '1px solid var(--border)',
                            paddingBottom: '0.5rem',
                            color: 'var(--warning)'
                        }}>Боевая мощь</h3>

                        <CharacterPower
                            character={char}
                            label="Сила в этой версии"
                            style={{padding: '20px', marginBottom: '1.5rem', marginTop: '1rem'}}
                        />

                        {char.pwobsLink && (
                            <div style={{marginTop: '1.5rem'}}>
                                <div style={{color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '0.5rem'}}>
                                    Ссылка PwObs
                                </div>
                                <a
                                    href={char.pwobsLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        color: 'var(--primary)',
                                        display: 'block',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        fontSize: '0.9rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border)'
                                    }}
                                    title={char.pwobsLink}
                                >
                                    {char.pwobsLink}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        );
    }

    if (selectedItems.length === 2) {
        return (
            <Modal
                isOpen={true}
                onClose={() => setCompareSelection([])}
                title="Сравнение версий"
                maxWidth="900px"
                footer={<button className="btn secondary" onClick={() => setCompareSelection([])}>Назад к списку</button>}
            >
                <div className={styles.compareHeader}>
                    <div className={styles.versionBox}>
                        <div className={styles.label}>Старая</div>
                        <div className={styles.date}>{new Date(selectedItems[0].createdAt).toLocaleString('ru-RU')}</div>
                    </div>
                    <div className={styles.arrow}>→</div>
                    <div className={styles.versionBox}>
                        <div className={styles.label}>Новая</div>
                        <div className={styles.date}>{new Date(selectedItems[1].createdAt).toLocaleString('ru-RU')}</div>
                    </div>
                </div>

                {selectedItems[0].snapshot && selectedItems[1].snapshot ? (
                    <VersionComparison v1={selectedItems[0].snapshot} v2={selectedItems[1].snapshot} />
                ) : (
                    <div style={{textAlign: 'center', padding: '3rem', color: 'var(--muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px'}}>
                        <div style={{fontSize: '3rem', marginBottom: '1rem', opacity: 0.3}}>⚠️</div>
                        Для одной из выбранных версий отсутствует снимок данных (старая запись).<br/> 
                        Сравнение невозможно.
                    </div>
                )}
            </Modal>
        );
    }

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={`История изменений: ${characterName}`}
            footer={<button className="btn secondary" onClick={onClose}>Закрыть</button>}
        >
            {loading && <div>Загрузка...</div>}
                    {error && <div style={{color: 'red'}}>{error}</div>}
                    {!loading && history.length === 0 && <div>История изменений пуста</div>}

                    {compareSelection.length > 0 && (
                        <div className={styles.compareBar}>
                            <div>
                                Выбрано для сравнения: <b>{compareSelection.length}</b> / 2
                                {compareSelection.length === 1 && (
                                    <span style={{fontSize: '0.9rem', color: 'var(--muted)', marginLeft: '12px'}}>Выберите еще одну версию</span>
                                )}
                            </div>
                            {compareSelection.length === 2 && (
                                <span className={`${styles.status} ${styles.ready}`}>Готово к сравнению!</span>
                            )}
                        </div>
                    )}

                    <div className={styles.historyList}>
                        {history.map(item => (
                            <div key={item.id} className={`${styles.historyItem} ${expandedId === item.id ? styles.expanded : ''}`}>
                                <div className={styles.itemMain} onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                                    <div className={styles.itemInfo}>
                                        <input 
                                            type="checkbox" 
                                            className={styles.compareCheckbox}
                                            checked={compareSelection.includes(item.id)}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                handleCompareToggle(item.id);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            title="Выбрать для сравнения"
                                        />
                                        <div className={styles.meta}>
                                            <div className={styles.date}>
                                                {new Date(item.createdAt).toLocaleString('ru-RU')}
                                            </div>
                                            <div className={styles.changer}>
                                                {getChangerClass(item) && <ClassIcon cls={getChangerClass(item)} size={20}/>}
                                                {getChangerName(item)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.actions}>
                                        {item.snapshot && (
                                            <button 
                                                className="btn secondary small" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setViewingVersion(item);
                                                }}
                                            >
                                                👁 Посмотреть версию
                                            </button>
                                        )}
                                        <button 
                                            className="btn icon small"
                                            style={{color: 'var(--primary)', background: 'transparent', fontSize: '1.2rem'}}
                                        >
                                            {expandedId === item.id ? '▲' : '▼'}
                                        </button>
                                    </div>
                                </div>

                                {expandedId === item.id && (
                                    <div className={styles.expandedContent}>
                                        <div className={styles.diffGrid}>
                                            <div className={styles.label}>Параметр</div>
                                            <div className={styles.label}>Было</div>
                                            <div className={styles.label}>Стало</div>
                                        </div>
                                        {Object.keys(item.newData).map(key => {
                                            const isNumeric = typeof item.newData[key] === 'number';
                                            const isPercent = key.includes('Chance') || key.includes('Reduction') || key === 'critChance' || key === 'critDamage' || key === 'chanting';
                                            const precision = key === 'atkPerSec' ? 2 : (isPercent ? 1 : 0);
                                            
                                            const formatVal = (v: any) => {
                                                if (typeof v !== 'number') return String(v);
                                                return formatNumber(v, precision) + (isPercent ? '%' : '');
                                            };

                                            return (
                                                <div key={key} className={styles.diffRow}>
                                                    <div className={styles.statName}>{CHARACTER_STAT_LABELS[key] || key}</div>
                                                    <div className={styles.oldValue}>{formatVal(item.oldData[key])}</div>
                                                    <div className={styles.newValue}>{formatVal(item.newData[key])}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
            </Modal>
        );
}

function StatRow({label, value}: { label: string, value: string | number }) {
    return (
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{color: 'var(--muted)', fontSize: '0.9rem'}}>{label}:</span>
            <span style={{fontWeight: 600}}>{value}</span>
        </div>
    );
}
