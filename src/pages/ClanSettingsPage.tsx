import React, {useEffect, useMemo, useState} from 'react';
import {useAppStore} from '@/shared/model/AppStore';
import {useAuth} from '@/app/providers/AuthContext';
import s from '@/app/styles/App.module.scss';
import type {ClanHallStage, ClanRole, RolePermissions} from '@/shared/types';
import {Tooltip} from '@/shared/ui/Tooltip/Tooltip';

const PERMISSIONS_LIST = [
    {key: 'CAN_MANAGE_MEMBERS', label: 'Управление составом'},
    {key: 'MANAGE_ROLES', label: 'Управление ролями'},
    {key: 'CAN_CREATE_EVENTS', label: 'Создание событий'},
    {key: 'CAN_EDIT_EVENTS', label: 'Закрытие событий'},
    {key: 'CAN_MANAGE_SQUADS', label: 'Управление пати'},
    {key: 'CAN_UPLOAD_REPORTS', label: 'Загрузка отчетов'},
    {key: 'MANUAL_PVE_EDIT', label: 'Ручное редактирование ПВЕ'},
    {key: 'CAN_EDIT_SETTINGS', label: 'Редактирование настроек'},
    {key: 'CAN_VIEW_LOGS', label: 'Просмотр логов'},
];

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
    CAN_MANAGE_MEMBERS: 'Управление составом: прием заявок, исключение участников.',
    CAN_EDIT_SETTINGS: 'Настройки клана: изменение названия, требований, ПВП/ПВЕ конфигураций.',
    CAN_CREATE_EVENTS: 'Календарь: создание новых событий.',
    CAN_EDIT_EVENTS: 'Календарь: завершение событий (изменение статуса).',
    CAN_MANAGE_SQUADS: 'События: управление составами пати, назначение ПЛов.',
    CAN_VIEW_LOGS: 'Аудит: доступ к просмотру истории действий участников клана.',
    CAN_UPLOAD_REPORTS: 'Отчеты: загрузка истории гильдии для подтверждения активности.',
    MANUAL_PVE_EDIT: 'ПВЕ: ручное изменение прогресса/доблести участников.',
    MANAGE_ROLES: 'Управление составом: изменение ролей (ниже своей).'
};

const ROLES: ClanRole[] = ['MASTER', 'MARSHAL', 'OFFICER', 'PL', 'MEMBER'];

const ROLE_HIERARCHY: Record<string, number> = {
    MASTER: 4,
    MARSHAL: 3,
    OFFICER: 2,
    PL: 1,
    MEMBER: 0
};
const getRoleLevel = (r: string) => ROLE_HIERARCHY[r] ?? 0;

export default function ClanSettingsPage() {
    const {user} = useAuth();
    const {clan, updateClanSettings, hasPermission, getClanRoster} = useAppStore();

    if (!hasPermission('CAN_EDIT_SETTINGS')) {
        return <div className="card">У вас нет прав для просмотра этой страницы.</div>;
    }

    const [roster, setRoster] = useState<any[]>([]);
    useEffect(() => {
        getClanRoster().then(setRoster);
    }, []);

    const myRole = useMemo(() => roster.find(m => m.id === user?.mainCharacterId)?.role, [roster, user]);
    const myLevel = myRole ? getRoleLevel(myRole) : -1;

    const [hasChanges, setHasChanges] = useState(false);

    // Local state for form
    const [pvpOffset, setPvpOffset] = useState(30);

    const [rhythmRequired, setRhythmRequired] = useState(true);

    const [fkRequired, setFkRequired] = useState(true);
    const [fkBad, setFkBad] = useState(0);
    const [fkNormal, setFkNormal] = useState(1);
    const [fkGood, setFkGood] = useState(3);

    const [khRequired, setKhRequired] = useState(true);
    const [khStages, setKhStages] = useState<ClanHallStage[]>([]);

    const [rolePerms, setRolePerms] = useState<RolePermissions[]>([]);

    // Init from clan settings
    useEffect(() => {
        if (hasChanges) return;

        if (clan?.settings) {
            const s = clan.settings;
            setPvpOffset(s.pvpDefaultRallyOffsetMinutes ?? 30);

            const obs = s.obligations;
            setRhythmRequired(obs?.rhythmRequired ?? true);

            setFkRequired(obs?.forbiddenKnowledge?.required ?? true);
            setFkBad(obs?.forbiddenKnowledge?.badFrom ?? 0);
            setFkNormal(obs?.forbiddenKnowledge?.normalFrom ?? 1);
            setFkGood(obs?.forbiddenKnowledge?.goodFrom ?? 3);

            setKhRequired(obs?.clanHall?.required ?? true);
            setKhStages(obs?.clanHall?.requiredStagesSameDay ?? []);

            // Ensure all roles exist in state even if empty
            const perms = s.rolePermissions || [];
            // Merge with default structure if needed, but for now just copy
            setRolePerms(perms);

            setHasChanges(false);
        }
    }, [clan, hasChanges]);

    const save = async () => {
        await updateClanSettings({
            pvpDefaultRallyOffsetMinutes: pvpOffset,
            rolePermissions: rolePerms,
            obligations: {
                rhythmRequired,
                forbiddenKnowledge: {
                    required: fkRequired,
                    badFrom: fkBad,
                    normalFrom: fkNormal,
                    goodFrom: fkGood
                },
                clanHall: {
                    required: khRequired,
                    requiredStagesSameDay: khStages
                }
            }
        });
        setHasChanges(false);
    };

    // Change handlers wrapper to set dirty flag
    const handle = (setter: (v: any) => void, val: any) => {
        setter(val);
        setHasChanges(true);
    };

    const handlePermissionChange = (role: ClanRole, perm: string, checked: boolean) => {
        setRolePerms(prev => {
            const idx = prev.findIndex(p => p.role === role);
            let next = [...prev];
            let currentPerms = idx >= 0 ? [...next[idx].permissions] : [];

            if (checked) {
                if (!currentPerms.includes(perm)) currentPerms.push(perm);
            } else {
                currentPerms = currentPerms.filter(p => p !== perm);
            }

            if (idx >= 0) {
                next[idx] = {...next[idx], permissions: currentPerms};
            } else {
                next.push({role, permissions: currentPerms});
            }
            return next;
        });
        setHasChanges(true);
    };

    if (!clan) return <div className="card">Вы не состоите в клане.</div>;

    return (
        <div>
            <div className={s.pageTitle}
                 style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <span>Настройки клана</span>
                {hasChanges && <button className="btn" onClick={save}>Сохранить изменения</button>}
            </div>

            <div className="grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16}}>

                {/* Role Permissions */}
                <div className="card" style={{gridColumn: '1 / -1'}}>
                    <div style={{
                        fontWeight: 700,
                        marginBottom: 12,
                        borderBottom: '1px solid var(--border)',
                        paddingBottom: 8
                    }}>🔐 Права ролей
                    </div>
                    <div className="grid"
                         style={{gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12}}>
                        {ROLES.filter(role => getRoleLevel(role) < myLevel).map(role => {
                            const roleEntry = rolePerms.find(r => r.role === role);
                            const currentPerms = roleEntry?.permissions || [];

                            return (
                                <div key={role}
                                     style={{border: '1px solid var(--border)', borderRadius: 8, padding: 10}}>
                                    <div style={{
                                        fontWeight: 600,
                                        marginBottom: 8,
                                        color: '#7aa2f7',
                                        display: 'inline-block'
                                    }}>{role}</div>
                                    <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
                                        {PERMISSIONS_LIST.map(p => (
                                            <label key={p.key} style={{
                                                display: 'flex',
                                                gap: 6,
                                                alignItems: 'center',
                                                fontSize: 13
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={currentPerms.includes(p.key)}
                                                    onChange={e => handlePermissionChange(role, p.key, e.target.checked)}
                                                />
                                                <Tooltip content={PERMISSION_DESCRIPTIONS[p.key] || p.label}>
                                                    <span style={{
                                                        cursor: 'help',
                                                        borderBottom: '1px dotted #666'
                                                    }}>{p.label}</span>
                                                </Tooltip>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* PVP Settings */}
                <div className="card">
                    <div style={{
                        fontWeight: 700,
                        marginBottom: 12,
                        borderBottom: '1px solid var(--border)',
                        paddingBottom: 8
                    }}>⚔️ PVP события
                    </div>
                    <div style={{marginBottom: 12}}>
                        <label style={{display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4}}>Время сбора по
                            умолчанию (мин)</label>
                        <div style={{fontSize: 12, color: 'var(--muted)', marginBottom: 6}}>
                            За сколько минут до начала события назначать сбор (если не указано иное).
                        </div>
                        <input
                            className="input"
                            type="number"
                            value={pvpOffset}
                            onChange={e => handle(setPvpOffset, Number(e.target.value))}
                        />
                    </div>
                </div>

                {/* Rhythm */}
                <div className="card">
                    <div style={{
                        fontWeight: 700,
                        marginBottom: 12,
                        borderBottom: '1px solid var(--border)',
                        paddingBottom: 8
                    }}>💃 Ритм гильдии
                    </div>
                    <label style={{display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer'}}>
                        <input
                            type="checkbox"
                            checked={rhythmRequired}
                            onChange={e => handle(setRhythmRequired, e.target.checked)}
                        />
                        <span>Обязательное событие</span>
                    </label>
                    <div style={{marginTop: 8, fontSize: 12, color: 'var(--muted)'}}>
                        Если отключено, событие будет отображаться в "Моей активности" только после участия (получения
                        хотя бы 1 очка доблести).
                    </div>
                </div>

                {/* Forbidden Knowledge */}
                <div className="card">
                    <div style={{
                        fontWeight: 700,
                        marginBottom: 12,
                        borderBottom: '1px solid var(--border)',
                        paddingBottom: 8
                    }}>📚 Запретное учение
                    </div>
                    <label style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: 'pointer'}}>
                        <input
                            type="checkbox"
                            checked={fkRequired}
                            onChange={e => handle(setFkRequired, e.target.checked)}
                        />
                        <span>Обязательное событие</span>
                    </label>

                    {fkRequired && (
                        <div style={{display: 'grid', gap: 10}}>
                            <div style={{fontSize: 13, fontWeight: 600}}>Критерии оценки (круги)</div>
                            <div
                                style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'center'}}>
                                <label style={{fontSize: 12}}>Плохо (от):</label>
                                <input className="input" type="number" value={fkBad}
                                       onChange={e => handle(setFkBad, Number(e.target.value))}/>
                            </div>
                            <div
                                style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'center'}}>
                                <label style={{fontSize: 12}}>Нормально (от):</label>
                                <input className="input" type="number" value={fkNormal}
                                       onChange={e => handle(setFkNormal, Number(e.target.value))}/>
                            </div>
                            <div
                                style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'center'}}>
                                <label style={{fontSize: 12}}>Хорошо (от):</label>
                                <input className="input" type="number" value={fkGood}
                                       onChange={e => handle(setFkGood, Number(e.target.value))}/>
                            </div>
                        </div>
                    )}
                    {!fkRequired && (
                        <div style={{fontSize: 12, color: 'var(--muted)'}}>
                            Событие показывается в "Моей активности" только при наличии хотя бы 1 круга.
                        </div>
                    )}
                </div>

                {/* Clan Hall */}
                <div className="card">
                    <div style={{
                        fontWeight: 700,
                        marginBottom: 12,
                        borderBottom: '1px solid var(--border)',
                        paddingBottom: 8
                    }}>🏛️ Клан Холл
                    </div>
                    <label style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: 'pointer'}}>
                        <input
                            type="checkbox"
                            checked={khRequired}
                            onChange={e => handle(setKhRequired, e.target.checked)}
                        />
                        <span>Обязательное событие</span>
                    </label>

                    {khRequired && (
                        <div>
                            <div style={{fontSize: 13, fontWeight: 600, marginBottom: 6}}>Обязательные этапы "День в
                                день"
                            </div>
                            <div style={{fontSize: 12, color: 'var(--muted)', marginBottom: 8}}>
                                Выберите этапы, которые участник обязан посетить именно в день их открытия/проведения.
                            </div>
                            <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                                {Array.from({length: 7}, (_, i) => i + 1).map(n => {
                                    const active = khStages.includes(n as ClanHallStage);
                                    return (
                                        <button
                                            key={n}
                                            className={`btn ${active ? '' : 'secondary'}`}
                                            style={{
                                                width: 32,
                                                height: 32,
                                                padding: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            onClick={() => {
                                                const next = active
                                                    ? khStages.filter(x => x !== n)
                                                    : [...khStages, n as ClanHallStage].sort((a, b) => a - b);
                                                handle(setKhStages, next);
                                            }}
                                        >
                                            {n}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {!khRequired && (
                        <div style={{fontSize: 12, color: 'var(--muted)'}}>
                            Событие показывается в "Моей активности" только при зачёте хотя бы 1 этапа.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
