import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import styles from '@/app/styles/App.module.scss';
import {useAuth} from '@/app/providers/AuthContext';
import {useToast} from '@/app/providers/ToastContext';
import CharacterDetailsModal from '@/features/settings/character/CharacterDetailsModal';
import {Character} from '@/shared/types';
import {userApi} from '@/shared/api';

type Tab = 'GENERAL' | 'CHARACTERS' | 'NOTIFICATIONS';

export default function SettingsPage() {
    const {user, refresh} = useAuth();
    const {notify} = useToast();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('GENERAL');
    const [viewCharacter, setViewCharacter] = useState<Character | null>(null);
    const [otp, setOtp] = useState<{ code: string, expiresAt: string } | null>(null);
    const [loadingOtp, setLoadingOtp] = useState(false);
    
    const [notifSettings, setNotifSettings] = useState({
        clanApplications: true,
        applicationDecision: true,
        attendanceMarking: true,
        pvpEventCreated: true,
        pvpEventRally: true
    });

    useEffect(() => {
        if (user?.notificationSettings) {
            setNotifSettings(user.notificationSettings);
        }
    }, [user]);

    const handleGenerateOtp = async () => {
        setLoadingOtp(true);
        try {
            const res = await userApi.generateOtp();
            setOtp({ code: res.otpCode, expiresAt: res.otpExpiresAt });
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingOtp(false);
        }
    };

    const handleToggleNotif = async (key: string, value: boolean) => {
        const newSettings = { ...notifSettings, [key]: value };
        setNotifSettings(newSettings);
        try {
            await userApi.updateNotifications(newSettings);
            await refresh();
        } catch (e) {
            console.error(e);
        }
    };

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
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    <div className="card">
                        <div style={{fontWeight: 700, marginBottom: 8}}>Общая информация</div>
                        <p style={{color: 'var(--muted)'}}>
                            Здесь вы можете настроить параметры отображения и другие общие настройки приложения.
                            <br/>
                            Настройка темы перенесена в верхнее меню (шапку).
                        </p>
                    </div>

                    <div className="card">
                        <div style={{fontWeight: 700, marginBottom: 12}}>Telegram Интеграция</div>
                        {user?.telegramId ? (
                            <div style={{display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--success)'}}>
                                <span style={{fontSize: '1.5rem'}}>📱</span>
                                <div>
                                    <div style={{fontWeight: 600}}>Привязан: @{user.telegramUsername || user.telegramId}</div>
                                    <div style={{fontSize: '0.85rem', color: 'var(--muted)'}}>Вы получаете уведомления в Telegram</div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p style={{marginBottom: 16}}>Привяжите Telegram, чтобы получать важные уведомления о событиях клана и заявках.</p>
                                {otp ? (
                                    <div style={{background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px dashed var(--primary)'}}>
                                        <div style={{fontSize: '0.9rem', marginBottom: 8}}>Введите этот код боту <a href={`https://t.me/pwhubclanerbot?start=${otp.code}`} target="_blank" rel="noreferrer">@pwhubclanerbot</a> или отправьте команду:</div>
                                        <div style={{fontSize: '1.2rem', fontWeight: 700, letterSpacing: 2, textAlign: 'center', margin: '8px 0'}}>/bind {otp.code}</div>
                                        <div style={{fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center'}}>Действует до {new Date(otp.expiresAt).toLocaleTimeString()}</div>
                                    </div>
                                ) : (
                                    <button className="btn" onClick={handleGenerateOtp} disabled={loadingOtp}>
                                        {loadingOtp ? 'Генерация...' : 'Привязать Telegram'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
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
                                <div style={{fontSize: '0.9rem', color: 'var(--primary)', marginTop: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'}}
                                     onClick={() => {
                                         const isProd = window.location.hostname !== 'localhost';
                                         const base = isProd ? 'https://api.claner.pw-hub.ru/api/public/share/character' : `${window.location.origin}/api/public/share/character`;
                                         const link = `${base}/${char.shortId || char.id}`;
                                         navigator.clipboard.writeText(link);
                                         notify('Ссылка для Telegram скопирована!', 'success');
                                     }}
                                >
                                    <span>🔗 Ссылка для Telegram</span>
                                </div>
                                {window.location.hostname === 'localhost' && (
                                    <div style={{fontSize: '0.75rem', color: 'var(--warning)', marginTop: 2}}>
                                        ⚠️ Превью не будет работать на localhost (нужен ngrok)
                                    </div>
                                )}

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
                <div className="card" style={{maxWidth: 500}}>
                    <div style={{fontWeight: 700, marginBottom: 16}}>Настройки уведомлений (Telegram)</div>
                    
                    {!user?.telegramId && (
                        <div style={{marginBottom: 20, padding: 12, background: 'rgba(255,165,0,0.1)', border: '1px solid orange', borderRadius: 8, fontSize: '0.9rem'}}>
                            Telegram не привязан. Привяжите его во вкладке "Общие настройки", чтобы получать уведомления.
                        </div>
                    )}

                    <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                        <NotifToggle 
                            label="Новые заявки в клан" 
                            description="Для офицеров с правами управления"
                            checked={notifSettings.clanApplications} 
                            onChange={(val) => handleToggleNotif('clanApplications', val)} 
                        />
                        <NotifToggle 
                            label="Решение по моей заявке" 
                            description="Принятие или отказ"
                            checked={notifSettings.applicationDecision} 
                            onChange={(val) => handleToggleNotif('applicationDecision', val)} 
                        />
                        <NotifToggle 
                            label="Отметки посещаемости" 
                            description="Когда вам проставляют КХ, ЗУ и др."
                            checked={notifSettings.attendanceMarking} 
                            onChange={(val) => handleToggleNotif('attendanceMarking', val)} 
                        />
                        <NotifToggle 
                            label="Создание ПВП событий" 
                            description="Мгновенное уведомление с кнопками отметки"
                            checked={notifSettings.pvpEventCreated} 
                            onChange={(val) => handleToggleNotif('pvpEventCreated', val)} 
                        />
                        <NotifToggle 
                            label="Начало сбора на событие" 
                            description="Напоминание за время сбора"
                            checked={notifSettings.pvpEventRally} 
                            onChange={(val) => handleToggleNotif('pvpEventRally', val)} 
                        />
                    </div>
                </div>
            )}

            {viewCharacter && <CharacterDetailsModal character={viewCharacter} onClose={() => setViewCharacter(null)}/>}
        </div>
    );
}

function NotifToggle({label, description, checked, onChange}: {label: string, description: string, checked: boolean, onChange: (v: boolean) => void}) {
    return (
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
                <div style={{fontWeight: 600}}>{label}</div>
                <div style={{fontSize: '0.8rem', color: 'var(--muted)'}}>{description}</div>
            </div>
            <label className="switch">
                <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
                <span className="slider round"></span>
            </label>
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
