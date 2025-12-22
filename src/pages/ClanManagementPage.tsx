import React, {useEffect, useState, useMemo, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import styles from '@/app/styles/App.module.scss';
import s from './ClanManagementPage.module.scss';
import {useAppStore} from '@/shared/model/AppStore';
import {useAuth} from '@/app/providers/AuthContext';
import type {Character, ClanMember, CharacterClass, ClanApplication} from '@/shared/types';
import {calculatePowerDetails} from '@/shared/lib/power';
import {ClassIcon} from '@/shared/ui/ClassIcon';

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
    const [appNames, setAppNames] = useState<Record<string, { name: string; class: CharacterClass }>>({});
    const [loading, setLoading] = useState(true);
    const [filterClass, setFilterClass] = useState<CharacterClass | 'ALL'>('ALL');
    const [sortBy, setSortBy] = useState<'POWER' | 'NAME'>('POWER');
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
                    if (pending.length > 0) {
                        resolveCharacterNames(pending.map(a => a.characterId)).then(setAppNames);
                    }
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
        if (pending.length > 0) {
            const names = await resolveCharacterNames(pending.map(a => a.characterId));
            setAppNames(names);
        }
    };

    const filtered = useMemo(() => {
        let list = [...roster];
        if (filterClass !== 'ALL') {
            list = list.filter(c => c.class === filterClass);
        }
        list.sort((a, b) => {
            if (sortBy === 'POWER') {
                return calculatePowerDetails(b).total - calculatePowerDetails(a).total;
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
                    <div style={{fontWeight: 700, marginBottom: 12}}>Заявки ({applications.length})</div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                        {applications.map(app => {
                            const info = appNames[app.characterId];
                            return (
                                <div key={app.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: '#2b2b3b',
                                    padding: 10,
                                    borderRadius: 4
                                }}>
                                    <div>
                                        <div style={{fontWeight: 600, display: 'flex', alignItems: 'center'}}>
                                            {info ? (
                                                <>
                                                    <ClassIcon cls={info.class} size={16}/>
                                                    {info.name}
                                                </>
                                            ) : app.characterId}
                                        </div>
                                        <div style={{fontSize: '0.9em'}}>{app.message || <i>Нет сообщения</i>}</div>
                                        <div style={{
                                            fontSize: '0.8em',
                                            color: '#888'
                                        }}>{new Date(app.createdDate).toLocaleString()}</div>
                                    </div>
                                    {canManageApps && (
                                        <div style={{display: 'flex', gap: 8}}>
                                            <button className="btn" style={{background: '#9ece6a', color: '#000'}}
                                                    onClick={() => handleProcess(app.id, 'APPROVE')}>Принять
                                            </button>
                                            <button className="btn" style={{background: '#f7768e', color: '#fff'}}
                                                    onClick={() => handleProcess(app.id, 'REJECT')}>Отклонить
                                            </button>
                                        </div>
                                    )}
                                </div>
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
                            <option value="POWER">По силе (UB)</option>
                            <option value="NAME">По имени</option>
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
                            <div key={char.id} className={`card ${s.cardHover}`}
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
                                                setPromoteModal({char, role: char.role});
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

                                {/* Full Stats Tooltip */}
                                <div className={s.cardTooltip}>
                                    <div style={{fontWeight: 700, marginBottom: 6, color: '#fff'}}>Характеристики</div>
                                    <div className={s.statRow}><span>Физ. атака:</span>
                                        <span>{char.minAttack}-{char.maxAttack}</span></div>
                                    <div className={s.statRow}><span>Шанс крита:</span> <span>{char.critChance}%</span>
                                    </div>
                                    <div className={s.statRow}><span>Крит. урон:</span> <span>{char.critDamage}%</span>
                                    </div>
                                    <div className={s.statRow}><span>Боевой дух:</span> <span>{char.spirit}</span></div>
                                    <div className={s.statRow}><span>ПА:</span> <span>{char.attackLevel}</span></div>
                                    <div className={s.statRow}><span>ПЗ:</span> <span>{char.defenseLevel}</span></div>
                                    <div className={s.statRow}><span>Физ. пробив:</span>
                                        <span>{char.physPenetration}</span></div>
                                    <div className={s.statRow}><span>Маг. пробив:</span>
                                        <span>{char.magPenetration}</span></div>
                                    <div className={s.statRow}><span>Аспд/Пение:</span>
                                        <span>{char.atkPerSec} / {char.chanting}%</span></div>
                                    <div className={s.divider}/>
                                    <div className={s.statRow}><span>HP:</span> <span>{char.health}</span></div>
                                    <div className={s.statRow}><span>Физ. деф:</span> <span>{char.physDef}</span></div>
                                    <div className={s.statRow}><span>Маг. деф:</span> <span>{char.magDef}</span></div>
                                    <div className={s.statRow}><span>УФУ/УМУ:</span>
                                        <span>{char.physReduction}% / {char.magReduction}%</span></div>
                                </div>

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
                            {['MASTER', 'MARSHAL', 'OFFICER', 'PL', 'MEMBER'].map(r => {
                                const isDisabled = getRoleLevel(r) > myLevel;
                                const isSelected = promoteModal.role === r;
                                return (
                                    <div
                                        key={r}
                                        onClick={() => !isDisabled && setPromoteModal({...promoteModal, role: r})}
                                        style={{
                                            padding: '10px 12px',
                                            borderRadius: 8,
                                            border: isSelected ? '1px solid #7aa2f7' : '1px solid var(--border)',
                                            background: isSelected ? 'rgba(122, 162, 247, 0.1)' : 'var(--card)',
                                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                                            opacity: isDisabled ? 0.5 : 1,
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
                                } catch (e: any) {
                                    console.error(e);
                                    alert('Ошибка при смене роли: ' + (e.message || 'Unknown error'));
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
