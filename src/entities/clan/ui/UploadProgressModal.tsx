import React, {useEffect, useState} from 'react';
import {clanApi} from '@/shared/api';

interface Stats {
    khChecksAdded: number;
    zuCirclesAdded: number;
    newDancers: number;
    finishedDancers: number;
    total: number;
    processed: number;
}

interface Props {
    taskId: string | null;
    clanId: string;
    onClose: () => void;
}

export default function UploadProgressModal({taskId, clanId, onClose}: Props) {
    const [stats, setStats] = useState<Stats | null>(null);
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);
    const [status, setStatus] = useState<string>('PENDING');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!taskId) return;

        let interval: ReturnType<typeof setInterval>;

        const poll = async () => {
            try {
                const task: any = await clanApi.getUploadTask(clanId, taskId);

                if (task) {
                    setStatus(task.status);
                    if (task.status === 'ERROR') {
                        setError(task.error || 'Unknown error');
                        clearInterval(interval);
                    } else if (task.status === 'COMPLETED') {
                        setStats(task.result);
                        setProgress(task.result.total);
                        setTotal(task.result.total);
                        clearInterval(interval);
                    } else {
                        setProgress(task.progress);
                        setTotal(task.total);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };

        poll();
        interval = setInterval(poll, 1000);

        return () => clearInterval(interval);
    }, [taskId, clanId]);

    if (!taskId) return null;

    const percent = total > 0 ? Math.min(100, Math.round((progress / total) * 100)) : 0;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: '#1f2833',
                padding: '20px',
                borderRadius: '8px',
                width: '400px',
                color: '#fff',
                border: '1px solid #45a29e',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}>
                <h3 style={{marginTop: 0, color: '#66fcf1'}}>Обработка отчета</h3>

                {error ? (
                    <div>
                        <div style={{color: '#ff6b6b', marginBottom: '10px'}}>Ошибка: {error}</div>
                        <button onClick={onClose} className="btn secondary small" style={{width: '100%'}}>Закрыть
                        </button>
                    </div>
                ) : !stats ? (
                    <div>
                        <div style={{marginBottom: '10px', fontSize: '0.9rem'}}>
                            Идет обработка... {progress} / {total || '?'}
                        </div>
                        <div style={{
                            width: '100%',
                            height: '10px',
                            background: '#0b0c10',
                            borderRadius: '5px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${percent}%`,
                                height: '100%',
                                background: '#66fcf1',
                                transition: 'width 0.3s'
                            }}></div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div style={{marginBottom: '15px', color: '#66fcf1', fontWeight: 'bold'}}>✅ Обработка
                            завершена!
                        </div>
                        <ul style={{listStyle: 'none', padding: 0, fontSize: '0.9rem'}}>
                            <li style={{
                                padding: '8px 0',
                                borderBottom: '1px solid #333',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}>
                                <span>Зачетов КХ добавлено:</span> <b>{stats.khChecksAdded}</b>
                            </li>
                            <li style={{
                                padding: '8px 0',
                                borderBottom: '1px solid #333',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}>
                                <span>Кругов ЗУ добавлено:</span> <b>{stats.zuCirclesAdded}</b>
                            </li>
                            <li style={{
                                padding: '8px 0',
                                borderBottom: '1px solid #333',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}>
                                <span>Новых танцоров (0→&gt;0):</span> <b>{stats.newDancers}</b>
                            </li>
                            <li style={{
                                padding: '8px 0',
                                borderBottom: '1px solid #333',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}>
                                <span>Дотанцевали (&gt;0→14):</span> <b>{stats.finishedDancers}</b>
                            </li>
                        </ul>
                        <button onClick={onClose} className="btn primary small"
                                style={{width: '100%', marginTop: '15px', padding: '8px'}}>
                            Закрыть
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
