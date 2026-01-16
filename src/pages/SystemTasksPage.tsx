import React, {useEffect, useState} from 'react';
import {tasksApi} from '@/shared/api';
import {useToast} from '@/app/providers/ToastContext';
import styles from '@/app/styles/App.module.scss';

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
        <div style={{padding: 20}}>
            <h2 className={styles.pageTitle} style={{marginBottom: 20}}>Системные задачи</h2>

            <div className="card"
                 style={{marginBottom: 20, padding: 20, background: 'var(--surface)', borderRadius: 8}}>
                <h3 style={{marginTop: 0}}>Активные задачи</h3>
                <table style={{width: '100%', borderCollapse: 'collapse', marginTop: 10}}>
                    <thead>
                    <tr style={{textAlign: 'left', borderBottom: '2px solid var(--border)'}}>
                        <th style={{padding: 8}}>ID</th>
                        <th style={{padding: 8}}>Название</th>
                        <th style={{padding: 8}}>Расписание</th>
                        <th style={{padding: 8}}>Описание</th>
                        <th style={{padding: 8}}>Действия</th>
                    </tr>
                    </thead>
                    <tbody>
                    {tasks.map(task => (
                        <tr key={task.id} style={{borderBottom: '1px solid var(--border)'}}>
                            <td style={{padding: 8}}>{task.id}</td>
                            <td style={{padding: 8}}>{task.name}</td>
                            <td style={{padding: 8}}><code>{task.schedule}</code></td>
                            <td style={{padding: 8}}>{task.description}</td>
                            <td style={{padding: 8}}>
                                <button className="btn" onClick={() => handleRun(task.id)}>Запустить</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="card" style={{padding: 20, background: 'var(--surface)', borderRadius: 8}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10}}>
                    <h3 style={{margin: 0}}>История выполнения</h3>
                    <button className="btn" onClick={loadData}>Обновить</button>
                </div>

                <div style={{marginBottom: 10}}>
                    <label>Фильтр по задаче: </label>
                    <select
                        onChange={e => setSelectedTask(e.target.value || null)}
                        style={{
                            padding: 4,
                            borderRadius: 4,
                            background: 'var(--bg)',
                            color: 'var(--text)',
                            border: '1px solid var(--border)'
                        }}
                    >
                        <option value="">Все</option>
                        {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <table style={{width: '100%', borderCollapse: 'collapse'}}>
                    <thead>
                    <tr style={{textAlign: 'left', borderBottom: '2px solid var(--border)'}}>
                        <th style={{padding: 8}}>Дата запуска</th>
                        <th style={{padding: 8}}>Задача</th>
                        <th style={{padding: 8}}>Статус</th>
                        <th style={{padding: 8}}>Длительность</th>
                        <th style={{padding: 8}}>Сообщение</th>
                        <th style={{padding: 8}}>Логи</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredHistory.map(h => (
                        <tr key={h.id} style={{borderBottom: '1px solid var(--border)'}}>
                            <td style={{padding: 8}}>{new Date(h.startedAt).toLocaleString()}</td>
                            <td style={{padding: 8}}>{h.taskName}</td>
                            <td style={{
                                padding: 8,
                                fontWeight: 'bold',
                                color: h.status === 'SUCCESS' ? 'var(--accent-green)' : h.status === 'FAILED' ? 'var(--accent-red)' : 'var(--accent-orange)'
                            }}>
                                {h.status}
                            </td>
                            <td style={{padding: 8}}>{h.duration !== null ? `${h.duration}ms` : '-'}</td>
                            <td style={{padding: 8}}>{h.message}</td>
                            <td style={{padding: 8}}>
                                {h.logs && (
                                    <details>
                                        <summary style={{cursor: 'pointer', color: 'var(--accent)'}}>Показать</summary>
                                        <pre style={{
                                            fontSize: 10,
                                            maxWidth: 300,
                                            overflow: 'auto',
                                            maxHeight: 200,
                                            background: '#000',
                                            color: '#fff',
                                            padding: 4
                                        }}>
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
    );
}
