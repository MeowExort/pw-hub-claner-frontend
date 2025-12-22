import React, {useState, useEffect} from 'react';
import s from './WeeklySummaryPage.module.scss';
import appStyles from '@/app/styles/App.module.scss';
import {useAppStore} from '@/shared/model/AppStore';
import {isoWeekKey, getStartOfWeekFromIso} from '@/shared/lib/date';
import {ClassIcon} from '@/shared/ui/ClassIcon';
import {WeekSwitcher} from '@/shared/ui/WeekSwitcher';
import {clanApi} from '@/shared/api';
import {WeeklyStats} from '@/shared/types';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const getDayContent = (stat: WeeklyStats, dayIndex: number): string => {
    return stat.khHistory
        .filter(h => {
            const d = new Date(h.date);
            const day = d.getDay();
            const idx = day === 0 ? 6 : day - 1;
            return idx === dayIndex;
        })
        .map(h => h.stage)
        .sort((a, b) => a - b)
        .join(', ');
};

type FilterOperator = '>=' | '<=' | '=';

const checkNumericFilter = (val: number, filter: string, op: FilterOperator) => {
    if (!filter) return true;
    const filterNum = parseFloat(filter);
    if (isNaN(filterNum)) return true;

    switch (op) {
        case '>=':
            return val >= filterNum;
        case '<=':
            return val <= filterNum;
        case '=':
            return val === filterNum;
        default:
            return true;
    }
};

export default function WeeklySummaryPage() {
    const {clan, hasPermission} = useAppStore();
    const [week, setWeek] = useState(isoWeekKey(new Date()));
    const [stats, setStats] = useState<WeeklyStats[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        name: '',
        days: Array(7).fill(''),
        khValor: '',
        rhythmValor: '',
        zuCircles: '',
        totalValor: ''
    });
    const [operators, setOperators] = useState<{
        khValor: FilterOperator;
        rhythmValor: FilterOperator;
        zuCircles: FilterOperator;
        totalValor: FilterOperator;
    }>({
        khValor: '>=',
        rhythmValor: '>=',
        zuCircles: '>=',
        totalValor: '>='
    });

    const [editForm, setEditForm] = useState<{
        khStagesByDay: string[];
        rhythmValor: string;
        zuCircles: string;
    }>({khStagesByDay: Array(7).fill(''), rhythmValor: '', zuCircles: ''});

    const [sortConfig, setSortConfig] = useState<{ key: keyof WeeklyStats | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc'
    });

    const canEdit = hasPermission('MANUAL_PVE_EDIT');

    const filteredStats = React.useMemo(() => {
        return stats.filter(stat => {
            const statName = stat.name || '';
            if (filters.name && !statName.toLowerCase().includes(filters.name.toLowerCase())) return false;

            for (let i = 0; i < 7; i++) {
                if (filters.days[i]) {
                    const content = getDayContent(stat, i);
                    if (!content.includes(filters.days[i])) return false;
                }
            }

            if (!checkNumericFilter(stat.khValor || 0, filters.khValor, operators.khValor)) return false;
            if (!checkNumericFilter(stat.rhythmValor || 0, filters.rhythmValor, operators.rhythmValor)) return false;
            if (!checkNumericFilter(stat.zuCircles || 0, filters.zuCircles, operators.zuCircles)) return false;
            if (!checkNumericFilter(stat.totalValor || 0, filters.totalValor, operators.totalValor)) return false;

            return true;
        });
    }, [stats, filters, operators]);

    const sortedStats = React.useMemo(() => {
        const data = [...filteredStats];
        if (sortConfig.key) {
            data.sort((a, b) => {
                // @ts-ignore
                const valA = a[sortConfig.key] ?? 0;
                // @ts-ignore
                const valB = b[sortConfig.key] ?? 0;
                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
                }
                return 0;
            });
        }
        return data;
    }, [filteredStats, sortConfig]);

    const requestSort = (key: keyof WeeklyStats) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({key, direction});
    };

    const toggleOperator = (field: keyof typeof operators) => {
        const nextOp: Record<FilterOperator, FilterOperator> = {
            '>=': '<=',
            '<=': '=',
            '=': '>='
        };
        setOperators(prev => ({...prev, [field]: nextOp[prev[field]]}));
    };

    const changeWeek = (offset: number) => {
        let newWeek = '';
        if (offset === 0) {
            newWeek = isoWeekKey(new Date());
        } else {
            const currentStart = getStartOfWeekFromIso(week);
            currentStart.setDate(currentStart.getDate() + (offset * 7));
            newWeek = isoWeekKey(currentStart);
        }
        setWeek(newWeek);
        setEditingId(null);
    };

    const loadStats = () => {
        if (clan && week) {
            setLoading(true);
            clanApi.getWeeklySummary(clan.id, week)
                .then(setStats)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    };

    useEffect(() => {
        loadStats();
    }, [clan, week]);

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !editingId) {
                setFilters({
                    name: '',
                    days: Array(7).fill(''),
                    khValor: '',
                    rhythmValor: '',
                    zuCircles: '',
                    totalValor: ''
                });
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [editingId]);

    const totalFilteredValor = React.useMemo(() => {
        return sortedStats.reduce((acc, curr) => acc + (curr.totalValor || 0), 0);
    }, [sortedStats]);

    const handleEdit = (stat: WeeklyStats) => {
        const newKhStages = Array(7).fill('');
        stat.khHistory.forEach(h => {
            const d = new Date(h.date);
            const day = d.getDay();
            const dayIndex = day === 0 ? 6 : day - 1;
            if (newKhStages[dayIndex]) {
                newKhStages[dayIndex] += ', ' + h.stage;
            } else {
                newKhStages[dayIndex] = String(h.stage);
            }
        });

        setEditingId(stat.characterId);
        setEditForm({
            khStagesByDay: newKhStages,
            rhythmValor: String(stat.rhythmValor || 0),
            zuCircles: String(stat.zuCircles || 0)
        });
    };

    const handleCancel = () => {
        setEditingId(null);
    };

    const handleSave = async (characterId: string) => {
        if (!clan) return;

        const khRecords: { stage: number, dayIndex: number }[] = [];
        editForm.khStagesByDay.forEach((dayStr, dayIndex) => {
            dayStr.split(',').forEach(s => {
                const n = parseInt(s.trim());
                if (!isNaN(n) && n >= 1 && n <= 7) {
                    khRecords.push({stage: n, dayIndex});
                }
            });
        });

        const rhythmValor = parseInt(editForm.rhythmValor);
        const zuCircles = parseInt(editForm.zuCircles);

        const payload = {
            characterId,
            khRecords,
            rhythmValor: isNaN(rhythmValor) ? 0 : rhythmValor,
            zuCircles: isNaN(zuCircles) ? 0 : zuCircles
        };

        try {
            await clanApi.updateWeeklySummary(clan.id, week, payload);
            setEditingId(null);
            loadStats();
        } catch (e) {
            console.error(e);
            alert('Ошибка при сохранении');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, characterId: string) => {
        if (e.key === 'Escape') {
            handleCancel();
        } else if (e.key === 'Enter') {
            handleSave(characterId);
        }
    };

    if (!clan) return <div className={s.container}>Нет данных о клане</div>;

    return (
        <div className={s.container}>
            <div className={appStyles.pageTitle}>Сводная таблица активности</div>

            <div className={s.controls}>
                <WeekSwitcher weekIso={week} onSwitch={changeWeek}/>
            </div>

            {loading && stats.length === 0 ? (
                <div className={s.loading}>Загрузка данных...</div>
            ) : (
                <table className={s.table} style={{opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s'}}>
                    <thead>
                    <tr>
                        <th className={s.charName}>Персонаж</th>
                        {DAYS.map(d => <th key={d}>{d} (КХ)</th>)}
                        <th onClick={() => requestSort('khValor')} style={{cursor: 'pointer', userSelect: 'none'}}>
                            КХ (Доблесть) {sortConfig.key === 'khValor' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                        </th>
                        <th onClick={() => requestSort('rhythmValor')} style={{cursor: 'pointer', userSelect: 'none'}}>
                            Ритм
                            (Доблесть) {sortConfig.key === 'rhythmValor' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                        </th>
                        <th onClick={() => requestSort('zuCircles')} style={{cursor: 'pointer', userSelect: 'none'}}>
                            ЗУ (Круги) {sortConfig.key === 'zuCircles' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                        </th>
                        <th onClick={() => requestSort('totalValor')} style={{cursor: 'pointer', userSelect: 'none'}}>
                            Итого
                            Доблесть {sortConfig.key === 'totalValor' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                        </th>
                        {canEdit && <th>Действия</th>}
                    </tr>
                    <tr>
                        <th>
                            <input
                                placeholder="Поиск"
                                value={filters.name}
                                onChange={e => setFilters({...filters, name: e.target.value})}
                                className={s.tableInput}
                                style={{textAlign: 'left'}}
                            />
                        </th>
                        {DAYS.map((_, i) => (
                            <th key={i}>
                                <input
                                    value={filters.days[i]}
                                    onChange={e => {
                                        const newDays = [...filters.days];
                                        newDays[i] = e.target.value;
                                        setFilters({...filters, days: newDays});
                                    }}
                                    className={s.tableInput}
                                />
                            </th>
                        ))}
                        <th>
                            <div className={s.filterWrapper}>
                                <button className={s.operatorBtn} onClick={() => toggleOperator('khValor')}
                                        title="Переключить условие">
                                    {operators.khValor}
                                </button>
                                <input
                                    value={filters.khValor}
                                    onChange={e => setFilters({...filters, khValor: e.target.value})}
                                    className={s.tableInput}
                                    placeholder="0"
                                />
                            </div>
                        </th>
                        <th>
                            <div className={s.filterWrapper}>
                                <button className={s.operatorBtn} onClick={() => toggleOperator('rhythmValor')}
                                        title="Переключить условие">
                                    {operators.rhythmValor}
                                </button>
                                <input
                                    value={filters.rhythmValor}
                                    onChange={e => setFilters({...filters, rhythmValor: e.target.value})}
                                    className={s.tableInput}
                                    placeholder="0"
                                />
                            </div>
                        </th>
                        <th>
                            <div className={s.filterWrapper}>
                                <button className={s.operatorBtn} onClick={() => toggleOperator('zuCircles')}
                                        title="Переключить условие">
                                    {operators.zuCircles}
                                </button>
                                <input
                                    value={filters.zuCircles}
                                    onChange={e => setFilters({...filters, zuCircles: e.target.value})}
                                    className={s.tableInput}
                                    placeholder="0"
                                />
                            </div>
                        </th>
                        <th>
                            <div className={s.filterWrapper}>
                                <button className={s.operatorBtn} onClick={() => toggleOperator('totalValor')}
                                        title="Переключить условие">
                                    {operators.totalValor}
                                </button>
                                <input
                                    value={filters.totalValor}
                                    onChange={e => setFilters({...filters, totalValor: e.target.value})}
                                    className={s.tableInput}
                                    placeholder="0"
                                />
                            </div>
                        </th>
                        {canEdit && <th></th>}
                    </tr>
                    </thead>
                    <tbody>
                    {sortedStats.map(stat => {
                        const isEditing = editingId === stat.characterId;

                        return (
                            <tr key={stat.characterId}>
                                <td className={s.charName}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                                        {stat.class && <ClassIcon cls={stat.class} size={20}/>}
                                        {stat.name}
                                    </div>
                                </td>

                                {isEditing ? (
                                    DAYS.map((_, i) => (
                                        <td key={i}>
                                            <input
                                                type="text"
                                                value={editForm.khStagesByDay[i]}
                                                onChange={e => {
                                                    const arr = [...editForm.khStagesByDay];
                                                    arr[i] = e.target.value;
                                                    setEditForm({...editForm, khStagesByDay: arr});
                                                }}
                                                onKeyDown={(e) => handleKeyDown(e, stat.characterId)}
                                                className={s.tableInput}
                                            />
                                        </td>
                                    ))
                                ) : (
                                    DAYS.map((_, i) => {
                                        const dayStages = getDayContent(stat, i);
                                        return <td key={i}>{dayStages || '-'}</td>;
                                    })
                                )}

                                <td>{stat.khValor}</td>

                                {isEditing ? (
                                    <td>
                                        <input
                                            type="number"
                                            value={editForm.rhythmValor}
                                            onChange={e => setEditForm({...editForm, rhythmValor: e.target.value})}
                                            onKeyDown={(e) => handleKeyDown(e, stat.characterId)}
                                            step={2}
                                            min={0}
                                            max={14}
                                            className={s.tableInput}
                                            style={{width: 60}}
                                        />
                                    </td>
                                ) : (
                                    <td>{stat.rhythmValor}</td>
                                )}

                                {isEditing ? (
                                    <td>
                                        <input
                                            type="number"
                                            value={editForm.zuCircles}
                                            onChange={e => setEditForm({...editForm, zuCircles: e.target.value})}
                                            onKeyDown={(e) => handleKeyDown(e, stat.characterId)}
                                            min={0}
                                            max={20}
                                            className={s.tableInput}
                                            style={{width: 60}}
                                        />
                                    </td>
                                ) : (
                                    <td>{stat.zuCircles} ({stat.zuValor})</td>
                                )}

                                <td><strong>{stat.totalValor}</strong></td>

                                {canEdit && (
                                    <td>
                                        {isEditing ? (
                                            <div className={s.actions}>
                                                <button className={`${s.actionBtn} ${s.save}`}
                                                        onClick={() => handleSave(stat.characterId)} title="Применить">✅
                                                </button>
                                                <button className={`${s.actionBtn} ${s.cancel}`} onClick={handleCancel}
                                                        title="Отменить">❌
                                                </button>
                                            </div>
                                        ) : (
                                            <button className={s.actionBtn} onClick={() => handleEdit(stat)}
                                                    title="Редактировать">✏️</button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                    {sortedStats.length === 0 && (
                        <tr>
                            <td colSpan={canEdit ? 13 : 12}>
                                {stats.length === 0 ? 'Нет данных за выбранную неделю' : 'Нет записей, соответствующих фильтру'}
                            </td>
                        </tr>
                    )}
                    </tbody>
                    <tfoot>
                    <tr className={s.summaryRow}>
                        <td>Итого: {sortedStats.length}</td>
                        {DAYS.map((_, i) => <td key={i}></td>)}
                        <td></td>
                        <td></td>
                        <td></td>
                        <td>{totalFilteredValor}</td>
                        {canEdit && <td></td>}
                    </tr>
                    </tfoot>
                </table>
            )}
        </div>
    );
}
