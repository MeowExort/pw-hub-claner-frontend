import React, { useEffect, useState } from 'react';
import { adminApi } from '@/shared/api';
import { formatNumber } from '@/shared/lib/number';
import styles from '@/app/styles/App.module.scss';
import adm from './Admin.module.scss';

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
  if (error) return <div className={adm.page}><div className={styles.error}>{error}</div></div>;
  if (!stats) return null;

  return (
    <div className={adm.page}>
      <h2 className={styles.pageTitle}>Админ-панель: Статистика</h2>

      <div className={adm.statsGrid}>
        
        {/* Аккаунты */}
        <div className={adm.statCard}>
          <h3 className={adm.statTitle}>Аккаунты</h3>
          <div className={adm.statValue}>{formatNumber(stats.users.total)}</div>
          <div className={adm.statMuted}>Всего пользователей</div>
          <div className={adm.statList}>
            <div className={adm.statItem}>
              <span>Онлайн (15м):</span>
              <span className={adm.online}>{formatNumber(stats.users.online)}</span>
            </div>
            <div className={adm.statItem}>
              <span>С Telegram:</span>
              <span>{formatNumber(stats.users.withTelegram)}</span>
            </div>
          </div>
        </div>

        {/* Кланы */}
        <div className={adm.statCard}>
          <h3 className={adm.statTitle}>Кланы</h3>
          <div className={adm.statValue}>{formatNumber(stats.clans.total)}</div>
          <div className={adm.statMuted}>Зарегистрировано кланов</div>
        </div>

        {/* Персонажи */}
        <div className={adm.statCard}>
          <h3 className={adm.statTitle}>Персонажи</h3>
          <div className={adm.statValue}>{formatNumber(stats.characters.total)}</div>
          <div className={adm.statMuted}>Всего персонажей</div>
          <div className={adm.statList}>
            <h4 style={{ margin: '5px 0' }}>По классам:</h4>
            <div className={adm.classList}>
              {stats.characters.byClass.map(c => (
                <div key={c.class} className={adm.statItem}>
                  <span>{c.class}:</span>
                  <span>{formatNumber(c._count)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* События */}
        <div className={adm.statCard}>
          <h3 className={adm.statTitle}>События</h3>
          <div className={adm.statValue}>{formatNumber(stats.events.total)}</div>
          <div className={adm.statMuted}>Всего создано</div>
          <div className={adm.statList}>
            <h4 style={{ margin: '5px 0' }}>По типам:</h4>
            {stats.events.byType.map(t => (
              <div key={t.type} className={adm.statItem}>
                <span>{t.type}:</span>
                <span>{formatNumber(t._count)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Отчеты/Задачи */}
        <div className={adm.statCard}>
          <h3 className={adm.statTitle}>Система</h3>
          <div className={adm.statValue}>{formatNumber(stats.reports.totalTaskLogs)}</div>
          <div className={adm.statMuted}>Записей в логах задач</div>
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
