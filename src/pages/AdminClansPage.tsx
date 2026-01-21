import React, { useEffect, useState } from 'react';
import { adminApi } from '@/shared/api';
import styles from '@/app/styles/App.module.scss';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ClanWithLastAction {
  id: string;
  name: string;
  server: string;
  lastActionDate: string;
  _count: {
    members: number;
  };
}

interface ClanStats {
  eventsCount: number;
  membersCount: number;
  applicationsCount: number;
  events: any[];
}

interface ActivityItem {
  type: string;
  date: string;
  action: string;
  actor: string;
  details?: any;
  description?: string;
}

export default function AdminClansPage() {
  const [clans, setClans] = useState<ClanWithLastAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedClan, setSelectedClan] = useState<ClanWithLastAction | null>(null);
  const [stats, setStats] = useState<ClanStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [modalType, setModalType] = useState<'stats' | 'activity' | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    loadClans();
  }, []);

  const loadClans = async () => {
    setLoading(true);
    try {
      const data = await adminApi.listClans();
      setClans(data);
    } catch (e) {
      setError('Ошибка при загрузке списка кланов');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Вы уверены, что хотите УДАЛИТЬ клан "${name}"? Это действие необратимо и удалит ВСЕ связанные данные (события, историю и т.д.)!`)) {
      return;
    }

    try {
      await adminApi.deleteClan(id);
      setClans(clans.filter(c => c.id !== id));
      alert('Клан успешно удален');
    } catch (e) {
      alert('Ошибка при удалении клана');
    }
  };

  const openStats = async (clan: ClanWithLastAction) => {
    setSelectedClan(clan);
    setModalType('stats');
    setModalLoading(true);
    try {
      const data = await adminApi.getClanStats(clan.id);
      setStats(data);
    } catch (e) {
      alert('Ошибка при загрузке статистики');
    } finally {
      setModalLoading(false);
    }
  };

  const openActivity = async (clan: ClanWithLastAction) => {
    setSelectedClan(clan);
    setModalType('activity');
    setModalLoading(true);
    try {
      const data = await adminApi.getClanActivity(clan.id);
      setActivity(data);
    } catch (e) {
      alert('Ошибка при загрузке истории действий');
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedClan(null);
    setStats(null);
    setActivity([]);
  };

  if (loading) return <div className={styles.loading}>Загрузка кланов...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2 className={styles.pageTitle}>Управление кланами (Админ)</h2>

      <div className="card" style={{ background: 'var(--card)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
              <th style={{ padding: 12 }}>Название</th>
              <th style={{ padding: 12 }}>Сервер</th>
              <th style={{ padding: 12 }}>Участников</th>
              <th style={{ padding: 12 }}>Последнее действие</th>
              <th style={{ padding: 12 }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {clans.map(clan => (
              <tr key={clan.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: 12 }}>
                  <button 
                    className="btn-link" 
                    onClick={() => openStats(clan)}
                    style={{ color: 'var(--accent)', fontWeight: 'bold', cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontSize: 'inherit' }}
                  >
                    {clan.name}
                  </button>
                </td>
                <td style={{ padding: 12 }}>{clan.server}</td>
                <td style={{ padding: 12 }}>{clan._count.members}</td>
                <td style={{ padding: 12 }}>
                  <button 
                    className="btn-link" 
                    onClick={() => openActivity(clan)}
                    style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontSize: 'inherit', color: 'inherit' }}
                  >
                    {format(new Date(clan.lastActionDate), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </button>
                </td>
                <td style={{ padding: 12 }}>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleDelete(clan.id, clan.name)}
                    style={{ padding: '4px 8px', fontSize: 12, background: '#d32f2f', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalType && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: 20
        }}>
          <div style={{ 
            background: 'var(--bg-elev)', padding: 25, borderRadius: 12, width: '100%', maxWidth: 800, 
            maxHeight: '90vh', overflow: 'auto', position: 'relative',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            border: '1px solid var(--border)'
          }}>
            <button 
              onClick={closeModal}
              style={{ position: 'absolute', top: 15, right: 15, background: 'none', border: 'none', color: 'var(--muted)', fontSize: 24, cursor: 'pointer' }}
            >
              ×
            </button>

            {modalLoading ? (
              <div style={{ padding: 40, textAlign: 'center' }}>Загрузка данных...</div>
            ) : (
              <>
                <h3 style={{ marginTop: 0 }}>
                  {modalType === 'stats' ? 'Статистика за 2 недели' : 'История действий за 2 недели'}
                  <div style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 'normal' }}>Клан: {selectedClan?.name}</div>
                </h3>

                {modalType === 'stats' && stats && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginBottom: 25 }}>
                      <div className="card" style={{ padding: 15, textAlign: 'center', background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: 20, fontWeight: 'bold' }}>{stats.membersCount}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>Участников</div>
                      </div>
                      <div className="card" style={{ padding: 15, textAlign: 'center', background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: 20, fontWeight: 'bold' }}>{stats.eventsCount}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>Событий</div>
                      </div>
                      <div className="card" style={{ padding: 15, textAlign: 'center', background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: 20, fontWeight: 'bold' }}>{stats.applicationsCount}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>Заявок</div>
                      </div>
                    </div>

                    <h4>События за период:</h4>
                    {stats.events.length === 0 ? <p>Нет событий за последние 2 недели</p> : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead>
                          <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '8px 0' }}>Дата</th>
                            <th>Тип</th>
                            <th>Название</th>
                            <th>Явка</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.events.map((ev: any) => (
                            <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '8px 0' }}>{format(new Date(ev.date), 'dd.MM HH:mm')}</td>
                              <td>{ev.type}</td>
                              <td>{ev.name}</td>
                              <td>{ev._count.participants} чел.</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {modalType === 'activity' && (
                  <div>
                    {activity.length === 0 ? <p>Нет действий за последние 2 недели</p> : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {activity.map((item, idx) => (
                          <div key={idx} style={{ 
                            padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                            borderLeft: `4px solid ${item.type === 'AUDIT' ? 'var(--accent)' : '#ffa726'}`
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                              <span>{format(new Date(item.date), 'dd.MM.yyyy HH:mm')}</span>
                              <span style={{ fontWeight: 'bold' }}>{item.type}</span>
                            </div>
                            <div style={{ fontWeight: '500' }}>{item.action}</div>
                            <div style={{ fontSize: 13, marginTop: 4 }}>
                              {item.description || JSON.stringify(item.details)}
                            </div>
                            <div style={{ fontSize: 11, marginTop: 4, color: 'var(--muted)' }}>
                              Исполнитель: {item.actor}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
