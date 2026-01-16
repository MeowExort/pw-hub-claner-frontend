import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {Character} from '@/shared/types';
import {userApi} from '@/shared/api';
import {ClassIcon} from '@/shared/ui/ClassIcon';
import styles from '@/app/styles/App.module.scss';
import {calculatePowerDetails} from '@/shared/lib/power';

export default function PublicProfilePage() {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [char, setChar] = useState<Character | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            userApi.getPublicCharacter(id)
                .then(setChar)
                .catch(err => setError('Персонаж не найден'))
                .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) return <div className={styles.loading}>Загрузка...</div>;
    if (error || !char) return (
        <div className="card" style={{textAlign: 'center', marginTop: '2rem'}}>
            <h3>{error || 'Персонаж не найден'}</h3>
            <button className="btn" onClick={() => navigate('/')} style={{marginTop: '1rem'}}>
                На главную
            </button>
        </div>
    );

    const details = calculatePowerDetails(char);

    return (
        <div style={{maxWidth: 800, margin: '0 auto', padding: '20px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px'}}>
                <ClassIcon cls={char.class} size={48}/>
                <div>
                    <h1 style={{margin: 0}}>{char.name}</h1>
                    <div style={{color: 'var(--muted)'}}>{char.class} • {char.server} • {char.level} ур.</div>
                </div>
            </div>

            <div className="grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px'}}>
                <div className="card">
                    <h3 style={{marginTop: 0, borderBottom: '1px solid var(--border)', paddingBottom: '10px'}}>Характеристики</h3>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                        <StatRow label="Атака" value={`${char.minAttack} - ${char.maxAttack}`}/>
                        <StatRow label="ПА / ПЗ" value={`${char.attackLevel} / ${char.defenseLevel}`}/>
                        <StatRow label="Боевой дух" value={char.spirit}/>
                        <StatRow label="Шанс крита" value={`${char.critChance}%`}/>
                        <StatRow label="Крит. урон" value={`${char.critDamage}%`}/>
                        <StatRow label="Физ. пробив" value={char.physPenetration}/>
                        <StatRow label="Маг. пробив" value={char.magPenetration}/>
                        <StatRow label="Аспд" value={char.atkPerSec}/>
                        <StatRow label="Пение" value={`${char.chanting}%`}/>
                        <div style={{height: '1px', background: 'var(--border)', margin: '5px 0'}}/>
                        <StatRow label="Здоровье (HP)" value={char.health}/>
                        <StatRow label="Физ. защита" value={char.physDef}/>
                        <StatRow label="Маг. защита" value={char.magDef}/>
                        <StatRow label="УФУ / УМУ" value={`${char.physReduction}% / ${char.magReduction}%`}/>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{marginTop: 0, borderBottom: '1px solid var(--border)', paddingBottom: '10px', color: '#ff9e64'}}>Боевая мощь</h3>
                    <div style={{textAlign: 'center', padding: '20px 0'}}>
                        <div style={{fontSize: '3rem', fontWeight: 800, color: '#ff9e64'}}>
                            {details.total.toLocaleString('ru-RU')}
                        </div>
                        <div style={{color: 'var(--muted)', fontSize: '0.9rem'}}>Расчетный показатель силы</div>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem'}}>
                        <StatRow label="Базовый урон (ср.)" value={Math.round(details.baseAvgDamage)}/>
                        <StatRow label="Множитель крита" value={`x${details.multipliers.crit.toFixed(2)}`}/>
                        <StatRow label="Множитель ПА" value={`x${details.multipliers.attackLevel.toFixed(2)}`}/>
                        <StatRow label="Множитель БД" value={`x${details.multipliers.spirit.toFixed(2)}`}/>
                        <StatRow label="Множитель пробива" value={`x${details.multipliers.penetration.toFixed(2)}`}/>
                        <StatRow label="Скорость" value={`x${(details.isPhysical ? details.attackRate : (details.multipliers.castSpeed || 1)).toFixed(2)}`}/>
                    </div>
                    {char.pwobsLink && (
                        <div style={{marginTop: '20px', textAlign: 'center'}}>
                            <a href={char.pwobsLink} target="_blank" rel="noreferrer" className="btn secondary" style={{width: '100%'}}>
                                Профиль на pwobs.com
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {(char as any).clan && (
                <div className="card" style={{marginTop: '20px'}}>
                    <h3 style={{marginTop: 0}}>Клан</h3>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <span style={{fontSize: '1.5rem'}}>{(char as any).clan.icon}</span>
                        <div>
                            <div style={{fontWeight: 700}}>{(char as any).clan.name}</div>
                            <div style={{fontSize: '0.9rem', color: 'var(--muted)'}}>{(char as any).clanRole}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
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
