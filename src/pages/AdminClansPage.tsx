import React, { useEffect, useState } from 'react';
import { adminApi } from '@/shared/api';
import styles from '@/app/styles/App.module.scss';
import adm from './Admin.module.scss';
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
  if (error) return <div className={adm.page}><div className={styles.error}>{error}</div></div>;

  return (
    <div className={adm.page}>
      <h2 className={styles.pageTitle}>Управление кланами (Админ)</h2>

      <div className={adm.tableWrapper}>
        <table className={adm.table}>
          <thead>
            <tr>
              <th>Название</th>
              <th>Сервер</th>
              <th>Участников</th>
              <th>Последнее действие</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {clans.map(clan => (
              <tr key={clan.id}>
                <td>
                  <button 
                    className={adm.btnLink} 
                    onClick={() => openStats(clan)}
                  >
                    {clan.name}
                  </button>
                </td>
                <td>{clan.server}</td>
                <td>{clan._count.members}</td>
                <td>
                  <button 
                    className={adm.btnLink}
                    style={{ color: 'inherit', fontWeight: 'normal' }}
                    onClick={() => openActivity(clan)}
                  >
                    {format(new Date(clan.lastActionDate), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </button>
                </td>
                <td>
                  <button 
                    className={adm.btnDanger} 
                    onClick={() => handleDelete(clan.id, clan.name)}
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
        <div className={adm.modalBackdrop} onClick={closeModal}>
          <div className={adm.modal} onClick={e => e.stopPropagation()}>
            <button 
              className={adm.closeBtn}
              onClick={closeModal}
            >
              ×
            </button>

            {modalLoading ? (
              <div style={{ padding: 40, textAlign: 'center' }}>Загрузка данных...</div>
            ) : (
              <>
                <h3 className={adm.modalTitle}>
                  {modalType === 'stats' ? 'Статистика за 2 недели' : 'История действий за 2 недели'}
                  <div className={adm.subtitle}>Клан: {selectedClan?.name}</div>
                </h3>

                {modalType === 'stats' && stats && (
                  <div>
                    <div className={adm.statsRow}>
                      <div className={adm.miniCard}>
                        <div className={adm.val}>{stats.membersCount}</div>
                        <div className={adm.lbl}>Участников</div>
                      </div>
                      <div className={adm.miniCard}>
                        <div className={adm.val}>{stats.eventsCount}</div>
                        <div className={adm.lbl}>Событий</div>
                      </div>
                      <div className={adm.miniCard}>
                        <div className={adm.val}>{stats.applicationsCount}</div>
                        <div className={adm.lbl}>Заявок</div>
                      </div>
                    </div>

                    <h4>События за период:</h4>
                    {stats.events.length === 0 ? <p>Нет событий за последние 2 недели</p> : (
                      <div className={adm.tableWrapper} style={{ marginTop: 0 }}>
                        <table className={adm.table} style={{ fontSize: 13 }}>
                          <thead>
                            <tr>
                              <th>Дата</th>
                              <th>Тип</th>
                              <th>Название</th>
                              <th>Явка</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.events.map((ev: any) => (
                              <tr key={ev.id}>
                                <td>{format(new Date(ev.date), 'dd.MM HH:mm')}</td>
                                <td>{ev.type}</td>
                                <td>{ev.name}</td>
                                <td>{ev._count.participants} чел.</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {modalType === 'activity' && (
                  <div>
                    {activity.length === 0 ? <p>Нет действий за последние 2 недели</p> : (
                      <div className={adm.activityList}>
                        {activity.map((item, idx) => (
                          <div key={idx} className={`${adm.activityItem} ${item.type === 'AUDIT' ? adm.audit : adm.warning}`}>
                            <div className={adm.activityHeader}>
                              <span>{format(new Date(item.date), 'dd.MM.yyyy HH:mm')}</span>
                              <span style={{ fontWeight: 'bold' }}>{item.type}</span>
                            </div>
                            <div className={adm.activityAction}>{item.action}</div>
                            <div className={adm.activityDetails}>
                              {item.description || JSON.stringify(item.details)}
                            </div>
                            <div className={adm.activityActor}>
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
