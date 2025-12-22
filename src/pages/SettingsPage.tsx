import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import styles from '@/app/styles/App.module.scss';
import {useAuth} from '@/app/providers/AuthContext';
import CharacterDetailsModal from '@/features/settings/character/CharacterDetailsModal';
import {Character} from '@/shared/types';

type Tab = 'GENERAL' | 'CHARACTERS' | 'NOTIFICATIONS';

export default function SettingsPage() {
    const {user} = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('GENERAL');
    const [viewCharacter, setViewCharacter] = useState<Character | null>(null);

    return (
        <div>
            <div className={styles.pageTitle}>Настройки</div>

            <div
                style={{display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem'}}>
                <TabButton active={activeTab === 'GENERAL'} onClick={() => setActiveTab('GENERAL')}>
                    Общие настройки
                </TabButton>
                <TabButton active={activeTab === 'CHARACTERS'} onClick={() => setActiveTab('CHARACTERS')}>
                    Персонажи
                </TabButton>
                <TabButton active={activeTab === 'NOTIFICATIONS'} onClick={() => setActiveTab('NOTIFICATIONS')}>
                    Уведомления
                </TabButton>
            </div>

            {activeTab === 'GENERAL' && (
                <div className="card">
                    <div style={{fontWeight: 700, marginBottom: 8}}>Общая информация</div>
                    <p style={{color: 'var(--muted)'}}>
                        Здесь вы можете настроить параметры отображения и другие общие настройки приложения.
                        <br/>
                        Настройка темы перенесена в верхнее меню (шапку).
                    </p>
                </div>
            )}

            {activeTab === 'CHARACTERS' && (
                <div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem'
                    }}>
                        <div style={{fontWeight: 600}}>Управление персонажами</div>
                        <button className="btn" onClick={() => navigate('/create-character')}>
                            + Создать персонажа
                        </button>
                    </div>
                    <div className="grid"
                         style={{gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px'}}>
                        {user?.characters.map(char => (
                            <div key={char.id} className="card" style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                position: 'relative'
                            }}>
                                {user.mainCharacterId === char.id && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 12,
                                        right: 12,
                                        fontSize: '0.8rem',
                                        color: 'var(--success)',
                                        border: '1px solid var(--success)',
                                        padding: '2px 6px',
                                        borderRadius: 4
                                    }}>
                                        Основной
                                    </div>
                                )}
                                <div style={{fontWeight: 700, fontSize: '1.1rem'}}>{char.name}</div>
                                <div style={{color: 'var(--muted)', fontSize: '0.9rem'}}>
                                    {char.class} • {char.server}
                                </div>
                                <div style={{fontSize: '0.9rem'}}>Уровень: {char.level}</div>

                                <div style={{
                                    marginTop: '1rem',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '8px'
                                }}>
                                    <button className="btn secondary" style={{fontSize: '0.9rem', padding: '6px'}}
                                            onClick={() => navigate(`/create-character?edit=${char.id}`)}>
                                        Редактировать
                                    </button>
                                    <button className="btn secondary" style={{fontSize: '0.9rem', padding: '6px'}}
                                            onClick={() => setViewCharacter(char)}>
                                        Просмотр
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'NOTIFICATIONS' && (
                <div className="card">
                    <div style={{fontWeight: 700, marginBottom: 8}}>Уведомления</div>
                    <p style={{color: 'var(--muted)'}}>Настройки уведомлений находятся в разработке.</p>
                </div>
            )}

            {viewCharacter && <CharacterDetailsModal character={viewCharacter} onClose={() => setViewCharacter(null)}/>}
        </div>
    );
}

function TabButton({active, children, onClick}: { active: boolean; children: React.ReactNode; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                background: 'transparent',
                border: 'none',
                borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
                color: active ? 'var(--text)' : 'var(--muted)',
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s',
                fontSize: '1rem'
            }}
        >
            {children}
        </button>
    );
}
