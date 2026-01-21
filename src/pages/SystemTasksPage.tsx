import React, {useEffect, useState} from 'react';
import {tasksApi} from '@/shared/api';
import {useToast} from '@/app/providers/ToastContext';
import styles from '@/app/styles/App.module.scss';
import adm from './Admin.module.scss';

export default function SystemTasksPage() {
    const {notify} = useToast();
    const [tasks, setTasks] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTask, setSelectedTask] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const t = await tasksApi.getTasks();
            setTasks(t);
            const h = await tasksApi.getHistory();
            setHistory(h);
        } catch (e) {
            console.error('Failed to load tasks', e);
        } finally {
            setLoading(false);
        }
    };

    const handleRun = async (taskId: string) => {
        if (!confirm('Запустить задачу сейчас?')) return;
        try {
            await tasksApi.runTask(taskId);
            notify('Задача запущена', 'success');
            // Wait a bit or reload immediately?
            // Since it's async, we might not see "RUNNING" immediately if we query history too fast,
            // but let's try reloading.
            setTimeout(loadData, 500);
        } catch (e) {
            notify('Ошибка запуска', 'error');
        }
    };

    const filteredHistory = selectedTask
        ? history.filter(h => h.taskName === selectedTask)
        : history;

    if (loading && tasks.length === 0) return <div className={styles.loading}>Загрузка...</div>;

    return (
        <div className={adm.page}>
            <h2 className={styles.pageTitle}>Системные задачи</h2>

            <div className={adm.statCard} style={{ marginBottom: 20 }}>
                <h3 className={adm.statTitle}>Активные задачи</h3>
                <div className={adm.tableWrapper} style={{ marginTop: 10 }}>
                    <table className={adm.table}>
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Название</th>
                            <th>Расписание</th>
                            <th>Описание</th>
                            <th>Действия</th>
                        </tr>
                        </thead>
                        <tbody>
                        {tasks.map(task => (
                            <tr key={task.id}>
                                <td>{task.id}</td>
                                <td>{task.name}</td>
                                <td><code className={adm.code}>{task.schedule}</code></td>
                                <td>{task.description}</td>
                                <td>
                                    <button className="btn" onClick={() => handleRun(task.id)}>Запустить</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className={adm.statCard}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
                    <h3 className={adm.statTitle} style={{margin: 0}}>История выполнения</h3>
                    <button className="btn" onClick={loadData}>Обновить</button>
                </div>

                <div style={{marginBottom: 10}}>
                    <label>Фильтр по задаче: </label>
                    <select
                        onChange={e => setSelectedTask(e.target.value || null)}
                        className={styles.select}
                    >
                        <option value="">Все</option>
                        {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                
                <div className={adm.tableWrapper}>
                    <table className={adm.table}>
                        <thead>
                        <tr>
                            <th>Дата запуска</th>
                            <th>Задача</th>
                            <th>Статус</th>
                            <th>Длительность</th>
                            <th>Сообщение</th>
                            <th>Логи</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredHistory.map(h => (
                            <tr key={h.id}>
                                <td>{new Date(h.startedAt).toLocaleString()}</td>
                                <td>{h.taskName}</td>
                                <td className={
                                    h.status === 'SUCCESS' ? adm.statusSuccess : 
                                    h.status === 'FAILED' ? adm.statusFailed : 
                                    adm.statusPending
                                }>
                                    {h.status}
                                </td>
                                <td>{h.duration !== null ? `${h.duration}ms` : '-'}</td>
                                <td>{h.message}</td>
                                <td>
                                    {h.logs && (
                                        <details>
                                            <summary style={{cursor: 'pointer', color: 'var(--primary)'}}>Показать</summary>
                                            <pre className={adm.logPre}>
                                           {h.logs}
                                       </pre>
                                        </details>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredHistory.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{padding: 20, textAlign: 'center', color: 'var(--muted)'}}>
                                    История пуста
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
