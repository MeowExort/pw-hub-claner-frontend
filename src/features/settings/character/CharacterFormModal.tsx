import React, {useEffect, useMemo, useState} from 'react';
import {Character, CharacterClass, ServerName} from '@/shared/types';
import {CharacterPower} from '@/entities/character/ui/CharacterPower';
import {calculatePowerDetails} from '@/shared/lib/power';
import {formatNumber, parseFormattedNumber} from '@/shared/lib/number';
import styles from './CharacterForm.module.scss';
import {useToast} from '@/app/providers/ToastContext';
import {useAuth} from '@/app/providers/AuthContext';
import PwobsIdModal from '@/entities/character/ui/PwobsIdModal';
import {Select, SelectGroup, SelectOption} from '@/shared/ui/Select/Select';

import {Modal} from '@/shared/ui/Modal/Modal';

const SERVERS: SelectOption[] = [
    {value: 'Центавр', label: 'Центавр'},
    {value: 'Фенрир', label: 'Фенрир'},
    {value: 'Мицар', label: 'Мицар'},
    {value: 'Капелла', label: 'Капелла'}
];

const CLASSES_DATA: Record<string, CharacterClass[]> = {
    'Люди': ['Воин', 'Маг', 'Стрелок'],
    'Зооморфы': ['Оборотень', 'Друид', 'Странник'],
    'Сиды': ['Лучник', 'Жрец', 'Паладин'],
    'Амфибии': ['Убийца', 'Шаман', 'Бард'],
    'Древние': ['Страж', 'Мистик', 'Дух крови'],
    'Тени': ['Призрак', 'Жнец']
};

const CLASS_GROUPS: SelectGroup[] = Object.entries(CLASSES_DATA).map(([race, classes]) => ({
    label: race,
    options: classes.map(c => ({value: c, label: c}))
}));

interface Props {
    character?: Character; // If provided, we are editing
    onClose: () => void;
    onSave?: () => void;
}

function StatRow({label, value}: { label: string, value: string | number }) {
    const formattedValue = typeof value === 'number' ? formatNumber(value) : value;
    return (
        <div className={styles.statRow}>
            <span className={styles.statLabel}>{label}:</span>
            <span className={styles.statValue}>{formattedValue}</span>
        </div>
    );
}

function ComparisonRow({label, oldVal, newVal, format = (v: number) => formatNumber(v, 2)}: any) {
    const diff = newVal - oldVal;
    if (Math.abs(diff) < 0.001) {
        return (
            <StatRow label={label} value={format(newVal)}/>
        );
    }
    const isBetter = diff > 0;
    const diffClass = isBetter ? styles.better : styles.worse;

    return (
        <div className={styles.statRow}>
            <span className={styles.statLabel}>{label}:</span>
            <div className={styles.values}>
                <span className={styles.oldValue}>{format(oldVal)}</span>
                <span className={styles.newValue}>{format(newVal)}</span>
                <span className={`${styles.diff} ${diffClass}`}>
                    ({diff > 0 ? '+' : ''}{format(diff)})
                </span>
            </div>
        </div>
    );
}

export default function CharacterFormModal({character, onClose, onSave}: Props) {
    const {notify} = useToast();
    const {createCharacter, updateCharacter} = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPwobsIdModal, setShowPwobsIdModal] = useState(false);

    const isEdit = !!character;

    const [formData, setFormData] = useState({
        name: character?.name || '',
        server: character?.server || 'Центавр' as ServerName,
        class: character?.class || 'Воин' as CharacterClass,
        pwobsLink: character?.pwobsLink || '',
        minAttack: character?.minAttack || 0,
        maxAttack: character?.maxAttack || 0,
        critChance: character?.critChance || 0,
        critDamage: character?.critDamage || 200,
        spirit: character?.spirit || 0,
        physPenetration: character?.physPenetration || 0,
        magPenetration: character?.magPenetration || 0,
        levelBonus: character?.levelBonus || 0,
        chanting: character?.chanting || 0,
        atkPerSec: character?.atkPerSec || 0,
        attackLevel: character?.attackLevel || 0,
        health: character?.health || 0,
        physDef: character?.physDef || 0,
        magDef: character?.magDef || 0,
        defenseLevel: character?.defenseLevel || 0,
        physReduction: character?.physReduction || 0,
        magReduction: character?.magReduction || 0
    });

    // Helper for number inputs with formatting
    const [displayValues, setDisplayValues] = useState<Record<string, string>>(() => {
        const result: Record<string, string> = {};
        Object.entries(formData).forEach(([key, value]) => {
            if (typeof value === 'number') {
                result[key] = formatNumber(value, key === 'atkPerSec' ? 2 : (key.includes('Chance') || key.includes('Reduction') || key === 'critChance' ? 1 : 0));
            }
        });
        return result;
    });

    const {oldStats, newStats} = useMemo(() => {
        const current: Character = {
            id: 'temp',
            ...formData,
            gameCharId: character?.gameCharId || '',
        };
        const ns = calculatePowerDetails(current);
        const os = isEdit ? calculatePowerDetails(character) : ns;
        return {oldStats: os, newStats: ns};
    }, [formData, character, isEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value, type} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        // Allow digits, one decimal separator, and spaces
        if (!/^[0-9\s.,]*$/.test(value)) return;

        const numValue = parseFormattedNumber(value);
        
        setFormData(prev => ({
            ...prev,
            [name]: numValue
        }));

        setDisplayValues(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNumberBlur = (name: string, value: number) => {
        const precision = name === 'atkPerSec' ? 2 : (name.includes('Chance') || name.includes('Reduction') || name === 'critChance' ? 1 : 0);
        setDisplayValues(prev => ({
            ...prev,
            [name]: formatNumber(value, precision)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.name.length > 9) {
            setError('Имя персонажа не должно превышать 9 символов');
            return;
        }
        if (formData.name.length < 2) {
            setError('Имя персонажа слишком короткое');
            return;
        }
        if (formData.pwobsLink && !/^https:\/\/pwobs\.com\/[^/]+\/players\/[^/]+$/.test(formData.pwobsLink)) {
            setError('Некорректная ссылка на pwobs. Пример: https://pwobs.com/centaur/players/123');
            return;
        }

        const submitData = {...formData};

        setError('');
        setLoading(true);
        try {
            if (isEdit) {
                await updateCharacter({...submitData, id: character.id});
                notify('Персонаж обновлен');
            } else {
                await createCharacter(submitData);
                notify('Персонаж создан');
            }
            onSave?.();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Ошибка сохранения');
        } finally {
            setLoading(false);
        }
    };

    const totalDiff = newStats.total - oldStats.total;
    const totalColor = totalDiff > 0 ? 'var(--success)' : (totalDiff < 0 ? 'var(--danger)' : '#fff');
    const totalDiffClass = totalDiff > 0 ? styles.better : (totalDiff < 0 ? styles.worse : '');

    const footer = (
        <div className={styles.actions} style={{ flexDirection: 'row', justifyContent: 'flex-end', width: '100%' }}>
            <button className="btn secondary" type="button" onClick={onClose} style={{ padding: '0.7rem 1.5rem', width: 'auto' }}>
                Отмена
            </button>
            <button className="btn" type="submit" form="character-form" disabled={loading} style={{ padding: '0.7rem 1.5rem', width: 'auto' }}>
                {loading ? 'Сохранение...' : (isEdit ? 'Сохранить изменения' : 'Создать персонажа')}
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={isEdit ? `Редактирование: ${character.name}` : 'Создание персонажа'}
            footer={footer}
            maxWidth="1100px"
        >
            {error && <div className={styles.error}>{error}</div>}

            <form id="character-form" onSubmit={handleSubmit} className={styles.layout}>
                <div className={styles.mainContent}>
                    <div className={styles.formGrid}>
                        <div className={`${styles.field} ${styles.fullWidth}`}>
                            <label className={styles.label}>Имя персонажа</label>
                            <input className={styles.input} name="name" value={formData.name} onChange={handleChange} required maxLength={9} placeholder="До 9 символов"/>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Сервер</label>
                            <Select 
                                value={formData.server} 
                                onChange={(val) => setFormData(prev => ({...prev, server: val as ServerName}))} 
                                options={SERVERS}
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Класс</label>
                            <Select 
                                value={formData.class} 
                                onChange={(val) => setFormData(prev => ({...prev, class: val as CharacterClass}))} 
                                groups={CLASS_GROUPS}
                            />
                        </div>

                        <div className={`${styles.field} ${styles.fullWidth}`}>
                            <label className={styles.label}>
                                Ссылка на pwobs
                                <button type="button" className={styles.noPwobsBtn} onClick={() => setShowPwobsIdModal(true)}>Персонажа нет на pwobs?</button>
                            </label>
                            <input className={styles.input} name="pwobsLink" value={formData.pwobsLink} onChange={handleChange} placeholder="https://pwobs.com/centaur/players/123"/>
                        </div>

                        <div className={styles.sectionTitle}>Атака</div>
                        <div className={styles.field}>
                            <label className={styles.label}>Мин атака</label>
                            <input className={styles.input} name="minAttack" value={displayValues.minAttack} onChange={handleNumberChange} onBlur={() => handleNumberBlur('minAttack', formData.minAttack)}/>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Макс атака</label>
                            <input className={styles.input} name="maxAttack" value={displayValues.maxAttack} onChange={handleNumberChange} onBlur={() => handleNumberBlur('maxAttack', formData.maxAttack)}/>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Крит шанс (%)</label>
                            <input className={styles.input} name="critChance" value={displayValues.critChance} onChange={handleNumberChange} onBlur={() => handleNumberBlur('critChance', formData.critChance)}/>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Крит урон (%)</label>
                            <input className={styles.input} name="critDamage" value={displayValues.critDamage} onChange={handleNumberChange} onBlur={() => handleNumberBlur('critDamage', formData.critDamage)}/>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Боевой дух</label>
                            <input className={styles.input} name="spirit" value={displayValues.spirit} onChange={handleNumberChange} onBlur={() => handleNumberBlur('spirit', formData.spirit)}/>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>ПА</label>
                            <input className={styles.input} name="attackLevel" value={displayValues.attackLevel} onChange={handleNumberChange} onBlur={() => handleNumberBlur('attackLevel', formData.attackLevel)}/>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Пение (%)</label>
                            <input className={styles.input} name="chanting" value={displayValues.chanting} onChange={handleNumberChange} onBlur={() => handleNumberBlur('chanting', formData.chanting)}/>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Аспд</label>
                            <input className={styles.input} name="atkPerSec" value={displayValues.atkPerSec} onChange={handleNumberChange} onBlur={() => handleNumberBlur('atkPerSec', formData.atkPerSec)}/>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Физ пробив</label>
                            <input className={styles.input} name="physPenetration" value={displayValues.physPenetration} onChange={handleNumberChange} onBlur={() => handleNumberBlur('physPenetration', formData.physPenetration)}/>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Маг пробив</label>
                            <input className={styles.input} name="magPenetration" value={displayValues.magPenetration} onChange={handleNumberChange} onBlur={() => handleNumberBlur('magPenetration', formData.magPenetration)}/>
                        </div>

                        <div className={styles.sectionTitle}>Защита</div>
                        <div className={styles.field}>
                            <label className={styles.label}>Здоровье</label>
                            <input className={styles.input} name="health" value={displayValues.health} onChange={handleNumberChange} onBlur={() => handleNumberBlur('health', formData.health)}/>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>ПЗ</label>
                            <input className={styles.input} name="defenseLevel" value={displayValues.defenseLevel} onChange={handleNumberChange} onBlur={() => handleNumberBlur('defenseLevel', formData.defenseLevel)}/>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Физ деф</label>
                            <input className={styles.input} name="physDef" value={displayValues.physDef} onChange={handleNumberChange} onBlur={() => handleNumberBlur('physDef', formData.physDef)}/>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Маг деф</label>
                            <input className={styles.input} name="magDef" value={displayValues.magDef} onChange={handleNumberChange} onBlur={() => handleNumberBlur('magDef', formData.magDef)}/>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>УФУ (%)</label>
                            <input className={styles.input} name="physReduction" value={displayValues.physReduction} onChange={handleNumberChange} onBlur={() => handleNumberBlur('physReduction', formData.physReduction)}/>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>УМУ (%)</label>
                            <input className={styles.input} name="magReduction" value={displayValues.magReduction} onChange={handleNumberChange} onBlur={() => handleNumberBlur('magReduction', formData.magReduction)}/>
                        </div>
                    </div>
                </div>

                <div className={styles.sidebar}>
                    <div className={styles.powerCard}>
                        <h3 className={`${styles.sectionTitle} ${styles.warning}`} style={{marginTop: 0, borderTop: 'none'}}>
                            {isEdit ? 'Боевая мощь (было → стало)' : 'Прогноз боевой мощи'}
                        </h3>

                        <CharacterPower
                            character={formData as any}
                            style={{ padding: '20px', marginBottom: '1.5rem', background: 'rgba(255, 255, 255, 0.02)' }}
                        />
                    </div>
                </div>
            </form>
            {showPwobsIdModal && (
                <PwobsIdModal
                    onClose={() => setShowPwobsIdModal(false)}
                    onSelect={(link) => {
                        setFormData(prev => ({...prev, pwobsLink: link}));
                    }}
                    initialServer={formData.server}
                />
            )}
        </Modal>
    );
}
