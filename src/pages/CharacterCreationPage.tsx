import React, {useEffect, useMemo, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {useAuth} from '@/app/providers/AuthContext';
import {Character, CharacterClass, ServerName} from '@/shared/types';
import {calculatePowerDetails, PowerBreakdown} from '@/shared/lib/power';
import styles from './CharacterCreationPage.module.scss';

const SERVERS: ServerName[] = ['Центавр', 'Фенрир', 'Мицар', 'Капелла'];
const CLASSES: Record<string, CharacterClass[]> = {
    'Люди': ['Воин', 'Маг', 'Стрелок'],
    'Зооморфы': ['Оборотень', 'Друид', 'Странник'],
    'Сиды': ['Лучник', 'Жрец', 'Паладин'],
    'Амфибии': ['Убийца', 'Шаман', 'Бард'],
    'Древние': ['Страж', 'Мистик', 'Дух крови'],
    'Тени': ['Призрак', 'Жнец']
};

function ComparisonRow({label, oldVal, newVal, isPercent = false, format = (v: number) => v.toFixed(2)}: any) {
    const diff = newVal - oldVal;
    // Small epsilon for float comparison
    if (Math.abs(diff) < 0.001) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.9rem',
                padding: '4px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <span style={{color: 'var(--muted)'}}>{label}</span>
                <span>{format(newVal)}</span>
            </div>
        );
    }
    const isBetter = diff > 0;
    const color = isBetter ? 'var(--success)' : 'var(--danger)';
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.9rem',
            padding: '4px 0',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
            <span style={{color: 'var(--muted)'}}>{label}</span>
            <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                <span style={{textDecoration: 'line-through', color: '#666', fontSize: '0.8em'}}>{format(oldVal)}</span>
                <span style={{color: '#fff'}}>{format(newVal)}</span>
                <span style={{color, fontSize: '0.8em'}}>
           ({diff > 0 ? '+' : ''}{format(diff)})
        </span>
            </div>
        </div>
    );
}

function PowerComparisonPanel({oldStats, newStats}: { oldStats: PowerBreakdown, newStats: PowerBreakdown }) {
    const totalDiff = newStats.total - oldStats.total;
    const totalColor = totalDiff > 0 ? 'var(--success)' : (totalDiff < 0 ? 'var(--danger)' : '#fff');

    return (
        <div className="card" style={{padding: '1.5rem', background: '#15171c', border: '1px solid var(--border)'}}>
            <h3 style={{marginTop: 0, marginBottom: '1rem', color: 'var(--warning)'}}>Сравнение силы</h3>

            <div style={{marginBottom: '1.5rem', textAlign: 'center'}}>
                <div style={{fontSize: '0.9rem', color: 'var(--muted)'}}>Итоговая сила</div>
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '10px'}}>
                    {Math.abs(totalDiff) > 0 && (
                        <span style={{fontSize: '1.2rem', color: '#666', textDecoration: 'line-through'}}>
                   {oldStats.total.toLocaleString()}
                </span>
                    )}
                    <span style={{fontSize: '1.8rem', fontWeight: 700, color: totalColor}}>
                {newStats.total.toLocaleString()}
             </span>
                </div>
                {Math.abs(totalDiff) > 0 && (
                    <div style={{color: totalColor, fontWeight: 600}}>
                        {totalDiff > 0 ? '▲' : '▼'} {Math.abs(totalDiff).toLocaleString()}
                    </div>
                )}
            </div>

            <div style={{marginBottom: '1rem'}}>
                <div style={{fontWeight: 600, marginBottom: '0.5rem', color: '#fff'}}>Детализация (Множители)</div>
                <ComparisonRow
                    label="Крит"
                    oldVal={oldStats.multipliers.crit}
                    newVal={newStats.multipliers.crit}
                />
                <ComparisonRow
                    label="ПА"
                    oldVal={oldStats.multipliers.attackLevel}
                    newVal={newStats.multipliers.attackLevel}
                />
                <ComparisonRow
                    label="БД"
                    oldVal={oldStats.multipliers.spirit}
                    newVal={newStats.multipliers.spirit}
                />
                <ComparisonRow
                    label="Пробив"
                    oldVal={oldStats.multipliers.penetration}
                    newVal={newStats.multipliers.penetration}
                />
                {newStats.isPhysical ? (
                    <ComparisonRow
                        label="Аспд"
                        oldVal={oldStats.attackRate}
                        newVal={newStats.attackRate}
                    />
                ) : (
                    <ComparisonRow
                        label="Пение"
                        oldVal={oldStats.multipliers.castSpeed || 1}
                        newVal={newStats.multipliers.castSpeed || 1}
                    />
                )}
            </div>

            <div style={{fontSize: '0.8rem', color: 'var(--muted)', marginTop: '1rem', fontStyle: 'italic'}}>
                * Расчет примерный и зависит от множества факторов.
            </div>
        </div>
    );
}

export default function CharacterCreationPage() {
    const {user, createCharacter, updateCharacter} = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const isEdit = !!editId;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        server: 'Центавр' as ServerName,
        class: 'Воин' as CharacterClass,
        pwobsLink: '',
        minAttack: 0,
        maxAttack: 0,
        critChance: 0,
        critDamage: 200,
        spirit: 0,
        physPenetration: 0,
        magPenetration: 0,
        levelBonus: 0,
        chanting: 0,
        atkPerSec: 0,
        attackLevel: 0,
        health: 0,
        physDef: 0,
        magDef: 0,
        defenseLevel: 0,
        physReduction: 0,
        magReduction: 0
    });

    // Calculate Powers
    const {oldStats, newStats} = useMemo(() => {
        // Mock character object from form data
        const current: Character = {
            id: 'temp',
            ...formData,
            level: 1, // default
            gameCharId: '', // not needed for calc
        };
        const ns = calculatePowerDetails(current);

        let os = ns;
        if (isEdit && user && editId) {
            const original = user.characters.find(c => c.id === editId);
            if (original) {
                os = calculatePowerDetails(original);
            }
        } else {
            // For creation mode, we can compare against "empty" or just hide comparison.
            // But requirement says "При редактировании".
            // So if not edit, os = ns (no diff).
        }

        return {oldStats: os, newStats: ns};
    }, [formData, isEdit, user, editId]);

    useEffect(() => {
        if (isEdit && user && editId) {
            const char = user.characters.find(c => c.id === editId);
            if (char) {
                setFormData({
                    name: char.name,
                    server: char.server,
                    class: char.class,
                    pwobsLink: char.pwobsLink || '',
                    minAttack: char.minAttack,
                    maxAttack: char.maxAttack,
                    critChance: char.critChance,
                    critDamage: char.critDamage,
                    spirit: char.spirit,
                    physPenetration: char.physPenetration,
                    magPenetration: char.magPenetration,
                    levelBonus: char.levelBonus,
                    chanting: char.chanting,
                    atkPerSec: char.atkPerSec,
                    attackLevel: char.attackLevel,
                    health: char.health,
                    physDef: char.physDef,
                    magDef: char.magDef,
                    defenseLevel: char.defenseLevel,
                    physReduction: char.physReduction,
                    magReduction: char.magReduction
                });
            }
        }
    }, [isEdit, editId, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value, type} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
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

        if (!/^https:\/\/pwobs\.com\/[^/]+\/players\/[^/]+$/.test(formData.pwobsLink)) {
            setError('Некорректная ссылка на pwobs. Пример: https://pwobs.com/centaur/players/123');
            return;
        }

        setError('');
        setLoading(true);
        try {
            if (isEdit && editId) {
                await updateCharacter({...formData, id: editId});
            } else {
                await createCharacter({...formData, level: 1});
            }
            navigate(isEdit ? '/settings' : '/');
        } catch (err: any) {
            setError(err.message || 'Ошибка сохранения персонажа');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{maxWidth: '1200px', margin: '0 auto', padding: '2rem'}}>
            <h1 className={styles.title}>{isEdit ? 'Редактирование персонажа' : 'Создание персонажа'}</h1>

            {error && <div style={{color: 'red', marginBottom: '1rem', textAlign: 'center'}}>{error}</div>}

            <div style={{display: 'flex', gap: '2rem', alignItems: 'flex-start', flexDirection: 'row-reverse'}}>
                {/* Comparison Panel - Show only in Edit mode or always? Req says "При редактировании".
             But useful for creation too (preview). Let's show always but comparison is only valid if Edit.
             Actually, for creation, comparing to 0 is weird. 
             Let's show it always, but if !isEdit, oldStats are same as newStats (deltas 0). 
         */}
                <div style={{width: '320px', flexShrink: 0, position: 'sticky', top: '20px'}}>
                    {isEdit ? (
                        <PowerComparisonPanel oldStats={oldStats} newStats={newStats}/>
                    ) : (
                        <div className="card"
                             style={{padding: '1.5rem', background: '#15171c', border: '1px solid var(--border)'}}>
                            <h3 style={{marginTop: 0, marginBottom: '1rem', color: 'var(--warning)'}}>Предпросмотр
                                силы</h3>
                            <div style={{
                                fontSize: '2rem',
                                fontWeight: 700,
                                textAlign: 'center',
                                color: 'var(--success)'
                            }}>
                                {newStats.total.toLocaleString()}
                            </div>
                            <div style={{textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem', marginTop: 8}}>
                                Заполните характеристики для расчета
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.root} style={{margin: 0, flex: 1, maxWidth: 'none'}}>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGrid}>
                            <div className={`${styles.field} ${styles.fullWidth}`}>
                                <label className={styles.label}>Имя персонажа (до 9 символов)</label>
                                <input
                                    className={styles.input}
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    maxLength={9}
                                    placeholder="Введите имя"
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Сервер</label>
                                <select className={styles.select} name="server" value={formData.server}
                                        onChange={handleChange}>
                                    {SERVERS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Класс</label>
                                <select className={styles.select} name="class" value={formData.class}
                                        onChange={handleChange}>
                                    {Object.entries(CLASSES).map(([race, classes]) => (
                                        <optgroup key={race} label={race}>
                                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>

                            <div className={`${styles.field} ${styles.fullWidth}`}>
                                <label className={styles.label}>Ссылка на pwobs</label>
                                <input
                                    className={styles.input}
                                    name="pwobsLink"
                                    value={formData.pwobsLink}
                                    onChange={handleChange}
                                    placeholder="https://pwobs.com/centaur/players/12345"
                                    required
                                />
                            </div>

                            <div className={styles.sectionTitle}>Характеристики атаки</div>

                            <div className={styles.field}>
                                <label className={styles.label}>Мин планка атаки</label>
                                <input type="number" className={styles.input} name="minAttack"
                                       value={formData.minAttack} onChange={handleChange}/>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Макс планка атака</label>
                                <input type="number" className={styles.input} name="maxAttack"
                                       value={formData.maxAttack} onChange={handleChange}/>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Шанс крита (%)</label>
                                <input type="number" className={styles.input} name="critChance"
                                       value={formData.critChance} onChange={handleChange} step="0.1"/>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Крит. урон (%)</label>
                                <input type="number" className={styles.input} name="critDamage"
                                       value={formData.critDamage} onChange={handleChange}/>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Боевой дух</label>
                                <input type="number" className={styles.input} name="spirit" value={formData.spirit}
                                       onChange={handleChange}/>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Физ. пробивание</label>
                                <input type="number" className={styles.input} name="physPenetration"
                                       value={formData.physPenetration} onChange={handleChange}/>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Маг. пробивание</label>
                                <input type="number" className={styles.input} name="magPenetration"
                                       value={formData.magPenetration} onChange={handleChange}/>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Бонус к уровню</label>
                                <input type="number" className={styles.input} name="levelBonus"
                                       value={formData.levelBonus} onChange={handleChange}/>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Пение (%)</label>
                                <input type="number" className={styles.input} name="chanting" value={formData.chanting}
                                       onChange={handleChange}/>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Атак в секунду</label>
                                <input type="number" className={styles.input} name="atkPerSec"
                                       value={formData.atkPerSec} onChange={handleChange} step="0.01"/>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Показатель атаки</label>
                                <input type="number" className={styles.input} name="attackLevel"
                                       value={formData.attackLevel} onChange={handleChange}/>
                            </div>

                            <div className={styles.sectionTitle}>Характеристики защиты</div>

                            <div className={styles.field}>
                                <label className={styles.label}>Здоровье</label>
                                <input type="number" className={styles.input} name="health" value={formData.health}
                                       onChange={handleChange}/>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Физ. защита</label>
                                <input type="number" className={styles.input} name="physDef" value={formData.physDef}
                                       onChange={handleChange}/>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Маг. защита</label>
                                <input type="number" className={styles.input} name="magDef" value={formData.magDef}
                                       onChange={handleChange}/>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Показатель защиты</label>
                                <input type="number" className={styles.input} name="defenseLevel"
                                       value={formData.defenseLevel} onChange={handleChange}/>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Уменьшение физ. урона (%)</label>
                                <input type="number" className={styles.input} name="physReduction"
                                       value={formData.physReduction} onChange={handleChange} step="0.1"/>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Уменьшение маг. урона (%)</label>
                                <input type="number" className={styles.input} name="magReduction"
                                       value={formData.magReduction} onChange={handleChange} step="0.1"/>
                            </div>
                        </div>

                        <button className={styles.button} type="submit" disabled={loading}>
                            {loading ? (isEdit ? 'Сохранение...' : 'Создание...') : (isEdit ? 'Сохранить изменения' : 'Создать персонажа')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
