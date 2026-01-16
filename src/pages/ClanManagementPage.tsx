import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import styles from '@/app/styles/App.module.scss';
import s from './ClanManagementPage.module.scss';
import {useAppStore} from '@/shared/model/AppStore';
import {useAuth} from '@/app/providers/AuthContext';
import {useToast} from '@/app/providers/ToastContext';
import type {Character, CharacterClass, ClanApplication, ClanMember} from '@/shared/types';
import {calculatePowerDetails} from '@/shared/lib/power';
import {ClassIcon} from '@/shared/ui/ClassIcon';
import CharacterTooltip from '@/shared/ui/CharacterTooltip/CharacterTooltip';

type RosterItem = Character & ClanMember;

const ROLE_HIERARCHY: Record<string, number> = {
    MASTER: 4,
    MARSHAL: 3,
    OFFICER: 2,
    PL: 1,
    MEMBER: 0
};
const getRoleLevel = (r: string) => ROLE_HIERARCHY[r] ?? 0;

const CLASSES: CharacterClass[] = [
    'Воин', 'Маг', 'Стрелок',
    'Оборотень', 'Друид', 'Странник',
    'Лучник', 'Жрец', 'Паладин',
    'Убийца', 'Шаман', 'Бард',
    'Страж', 'Мистик', 'Дух крови',
    'Призрак', 'Жнец'
];

export default function ClanManagementPage() {
    const {user} = useAuth();
    const {notify} = useToast();
    const {
        clan,
        leaveClan,
        getClanRoster,
        getApplications,
        processApplication,
        resolveCharacterNames,
        hasPermission,
        changeMemberRole
    } = useAppStore();
    const navigate = useNavigate();
    const [roster, setRoster] = useState<RosterItem[]>([]);
    const [applications, setApplications] = useState<ClanApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterClass, setFilterClass] = useState<CharacterClass | 'ALL'>('ALL');
    const [sortBy, setSortBy] = useState<'POWER_DESC' | 'POWER_ASC' | 'NAME_DESC' | 'NAME_ASC'>('POWER_DESC');
    const [promoteModal, setPromoteModal] = useState<{ char: RosterItem, role: string } | null>(null);
    const [isUpdatingRole, setIsUpdatingRole] = useState(false);

    const canManageApps = hasPermission('CAN_MANAGE_MEMBERS');
    const canManageRoles = hasPermission('MANAGE_ROLES');
    const canViewAudit = hasPermission('CAN_VIEW_LOGS');

    const myRole = useMemo(() => roster.find(m => m.id === user?.mainCharacterId)?.role, [roster, user]);
    const myLevel = myRole ? getRoleLevel(myRole) : -1;
    console.log(canManageRoles, myLevel);

    const prevClanIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (clan) {
            if (prevClanIdRef.current !== clan.id) {
                setLoading(true);
            }
            prevClanIdRef.current = clan.id;

            Promise.all([getClanRoster(), getApplications()])
                .then(([r, apps]) => {
                    setRoster(r);
                    const pending = apps.filter(a => a.status === 'PENDING');
                    setApplications(pending);
                })
                .finally(() => setLoading(false));
        }
    }, [clan]);

    const handleProcess = async (id: string, decision: 'APPROVE' | 'REJECT') => {
        // Optimistic update
        setApplications(prev => prev.filter(app => app.id !== id));

        await processApplication(id, decision);
        const [r, apps] = await Promise.all([getClanRoster(), getApplications()]);
        setRoster(r);
        const pending = apps.filter(a => a.status === 'PENDING');
        setApplications(pending);
    };

    const filtered = useMemo(() => {
        let list = [...roster];
        if (filterClass !== 'ALL') {
            list = list.filter(c => c.class === filterClass);
        }
        list.sort((a, b) => {
            if (sortBy === 'POWER_DESC') {
                return calculatePowerDetails(b).total - calculatePowerDetails(a).total;
            } else if (sortBy === 'POWER_ASC') {
                return calculatePowerDetails(a).total - calculatePowerDetails(b).total;
            } else if (sortBy === 'NAME_DESC') {
                return b.name.localeCompare(a.name);
            } else {
                return a.name.localeCompare(b.name);
            }
        });
        return list;
    }, [roster, filterClass, sortBy]);

    if (!clan) return null;

    return (
        <div>
            <div className={styles.pageTitle}
                 style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span>Состав — {clan.icon} {clan.name}</span>
                <div style={{display: 'flex', gap: 10}}>
                    {canViewAudit && (
                        <button className="btn"
                                style={{background: '#7aa2f7', color: '#fff', padding: '6px 12px', fontSize: 14}}
                                onClick={() => navigate('/clan/audit')}>
                            Аудит
                        </button>
                    )}
                    <button className="btn"
                            style={{background: '#f7768e', color: '#fff', padding: '6px 12px', fontSize: 14}}
                            onClick={() => {
                                if (confirm('Выйти из клана?')) leaveClan(clan.id)
                            }}>
                        Покинуть клан
                    </button>
                </div>
            </div>

            {applications.length > 0 && (
                <div className="card" style={{marginBottom: 16}}>
                    <div style={{fontWeight: 700, marginBottom: 16, fontSize: '1.2rem'}}>Заявки ({applications.length})</div>
                    <div className={s.appsGrid}>
                        {applications.map(app => {
                            const info = app.character;
                            const power = info ? calculatePowerDetails(info).total : 0;

                            return (
                                <CharacterTooltip key={app.id} character={info || {} as any}>
                                    <div className={s.appCard}>
                                        <div className={s.appHeader}>
                                            <div className={s.appUser}>
                                                {info ? (
                                                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                                                        <ClassIcon cls={info.class} size={20}/>
                                                        {info.name}
                                                    </div>
                                                ) : (
                                                    <span style={{fontSize: '0.8rem', color: 'var(--muted)'}}>{app.characterId}</span>
                                                )}
                                            </div>
                                            <div className={s.appDate}>
                                                {new Date(app.createdDate).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className={s.appMessage}>
                                            {app.message || <i style={{color: 'var(--muted)'}}>Нет сообщения</i>}
                                        </div>

                                        {info && (
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                fontSize: '0.9rem',
                                                marginTop: 4
                                            }}>
                                                <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                                                    <span style={{color: 'var(--muted)'}}>Сила:</span>
                                                    <span style={{fontWeight: 700, color: '#ff9e64'}}>{power.toLocaleString('ru-RU')}</span>
                                                </div>
                                                <a 
                                                    href={`/c/${info.shortId || info.id}`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    style={{fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none'}}
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    Профиль ↗
                                                </a>
                                            </div>
                                        )}

                                        <div className={s.appFooter}>
                                            {/* Voting visualization */}
                                            {app.votes && app.votes.length > 0 && (
                                                <div style={{width: '100%'}}>
                                                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4}}>
                                                        <span style={{color: '#9ece6a', fontWeight: 600}}>👍 {app.votes.filter(v => v.vote === 1).length}</span>
                                                        <span style={{color: '#f7768e', fontWeight: 600}}>{app.votes.filter(v => v.vote === -1).length} 👎</span>
                                                    </div>
                                                    <div style={{height: 6, background: '#1a1b26', borderRadius: 3, overflow: 'hidden', display: 'flex'}}>
                                                        <div style={{
                                                            height: '100%', 
                                                            background: '#9ece6a', 
                                                            width: `${(app.votes.filter(v => v.vote === 1).length / app.votes.length) * 100}%`,
                                                            transition: 'width 0.3s ease'
                                                        }} />
                                                        <div style={{
                                                            height: '100%', 
                                                            background: '#f7768e', 
                                                            flexGrow: 1,
                                                            transition: 'flex-grow 0.3s ease'
                                                        }} />
                                                    </div>
                                                </div>
                                            )}

                                            {canManageApps && (
                                                <div className={s.appActions} onClick={e => e.stopPropagation()}>
                                                    <button className="btn" style={{background: '#9ece6a', color: '#000'}}
                                                            onClick={() => handleProcess(app.id, 'APPROVE')}>
                                                        Принять
                                                    </button>
                                                    <button className="btn" style={{background: '#f7768e', color: '#fff'}}
                                                            onClick={() => handleProcess(app.id, 'REJECT')}>
                                                        Отклонить
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CharacterTooltip>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="card" style={{marginBottom: 16}}>
                <div style={{display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap'}}>
                    <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                        <label style={{fontSize: 12, color: 'var(--muted)'}}>Класс</label>
                        <select className="input" value={filterClass}
                                onChange={e => setFilterClass(e.target.value as any)}>
                            <option value="ALL">Все классы</option>
                            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                        <label style={{fontSize: 12, color: 'var(--muted)'}}>Сортировка</label>
                        <select className="input" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                            <option value="POWER_DESC">Сила персонажа (↓)</option>
                            <option value="POWER_ASC">Сила персонажа (↑)</option>
                            <option value="NAME_ASC">По нику (↑)</option>
                            <option value="NAME_DESC">По нику (↓)</option>
                        </select>
                    </div>
                    <div style={{marginLeft: 'auto', alignSelf: 'end'}}>
                        Всего: {filtered.length}
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{textAlign: 'center', padding: 20}}>Загрузка состава...</div>
            ) : (
                <div className="grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12}}>
                    {filtered.map(char => {
                        const details = calculatePowerDetails(char);
                        return (
                            <CharacterTooltip key={char.id} character={char}>
                                <div className={`card ${s.cardHover}`}
                                     style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start'
                                    }}>
                                        <div style={{fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center'}}>
                                            <ClassIcon cls={char.class} size={18}/>
                                            {char.name}
                                        </div>
                                        {canManageRoles && getRoleLevel(char.role) < myLevel ? (
                                            <button
                                                className="btn secondary"
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    const currentRoleLevel = getRoleLevel(char.role);
                                                    // If current role is already higher or equal to mine, I shouldn't even see the edit button
                                                    // but let's double check and provide a safe default role in modal if current is not available
                                                    const initialRole = currentRoleLevel < myLevel ? char.role : 'MEMBER';
                                                    setPromoteModal({char, role: initialRole});
                                                }}
                                                style={{
                                                    fontSize: 12,
                                                    padding: '2px 8px',
                                                    height: 'auto',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4
                                                }}
                                                title="Изменить роль"
                                            >
                                                <span>{char.role}</span>
                                                <span>✎</span>
                                            </button>
                                        ) : (
                                            <div style={{
                                                fontSize: 12,
                                                background: '#2b2b3b',
                                                padding: '2px 6px',
                                                borderRadius: 4
                                            }}>{char.role}</div>
                                        )}
                                    </div>
                                    <div style={{color: '#7aa2f7', fontSize: 13, display: 'flex', alignItems: 'center'}}>
                                        {char.class}
                                    </div>
                                    <div style={{fontSize: 12, color: 'var(--muted)'}}>Уровень: {char.level || 1}</div>

                                    <div style={{
                                        marginTop: 8,
                                        paddingTop: 8,
                                        borderTop: '1px solid var(--border)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{fontSize: 12}}>Сила</span>
                                        <div className={s.tooltipContainer}>
                                            <span style={{
                                                fontWeight: 700,
                                                color: '#ff9e64'
                                            }}>{details.total.toLocaleString('ru-RU')}</span>
                                            {/* Power Breakdown Tooltip */}
                                            <div className={s.tooltip}>
                                                <div
                                                    style={{fontWeight: 700, marginBottom: 6, color: '#ff9e64'}}>Детализация
                                                    силы
                                                </div>
                                                <div className={s.statRow}><span>Тип урона:</span>
                                                    <span>{details.isPhysical ? 'Физ.' : 'Маг.'}</span></div>
                                                <div className={s.statRow}><span>База (ср.):</span>
                                                    <span>{Math.round(details.baseAvgDamage)}</span></div>
                                                <div className={s.statRow}><span>Множ. крита:</span>
                                                    <span>x{details.multipliers.crit.toFixed(2)}</span></div>
                                                <div className={s.statRow}><span>Множ. ПА:</span>
                                                    <span>x{details.multipliers.attackLevel.toFixed(2)}</span></div>
                                                <div className={s.statRow}><span>Множ. БД:</span>
                                                    <span>x{details.multipliers.spirit.toFixed(2)}</span></div>
                                                <div className={s.statRow}><span>Множ. пробива:</span>
                                                    <span>x{details.multipliers.penetration.toFixed(2)}</span></div>
                                                {details.isPhysical ? (
                                                    <div className={s.statRow}><span>Скорость:</span>
                                                        <span>x{details.attackRate.toFixed(2)}</span></div>
                                                ) : (
                                                    <div className={s.statRow}><span>Скорость каста:</span>
                                                        <span>x{(details.multipliers.castSpeed || 1).toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <div className={s.divider}/>
                                                <div className={s.statRow}><span>DPS (raw):</span>
                                                    <span>{Math.round(details.rawDps).toLocaleString()}</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CharacterTooltip>
                        );
                    })}
                </div>
            )}

            {promoteModal && (
                <div className="modal-backdrop" onClick={() => setPromoteModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{width: 300}}>
                        <div style={{fontWeight: 700, marginBottom: 12}}>Изменение роли</div>
                        <div style={{marginBottom: 12}}>
                            Участник: <b>{promoteModal.char.name}</b>
                        </div>
                        <div style={{marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8}}>
                            {['MASTER', 'MARSHAL', 'OFFICER', 'PL', 'MEMBER']
                                .filter(r => getRoleLevel(r) < myLevel)
                                .map(r => {
                                    const isSelected = promoteModal.role === r;
                                    return (
                                        <div
                                            key={r}
                                            onClick={() => setPromoteModal({...promoteModal, role: r})}
                                            style={{
                                                padding: '10px 12px',
                                                borderRadius: 8,
                                                border: isSelected ? '1px solid #7aa2f7' : '1px solid var(--border)',
                                                background: isSelected ? 'rgba(122, 162, 247, 0.1)' : 'var(--card)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <span style={{fontWeight: isSelected ? 600 : 400}}>{r}</span>
                                            {isSelected && <span style={{color: '#7aa2f7'}}>✓</span>}
                                        </div>
                                    );
                                })}
                        </div>
                        <div style={{display: 'flex', gap: 8, justifyContent: 'flex-end'}}>
                            <button className="btn secondary" onClick={() => setPromoteModal(null)}
                                    disabled={isUpdatingRole}>Отмена
                            </button>
                            <button className="btn" disabled={isUpdatingRole} onClick={async () => {
                                const {char, role} = promoteModal;
                                setIsUpdatingRole(true);
                                try {
                                    await changeMemberRole(char.id, role);
                                    setRoster(prev => prev.map(m => m.id === char.id ? {...m, role: role as any} : m));
                                    setPromoteModal(null);
                                    notify('Роль успешно изменена', 'success');
                                } catch (e: any) {
                                    console.error(e);
                                    notify('Ошибка при смене роли: ' + (e.message || 'Unknown error'), 'error');
                                } finally {
                                    setIsUpdatingRole(false);
                                }
                            }}>{isUpdatingRole ? 'Сохранение...' : 'Сохранить'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
