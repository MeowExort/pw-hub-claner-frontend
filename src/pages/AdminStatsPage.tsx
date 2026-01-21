import React, { useEffect, useState } from 'react';
import { adminApi } from '@/shared/api';
import styles from '@/app/styles/App.module.scss';

interface Stats {
  users: {
    total: number;
    withTelegram: number;
    online: number;
  };
  characters: {
    total: number;
    byClass: Array<{ class: string; _count: number }>;
  };
  clans: {
    total: number;
  };
  events: {
    total: number;
    byType: Array<{ type: string; _count: number }>;
  };
  reports: {
    totalTaskLogs: number;
  };
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (e: any) {
      console.error('Failed to load admin stats', e);
      setError('Не удалось загрузить статистику. Возможно, у вас недостаточно прав.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>Загрузка статистики...</div>;
  if (error) return <div className={styles.error} style={{ padding: 20 }}>{error}</div>;
  if (!stats) return null;

  return (
    <div style={{ padding: 20 }}>
      <h2 className={styles.pageTitle} style={{ marginBottom: 20 }}>Админ-панель: Статистика</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
        
        {/* Аккаунты */}
        <div className="card" style={{ padding: 20, background: 'var(--surface)', borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Аккаунты</h3>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.users.total}</div>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>Всего пользователей</div>
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Онлайн (15м):</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{stats.users.online}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>С Telegram:</span>
              <span>{stats.users.withTelegram}</span>
            </div>
          </div>
        </div>

        {/* Кланы */}
        <div className="card" style={{ padding: 20, background: 'var(--surface)', borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Кланы</h3>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.clans.total}</div>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>Зарегистрировано кланов</div>
        </div>

        {/* Персонажи */}
        <div className="card" style={{ padding: 20, background: 'var(--surface)', borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Персонажи</h3>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.characters.total}</div>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>Всего персонажей</div>
          <div style={{ marginTop: 10, maxHeight: 150, overflow: 'auto' }}>
            <h4 style={{ margin: '5px 0' }}>По классам:</h4>
            {stats.characters.byClass.map(c => (
              <div key={c.class} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{c.class}:</span>
                <span>{c._count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* События */}
        <div className="card" style={{ padding: 20, background: 'var(--surface)', borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>События</h3>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.events.total}</div>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>Всего создано</div>
          <div style={{ marginTop: 10 }}>
            <h4 style={{ margin: '5px 0' }}>По типам:</h4>
            {stats.events.byType.map(t => (
              <div key={t.type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{t.type}:</span>
                <span>{t._count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Отчеты/Задачи */}
        <div className="card" style={{ padding: 20, background: 'var(--surface)', borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>Система</h3>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{stats.reports.totalTaskLogs}</div>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>Записей в логах задач</div>
          <button 
            className="btn" 
            style={{ marginTop: 15, width: '100%' }}
            onClick={() => window.location.href = '/system/tasks'}
          >
            Управление задачами
          </button>
        </div>

      </div>

      <div style={{ marginTop: 20 }}>
        <button className="btn" onClick={loadStats}>Обновить статистику</button>
      </div>
    </div>
  );
}
