import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {Character} from '@/shared/types';
import {userApi} from '@/shared/api';
import {ClassIcon} from '@/shared/ui/ClassIcon';
import {CharacterPower} from '@/entities/character/ui/CharacterPower';
import styles from '@/app/styles/App.module.scss';
import CharacterHistoryModal from '@/features/settings/character/CharacterHistoryModal';

export default function PublicProfilePage() {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [char, setChar] = useState<Character | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);

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

    return (
        <div style={{maxWidth: 800, margin: '0 auto', padding: '20px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    <ClassIcon cls={char.class} size={48}/>
                    <div>
                        <h1 style={{margin: 0}}>{char.name}</h1>
                        <div style={{color: 'var(--muted)'}}>{char.class} • {char.server} • {char.level} ур.</div>
                    </div>
                </div>
                <button className="btn secondary" onClick={() => setShowHistory(true)}>
                    📜 История версий
                </button>
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
                    <h3 style={{
                        marginTop: 0,
                        borderBottom: '1px solid var(--border)',
                        paddingBottom: '0.5rem',
                        color: 'var(--warning)'
                    }}>Боевая мощь</h3>

                    <CharacterPower
                        character={char}
                        style={{marginTop: '1rem', padding: '20px', marginBottom: '1.5rem'}}
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
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
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

            {showHistory && (
                <CharacterHistoryModal
                    characterId={char.id}
                    characterName={char.name}
                    onClose={() => setShowHistory(false)}
                    isPublic={true}
                />
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
