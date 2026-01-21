import React, {useEffect, useState} from 'react';
import {clanApi} from '@/shared/api';
import {useAppStore} from '@/shared/model/AppStore';
import styles from './ClanAuditPage.module.scss';
import {AuditLog} from '@/shared/types';
import {useNavigate} from 'react-router-dom';

const ACTIONS = [
    'UPDATE_SETTINGS',
    'UPDATE_PERMISSIONS',
    'CREATE_EVENT',
    'UPDATE_SQUADS',
    'COMPLETE_EVENT',
    'APPROVE_APPLICATION',
    'REJECT_APPLICATION',
    'ADD_TEMPLATE'
];

const PERMISSION_LABELS: Record<string, string> = {
    ALL: 'Полный доступ',
    MEMBER_INVITE: 'Приглашение участников',
    EVENT_MANAGE: 'Управление событиями',
    SQUAD_MANAGE: 'Управление пати',
    CAN_UPLOAD_REPORTS: 'Загрузка отчетов',
    MANAGE_ROLES: 'Управление ролями',
    // Fallbacks for other possible permissions
    CAN_MANAGE_MEMBERS: 'Упр. участниками',
    CAN_EDIT_SETTINGS: 'Настройки',
    CAN_CREATE_EVENTS: 'Создание событий',
    CAN_EDIT_EVENTS: 'Ред. событий',
    CAN_MANAGE_SQUADS: 'Упр. отрядами',
    CAN_VIEW_LOGS: 'Просмотр аудита',
    MANUAL_PVE_EDIT: 'Ручное редактирование ПВЕ',
    CAN_EDIT_CHARACTERS: 'Ред. персонажей'
};

import {Tooltip} from '@/shared/ui/Tooltip/Tooltip';
import {ClassIcon} from '@/shared/ui/ClassIcon';

const LogDetails = ({log, roster}: { log: AuditLog, roster: any[] }) => {
    const d = log.details;
    if (!d) return <span>-</span>;

    // Helper to format deep diffs
    const formatChange = (key: string, from: any, to: any): string[] => {
        // Special handler for rolePermissions
        if (key === 'rolePermissions' && Array.isArray(from) && Array.isArray(to)) {
            const fromMap = new Map(from.map((x: any) => [x.role, x.permissions]));
            const toMap = new Map(to.map((x: any) => [x.role, x.permissions]));
            const roles = new Set([...fromMap.keys(), ...toMap.keys()]);

            const diffs: string[] = [];
            roles.forEach(role => {
                const p1: string[] = fromMap.get(role) || [];
                const p2: string[] = toMap.get(role) || [];

                const added = p2.filter(p => !p1.includes(p));
                const removed = p1.filter(p => !p2.includes(p));

                if (added.length > 0 || removed.length > 0) {
                    const parts = [];
                    if (added.length) {
                        const names = added.map(p => PERMISSION_LABELS[p] || p);
                        parts.push(`+${names.join(', ')}`);
                    }
                    if (removed.length) {
                        const names = removed.map(p => PERMISSION_LABELS[p] || p);
                        parts.push(`-${names.join(', ')}`);
                    }
                    diffs.push(`${role}: ${parts.join('; ')}`);
                }
            });
            if (diffs.length === 0) return []; // No effective changes
            return diffs;
        }

        // Recursive object diff
        const getObjectDiff = (prefix: string, v1: any, v2: any): string[] => {
            if (v1 === v2) return [];

            // If one is undefined/null or primitives differ
            if (
                typeof v1 !== typeof v2 ||
                v1 === null || v2 === null ||
                typeof v1 !== 'object'
            ) {
                return [`${prefix}: ${String(v1)} -> ${String(v2)}`];
            }

            // Arrays (generic fallback if not handled above)
            if (Array.isArray(v1) || Array.isArray(v2)) {
                return [`${prefix}: ${JSON.stringify(v1)} -> ${JSON.stringify(v2)}`];
            }

            const keys = new Set([...Object.keys(v1), ...Object.keys(v2)]);
            const diffs: string[] = [];

            for (const k of keys) {
                const newPrefix = prefix ? `${prefix}.${k}` : k;
                const subDiff = getObjectDiff(newPrefix, v1[k], v2[k]);
                diffs.push(...subDiff);
            }
            return diffs;
        };

        if (typeof from === 'object' && from !== null && typeof to === 'object' && to !== null) {
            return getObjectDiff(key, from, to);
        }

        return [`${key}: ${String(from)} -> ${String(to)}`];
    };

    if (log.action === 'UPDATE_SETTINGS' && typeof d === 'object') {
        const keys = Object.keys(d);
        if (keys.length === 0) return <span>-</span>;

        // Build tooltip text
        const allDiffLines: string[] = [];
        keys.forEach(k => {
            const change = d[k];
            if (change && typeof change === 'object' && 'from' in change && 'to' in change) {
                const lines = formatChange(k, change.from, change.to);
                allDiffLines.push(...lines);
            } else {
                allDiffLines.push(`${k}: ${JSON.stringify(change)}`);
            }
        });

        if (allDiffLines.length === 0) return <span>No changes detected</span>;

        const tooltip = allDiffLines.join('\n');
        const summary = keys.join(', ');

        return (
            <div className={styles.detailsCell}>
                <Tooltip content={tooltip}>
                    Changed: {summary}
                </Tooltip>
            </div>
        );
    }

    if (log.action === 'UPDATE_SQUADS') {
        if (d && typeof d === 'object' && d.changes && Array.isArray(d.changes)) {
            if (d.changes.length === 0) return <span>No changes</span>;

            const tooltip = (
                <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                    {d.changes.map((c: any, i: number) => {
                        const char = roster.find(r => r.id === c.characterId);
                        const name = char?.name || c.characterId;
                        const cls = char?.class;

                        let text = `Изменение для ${name}`;
                        if (c.type === 'ADD') text = `Добавлен ${name} в ${c.to}`;
                        else if (c.type === 'REMOVE') text = `Удален ${name} из ${c.from}`;
                        else if (c.type === 'MOVE') text = `Перемещен ${name}: ${c.from} -> ${c.to}`;

                        return (
                            <div key={i} style={{display: 'flex', alignItems: 'center'}}>
                                {cls && <div style={{marginRight: 6, display: 'flex'}}><ClassIcon cls={cls} size={16}/>
                                </div>}
                                <span>{text}</span>
                            </div>
                        );
                    })}
                </div>
            );

            return (
                <div className={styles.detailsCell}>
                    <Tooltip content={tooltip}>
                        Обновление составов ({d.changes.length})
                    </Tooltip>
                </div>
            );
        }

        if (Array.isArray(d)) {
            const tooltip = d.map((s: any) => `${s.name || 'Unnamed'} (L: ${s.leaderId || '?'}, N: ${s.membersCount ?? '?'})`).join('\n');
            return (
                <div className={styles.detailsCell}>
                    <Tooltip content={tooltip}>
                        Squads updated ({d.length})
                    </Tooltip>
                </div>
            );
        }
    }

    if (log.action === 'UPDATE_PERMISSIONS') {
        return <span>Role: {String(d)}</span>;
    }

    if (typeof d === 'object') {
        const str = JSON.stringify(d);
        return (
            <div className={styles.detailsCell}>
                <Tooltip content={JSON.stringify(d, null, 2)}>
                    {str}
                </Tooltip>
            </div>
        );
    }

    return <span>{String(d)}</span>;
};

export default function ClanAuditPage() {
    const {clan} = useAppStore();
    const navigate = useNavigate();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [roster, setRoster] = useState<any[]>([]);
    const [filters, setFilters] = useState({
        action: '',
        actorId: '',
        target: '',
        dateFrom: '',
        dateTo: ''
    });

    const filteredLogs = React.useMemo(() => {
        return logs.filter(log => {
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const actorName = log.actor?.name.toLowerCase() || 'система';
                const action = log.action.toLowerCase();
                const target = log.target?.toLowerCase() || '';
                
                return actorName.includes(query) || action.includes(query) || target.includes(query);
            }
            return true;
        });
    }, [logs, searchQuery]);

    const loadRoster = async () => {
        try {
            const members = await clanApi.getClanRoster(clan!.id);
            // Sort by name
            members.sort((a: any, b: any) => a.name.localeCompare(b.name));
            setRoster(members);
        } catch (e) {
            console.error('Failed to load roster', e);
        }
    };

    const loadLogs = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            // Clean filters
            const f: any = {};
            if (filters.action) f.action = filters.action;
            if (filters.actorId) f.actorId = filters.actorId;
            if (filters.target) f.target = filters.target;
            if (filters.dateFrom) f.dateFrom = new Date(filters.dateFrom + 'T00:00:00').toISOString();
            if (filters.dateTo) f.dateTo = new Date(filters.dateTo + 'T23:59:59').toISOString();

            const data = await clanApi.getAuditLogs(clan!.id, 100, 0, f);
            setLogs(data);
        } catch (e: any) {
            console.error(e);
            setError('Не удалось загрузить логи. Возможно, у вас нет прав.');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Keep ref to latest loadLogs to use in interval with current filters
    const loadLogsRef = React.useRef(loadLogs);
    useEffect(() => {
        loadLogsRef.current = loadLogs;
    });

    useEffect(() => {
        if (!clan?.id) return;
        loadRoster();
        loadLogs(false);

        const interval = setInterval(() => {
            loadLogsRef.current(true);
        }, 5000);

        return () => clearInterval(interval);
    }, [clan?.id]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({...prev, [key]: value}));
    };

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleString('ru-RU');
    };

    if (!clan) return <div>Клан не найден</div>;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate('/clan')}>
                    &larr; Назад
                </button>
                <h1>Аудит действий</h1>
            </header>

            <div className={styles.filters}>
                <div className={styles.filterGroup} style={{ flex: '1 1 200px' }}>
                    <label>Поиск по логам</label>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className={styles.input}
                        placeholder="Ник, действие, цель..."
                        style={{ width: '100%' }}
                    />
                </div>

                <div className={styles.filterGroup}>
                    <label>Действие</label>
                    <select
                        value={filters.action}
                        onChange={e => handleFilterChange('action', e.target.value)}
                        className={styles.select}
                    >
                        <option value="">Все</option>
                        {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>Персонаж</label>
                    <select
                        value={filters.actorId}
                        onChange={e => handleFilterChange('actorId', e.target.value)}
                        className={styles.select}
                    >
                        <option value="">Все</option>
                        {roster.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>Цель (поиск)</label>
                    <input
                        type="text"
                        value={filters.target}
                        onChange={e => handleFilterChange('target', e.target.value)}
                        className={styles.input}
                        placeholder="Название, имя..."
                    />
                </div>

                <div className={styles.filterGroup}>
                    <label>С даты</label>
                    <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={e => handleFilterChange('dateFrom', e.target.value)}
                        className={styles.input}
                    />
                </div>

                <div className={styles.filterGroup}>
                    <label>По дату</label>
                    <input
                        type="date"
                        value={filters.dateTo}
                        onChange={e => handleFilterChange('dateTo', e.target.value)}
                        className={styles.input}
                    />
                </div>

                <button className={styles.applyBtn} onClick={() => loadLogs(false)}>Применить</button>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {loading ? (
                <div>Загрузка...</div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th>Дата</th>
                            <th>Персонаж</th>
                            <th>Действие</th>
                            <th>Цель</th>
                            <th>Детали</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredLogs.map(log => (
                            <tr key={log.id}>
                                <td>{formatDate(log.createdAt)}</td>
                                <td>
                                    {log.actor ? (
                                        <span className={styles.actorName}>{log.actor.name} ({log.actor.class})</span>
                                    ) : (
                                        <span className={styles.systemActor}>Система</span>
                                    )}
                                </td>
                                <td>{log.action}</td>
                                <td>{log.target || '-'}</td>
                                <td>
                                    <LogDetails log={log} roster={roster}/>
                                </td>
                            </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{textAlign: 'center'}}>Логов не найдено</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
