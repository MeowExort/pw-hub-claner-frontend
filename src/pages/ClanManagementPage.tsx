import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import styles from '@/app/styles/App.module.scss';
import s from './ClanManagementPage.module.scss';
import {Modal} from '@/shared/ui/Modal/Modal';
import {useAppStore} from '@/shared/model/AppStore';
import {useAuth} from '@/app/providers/AuthContext';
import {useToast} from '@/app/providers/ToastContext';
import type {Character, CharacterClass, ClanApplication, ClanMember} from '@/shared/types';
import {clanApi, eventsApi, userApi} from '@/shared/api';
import {formatNumber} from '@/shared/lib/number';
import {calculatePowerDetails} from '@/shared/lib/power';
import {ClassIcon} from '@/shared/ui/ClassIcon';
import {Tooltip} from '@/shared/ui/Tooltip/Tooltip';
import CharacterTooltip from '@/shared/ui/CharacterTooltip/CharacterTooltip';
import CharacterFormModal from '@/features/settings/character/CharacterFormModal';
import CharacterHistoryModal from '@/features/settings/character/CharacterHistoryModal';
import VersionComparison from '@/features/settings/character/VersionComparison';

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
        changeMemberRole,
        kickMember,
        events,
        historyEvents,
        loadMoreHistory,
        hasMoreHistory,
        loadingHistory
    } = useAppStore();
    const navigate = useNavigate();
    const [roster, setRoster] = useState<RosterItem[]>([]);
    const [applications, setApplications] = useState<ClanApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingAllHistory, setLoadingAllHistory] = useState(false);
    const [filterClass, setFilterClass] = useState<CharacterClass | 'ALL'>('ALL');
    const [searchName, setSearchName] = useState('');
    const [sortBy, setSortBy] = useState<'POWER_DESC' | 'POWER_ASC' | 'NAME_DESC' | 'NAME_ASC' | 'ROLE_DESC' | 'ROLE_ASC'>('POWER_DESC');
    const [promoteModal, setPromoteModal] = useState<{ char: RosterItem, role: string } | null>(null);
    const [kickConfirm, setKickConfirm] = useState<RosterItem | null>(null);
    const [editCharModal, setEditCharModal] = useState<RosterItem | null>(null);
    const [historyModal, setHistoryModal] = useState<RosterItem | null>(null);
    const [isUpdatingRole, setIsUpdatingRole] = useState(false);
    const [isKicking, setIsKicking] = useState(false);

    const canManageApps = hasPermission('CAN_MANAGE_MEMBERS');
    const canManageRoles = hasPermission('MANAGE_ROLES');
    const canKickMembers = hasPermission('CAN_KICK_MEMBERS');
    const canViewAudit = hasPermission('CAN_VIEW_LOGS');
    const canEditChars = hasPermission('CAN_EDIT_CHARACTERS');

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

    useEffect(() => {
        if (!loading && hasMoreHistory && !loadingHistory) {
            setLoadingAllHistory(true);
            loadMoreHistory();
        } else if (!hasMoreHistory) {
            setLoadingAllHistory(false);
        }
    }, [loading, hasMoreHistory, loadingHistory, loadMoreHistory]);

    const allEvents = useMemo(() => [...events, ...historyEvents], [events, historyEvents]);

    const weeklyStats = useRef<Record<string, any>>({});
    useEffect(() => {
        if (!clan) return;
        // Fetch all members' stats for the current week to calculate PvE activity
        clanApi.getWeeklySummary(clan.id, clan.weekIso || '').then(data => {
            const map: Record<string, any> = {};
            data.forEach(s => map[s.characterId] = s);
            weeklyStats.current = map;
            // Force re-render to show stats
            setRoster(prev => [...prev]);
        }).catch(console.error);
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
        if (searchName.trim()) {
            const query = searchName.toLowerCase();
            list = list.filter(c => c.name.toLowerCase().includes(query));
        }
        list.sort((a, b) => {
            if (sortBy === 'POWER_DESC') {
                return calculatePowerDetails(b).total - calculatePowerDetails(a).total;
            } else if (sortBy === 'POWER_ASC') {
                return calculatePowerDetails(a).total - calculatePowerDetails(b).total;
            } else if (sortBy === 'NAME_DESC') {
                return b.name.localeCompare(a.name);
            } else if (sortBy === 'NAME_ASC') {
                return a.name.localeCompare(b.name);
            } else if (sortBy === 'ROLE_DESC') {
                const diff = getRoleLevel(b.role) - getRoleLevel(a.role);
                if (diff !== 0) return diff;
                return calculatePowerDetails(b).total - calculatePowerDetails(a).total;
            } else if (sortBy === 'ROLE_ASC') {
                const diff = getRoleLevel(a.role) - getRoleLevel(b.role);
                if (diff !== 0) return diff;
                return calculatePowerDetails(b).total - calculatePowerDetails(a).total;
            } else {
                return 0;
            }
        });
        return list;
    }, [roster, filterClass, searchName, sortBy]);

    if (!clan) return null;

    return (
        <div>
            <div className={styles.pageTitle}
                 style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span>Состав — {clan.icon} {clan.name}</span>
                <div style={{display: 'flex', gap: 10}}>
                    {canViewAudit && (
                        <button className="btn"
                                onClick={() => navigate('/clan/audit')}>
                            Аудит
                        </button>
                    )}
                    <button className="btn secondary"
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
                                                    <span className={s.powerValue}>{formatNumber(power)}</span>
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
                                                        <span style={{color: 'var(--success)', fontWeight: 600}}>👍 {app.votes.filter(v => v.vote === 1).length}</span>
                                                        <span style={{color: 'var(--danger)', fontWeight: 600}}>{app.votes.filter(v => v.vote === -1).length} 👎</span>
                                                    </div>
                                                    <div style={{height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden', display: 'flex'}}>
                                                        <div style={{
                                                            height: '100%', 
                                                            background: 'var(--success)', 
                                                            width: `${(app.votes.filter(v => v.vote === 1).length / app.votes.length) * 100}%`,
                                                            transition: 'width 0.3s ease'
                                                        }} />
                                                        <div style={{
                                                            height: '100%', 
                                                            background: 'var(--danger)', 
                                                            flexGrow: 1,
                                                            transition: 'flex-grow 0.3s ease'
                                                        }} />
                                                    </div>
                                                </div>
                                            )}

                                            {canManageApps && (
                                                <div className={s.appActions} onClick={e => e.stopPropagation()}>
                                                    <button className="btn" 
                                                            onClick={() => handleProcess(app.id, 'APPROVE')}>
                                                        Принять
                                                    </button>
                                                    <button className="btn secondary"
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
                    <div style={{display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 200px'}}>
                        <label style={{fontSize: 12, color: 'var(--muted)'}}>Поиск по нику</label>
                        <input 
                            className="input" 
                            placeholder="Введите ник..." 
                            value={searchName} 
                            onChange={e => setSearchName(e.target.value)}
                        />
                    </div>
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
                            <option value="ROLE_DESC">По роли (↓)</option>
                            <option value="ROLE_ASC">По роли (↑)</option>
                        </select>
                    </div>
                    <div style={{marginLeft: 'auto', alignSelf: 'end'}}>
                        Всего: {filtered.length}
                    </div>
                </div>
            </div>

            {loading || loadingAllHistory ? (
                <div style={{textAlign: 'center', padding: 20}}>Загрузка состава и статистики...</div>
            ) : (
                <div className={s.rosterGrid}>
                    {filtered.map(char => {
                        const details = calculatePowerDetails(char);
                        const canEditThisRole = canManageRoles && getRoleLevel(char.role) < myLevel;

                        // Stats calculation
                        const attendanceRate = char.attendanceRate ?? 100;
                        const pveRate = char.pveActivity;

                        const attendanceDetails = char.activityDetails?.attendance || [];
                        const pveDetails = char.activityDetails?.pve;

                        const getRateColor = (rate: number) => {
                            if (rate >= 80) return 'var(--success)';
                            if (rate >= 50) return 'var(--warning)';
                            return 'var(--danger)';
                        };

                        return (
                            <CharacterTooltip key={char.id} character={char}>
                                <div className={s.memberCard}>
                                    <div className={s.cardHeader}>
                                        <div className={s.nameSection}>
                                            <div className={s.nameRow}>
                                                <ClassIcon cls={char.class} size={18} className={styles.classIconSmall}/>
                                                <span className={s.charName}>{char.name}</span>
                                            </div>
                                            <div className={s.classInfo}>
                                                <div
                                                    className={`${s.roleBadge} ${canEditThisRole ? s.editable : ''}`}
                                                    onClick={(e) => {
                                                        if (canEditThisRole) {
                                                            e.stopPropagation();
                                                            setPromoteModal({char, role: char.role});
                                                        }
                                                    }}
                                                    title={canEditThisRole ? "Изменить роль" : undefined}
                                                >
                                                    {char.role}
                                                    {canEditThisRole && <span style={{marginLeft: 4}}>✎</span>}
                                                </div>
                                                <span>•</span>
                                                <span>{char.class}</span>
                                            </div>
                                        </div>

                                        <div className={s.actionBtns} style={{ marginLeft: 'auto' }}>
                                            {canEditChars && (
                                                <div style={{display: 'flex', gap: '4px'}}>
                                                    <button
                                                        className={s.actionBtn}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditCharModal(char);
                                                        }}
                                                        title="Редактировать характеристики"
                                                    >
                                                        ✎
                                                    </button>
                                                    <button
                                                        className={s.actionBtn}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setHistoryModal(char);
                                                        }}
                                                        title="История изменений"
                                                    >
                                                        📜
                                                    </button>
                                                </div>
                                            )}

                                            {canKickMembers && getRoleLevel(char.role) < myLevel && (
                                                <button
                                                    className={s.kickBtn}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setKickConfirm(char);
                                                    }}
                                                    title="Исключить из клана"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className={s.cardStats}>
                                        <div className={s.powerSection}>
                                            <span className={s.powerLabel}>Сила:</span>
                                            <span className={s.powerValue}>{formatNumber(details.total)}</span>
                                        </div>
                                        
                                        <div className={s.extendedStats}>
                                            <div className={s.statItem}>
                                                <div className={s.statLabel}>События:</div>
                                                <Tooltip 
                                                    className={s.statTooltipTrigger}
                                                    content={
                                                    <div className={s.statsTooltip}>
                                                        <div className={s.tooltipTitle}>События за месяц</div>
                                                        {attendanceDetails.length > 0 ? (
                                                            <div className={s.tooltipList}>
                                                                {attendanceDetails.map((a, idx) => (
                                                                    <div key={idx} className={s.tooltipItem}>
                                                                        <span className={s.itemName}>{a.eventName}</span>
                                                                        <span className={s.itemDate}>{new Date(a.date).toLocaleDateString()}</span>
                                                                        <span className={`${s.itemStatus} ${a.attended ? s.success : s.danger}`}>
                                                                            {a.attended ? '✓' : '✕'}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className={s.emptyMsg}>Нет событий в этом месяце</div>
                                                        )}
                                                    </div>
                                                }>
                                                    <div className={s.statBarWrap}>
                                                        <div className={s.statBar} style={{
                                                            width: `${attendanceRate}%`,
                                                            background: getRateColor(attendanceRate)
                                                        }} />
                                                        <span className={s.statValue}>{Math.round(attendanceRate)}%</span>
                                                    </div>
                                                </Tooltip>
                                            </div>
                                            {pveRate !== undefined && pveRate !== null && (
                                                <div className={s.statItem}>
                                                    <div className={s.statLabel}>ПвЕ:</div>
                                                    <Tooltip 
                                                        className={s.statTooltipTrigger}
                                                        content={
                                                        <div className={s.statsTooltip}>
                                                            <div className={s.tooltipTitle}>Детали ПвЕ (неделя)</div>
                                                            {pveDetails ? (
                                                                <div className={s.tooltipList}>
                                                                    {pveDetails.kh.map((k, idx) => (
                                                                        <div key={idx} className={s.tooltipItem}>
                                                                            <span className={s.itemName}>КХ: Этап {k.stage}</span>
                                                                            <span className={`${s.itemStatus} ${k.attended ? s.success : s.danger}`} style={{ width: 'auto' }}>
                                                                                {k.attended ? 'Выполнено' : 'Не выполнено'}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                    {pveDetails.rhythm && (
                                                                        <div className={s.tooltipItem}>
                                                                            <span className={s.itemName}>Ритм</span>
                                                                            <span className={s.itemVal}>{pveDetails.rhythm.valor}/14</span>
                                                                            <span className={`${s.itemStatus} ${pveDetails.rhythm.attended ? s.success : s.danger}`} style={{ width: 'auto' }}>
                                                                                {pveDetails.rhythm.attended ? 'Выполнено' : 'Не выполнено'}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {pveDetails.zu && (
                                                                        <div className={s.tooltipItem}>
                                                                            <span className={s.itemName}>ЗУ</span>
                                                                            <span className={s.itemVal}>{pveDetails.zu.circles}/{pveDetails.zu.required} кр.</span>
                                                                            <span className={`${s.itemStatus} ${pveDetails.zu.circles >= pveDetails.zu.required ? s.success : s.danger}`} style={{ width: 'auto' }}>
                                                                                {pveDetails.zu.circles >= pveDetails.zu.required ? 'Выполнено' : 'Не выполнено'}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className={s.emptyMsg}>Нет данных за текущую неделю</div>
                                                            )}
                                                        </div>
                                                    }>
                                                        <div className={s.statBarWrap}>
                                                            <div className={s.statBar} style={{
                                                                width: `${pveRate}%`,
                                                                background: getRateColor(pveRate)
                                                            }} />
                                                            <span className={s.statValue}>{Math.round(pveRate)}%</span>
                                                        </div>
                                                    </Tooltip>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CharacterTooltip>
                        );
                    })}
                </div>
            )}

            {promoteModal && (
                <Modal 
                    isOpen={true} 
                    onClose={() => setPromoteModal(null)} 
                    title="Изменение роли"
                    maxWidth="400px"
                    footer={
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
                    }
                >
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
                                                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                                                background: isSelected ? 'rgba(122, 162, 247, 0.1)' : 'var(--card)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <span style={{fontWeight: isSelected ? 600 : 400}}>{r}</span>
                                            {isSelected && <span style={{color: 'var(--primary)'}}>✓</span>}
                                        </div>
                                    );
                                })}
                        </div>
                </Modal>
            )}

            {kickConfirm && (
                <Modal 
                    isOpen={true} 
                    onClose={() => setKickConfirm(null)} 
                    title={<span style={{color: 'var(--danger)'}}>Изгнание из клана</span>}
                    maxWidth="400px"
                    footer={
                        <div style={{display: 'flex', gap: 8, justifyContent: 'flex-end'}}>
                            <button className="btn secondary" onClick={() => setKickConfirm(null)}
                                    disabled={isKicking}>Отмена
                            </button>
                            <button className="btn" 
                                    style={{background: 'var(--danger)', color: '#fff'}}
                                    disabled={isKicking} 
                                    onClick={async () => {
                                setIsKicking(true);
                                try {
                                    await kickMember(kickConfirm.id);
                                    setRoster(prev => prev.filter(m => m.id !== kickConfirm.id));
                                    setKickConfirm(null);
                                } catch (e: any) {
                                    console.error(e);
                                    notify('Ошибка при исключении: ' + (e.message || 'Unknown error'), 'error');
                                } finally {
                                    setIsKicking(false);
                                }
                            }}>{isKicking ? 'Исключение...' : 'Исключить'}</button>
                        </div>
                    }
                >
                    <div>
                        Вы уверены, что хотите исключить персонажа <b>{kickConfirm.name}</b> из клана?
                    </div>
                </Modal>
            )}

            {editCharModal && (
                <CharacterFormModal
                    character={editCharModal}
                    onClose={() => setEditCharModal(null)}
                    onSave={() => {
                        getClanRoster().then(setRoster);
                    }}
                />
            )}

            {historyModal && (
                <CharacterHistoryModal
                    characterId={historyModal.id}
                    characterName={historyModal.name}
                    onClose={() => setHistoryModal(null)}
                />
            )}
        </div>
    );
}
