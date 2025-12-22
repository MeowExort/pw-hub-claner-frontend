import React, {useState} from 'react';
import {tasksApi} from '@/shared/api';
import styles from '@/app/styles/App.module.scss';

export default function PopulateDbPage() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const runTask = async (taskId: string, confirmMsg: string) => {
        if (!confirm(confirmMsg)) return;
        setLoading(true);
        setMessage('');
        try {
            await tasksApi.runTask(taskId);
            setMessage(`Запущен процесс: ${taskId}. Проверьте страницу Системные задачи для статуса.`);
        } catch (e: any) {
            setMessage(`Ошибка: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{padding: 20}}>
            <h2 className={styles.pageTitle}>Управление базой данных</h2>

            <div className="card" style={{padding: 20, background: 'var(--surface)', borderRadius: 8, maxWidth: 600}}>
                <p>Здесь можно наполнить базу данных тестовыми данными или очистить её.</p>

                <div style={{display: 'flex', gap: 10, marginTop: 20}}>
                    <button
                        className="btn"
                        onClick={() => runTask('populate-db', 'Вы уверены? Это создаст много новых записей.')}
                        disabled={loading}
                    >
                        Наполнить БД
                    </button>

                    <button
                        className="btn"
                        style={{backgroundColor: 'var(--accent-red)', color: 'white'}}
                        onClick={() => runTask('clear-db', 'ВНИМАНИЕ! Это удалит ВСЕ данные (кланы, персонажи, события). Вы уверены?')}
                        disabled={loading}
                    >
                        Очистить все
                    </button>
                </div>

                {message &&
                    <div style={{marginTop: 20, padding: 10, background: 'var(--bg)', borderRadius: 4}}>{message}</div>}
            </div>
        </div>
    );
}
