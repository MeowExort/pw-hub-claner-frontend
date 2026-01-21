import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import styles from '@/app/styles/App.module.scss';
import {useAuth} from '@/app/providers/AuthContext';
import ColorSettingsModal from '@/features/settings/color/ColorSettingsModal';
import {Select, SelectOption} from '@/shared/ui/Select/Select';
import {ClassIcon} from '@/shared/ui/ClassIcon';

export default function Header() {
    const {user, logout, switchCharacter} = useAuth();
    const [open, setOpen] = useState(false);
    const [showTheme, setShowTheme] = useState(false);
    const navigate = useNavigate();

    const initials = user?.username?.slice(0, 2).toUpperCase() || 'PW';
    const activeChar = user?.characters.find(c => c.id === user.mainCharacterId);

    const handleSwitch = (val: string) => {
        if (val === 'NEW') {
            navigate('/settings/characters');
        } else {
            switchCharacter(val);
        }
    };

    return (
        <div className={styles.headerRow}>
            <div className={styles.logo}>PW Hub — Кланер</div>
            {user ? (
                <div className={styles.userInfo} style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                    <button
                        className="btn secondary"
                        style={{padding: '4px 10px', fontSize: '0.85rem'}}
                        onClick={() => setShowTheme(true)}
                    >
                        Тема
                    </button>

                    {user.characters.length > 0 && (
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            {(() => {
                                const options: SelectOption[] = [
                                    ...user.characters.map(c => ({
                                        value: c.id,
                                        label: `${c.name}`,
                                        icon: <ClassIcon cls={c.class} size={18} style={{marginRight: 0}}/>,
                                    })),
                                    {value: 'NEW', label: '+ Новый персонаж'},
                                ];
                                return (
                                    <Select
                                        value={activeChar?.id || ''}
                                        options={options}
                                        onChange={(val) => handleSwitch(val)}
                                        className={styles.characterSelect}
                                    />
                                );
                            })()}
                        </div>
                    )}

                    <div onMouseLeave={() => setOpen(false)} style={{position: 'relative'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer'}}
                             onMouseEnter={() => setOpen(true)} onClick={() => setOpen(v => !v)}>
                            <div>{user.username}</div>
                            <div className={styles.avatar}>{initials}</div>
                        </div>
                        {open && (
                            <div className={styles.dropdown}>
                                <div className={styles.dropdownItem}
                                     onClick={() => void navigate('/settings/general')}>{user.username}</div>
                                <div className={styles.dropdownItem} onClick={() => void logout()}>Выйти</div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div style={{color: 'var(--muted)'}}>Гость</div>
            )}
            {showTheme && <ColorSettingsModal onClose={() => setShowTheme(false)}/>}
        </div>
    );
}
