import React, {useState} from 'react';
import {ServerName} from '@/shared/types';
import styles from '@/pages/CharacterCreationPage.module.scss';

interface Props {
    onClose: () => void;
    onSelect: (link: string) => void;
    initialServer?: ServerName;
}

const SERVERS: ServerName[] = ['Центавр', 'Фенрир', 'Мицар', 'Капелла'];

const SERVER_MAP: Record<ServerName, string> = {
    'Центавр': 'centaur',
    'Фенрир': 'fenrir',
    'Мицар': 'mizar',
    'Капелла': 'capella'
};

export default function PwobsIdModal({onClose, onSelect, initialServer}: Props) {
    const [server, setServer] = useState<ServerName>(initialServer || SERVERS[0]);
    const [charId, setCharId] = useState('');

    const handleApply = () => {
        if (!charId.trim()) return;
        const serverSlug = SERVER_MAP[server];
        const link = `https://pwobs.com/${serverSlug}/players/${charId.trim()}`;
        onSelect(link);
        onClose();
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: '550px'}}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                }}>
                    <h3 style={{margin: 0}}>Как получить ID персонажа</h3>
                    <button className="btn secondary small" onClick={onClose} style={{padding: '4px 8px'}}>✕</button>
                </div>

                <div style={{lineHeight: '1.6', color: 'var(--text)'}}>
                    <p>Если вы не можете найти своего персонажа в поиске pwobs, вы можете узнать его ID из файлов
                        игры:</p>

                    <div style={{
                        background: 'rgba(0,0,0,0.2)',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        marginBottom: '20px',
                        fontSize: '0.95em'
                    }}>
                        <ol style={{paddingLeft: '20px', margin: 0}}>
                            <li>Зайдите в игру на нужного персонажа.</li>
                            <li>Выйдите в меню выбора персонажа.</li>
                            <li>Откройте папку с игрой: <br/>
                                <code style={{color: 'var(--warning)', fontSize: '0.9em'}}>element → userdata →
                                    Layout</code>
                            </li>
                            <li>Отсортируйте файлы по <b>дате изменения</b> (новые сверху).</li>
                            <li>Название самого первого файла (например, <code
                                style={{color: 'var(--warning)', fontSize: '0.9em'}}>12345</code><code>.ini</code>) —
                                это ваш ID.
                            </li>
                        </ol>
                    </div>

                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '10px'}}>
                        <div className={styles.field}>
                            <label className={styles.label}>Сервер</label>
                            <select
                                className={styles.select}
                                value={server}
                                onChange={e => setServer(e.target.value as ServerName)}
                            >
                                {SERVERS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>ID персонажа</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Напр. 12345"
                                value={charId}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d+$/.test(val)) {
                                        setCharId(val);
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{
                    marginTop: '24px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    borderTop: '1px solid var(--border)',
                    paddingTop: '16px'
                }}>
                    <button className="btn secondary" onClick={onClose}>Отмена</button>
                    <button
                        className="btn primary"
                        onClick={handleApply}
                        disabled={!charId.trim()}
                    >
                        Сформировать ссылку
                    </button>
                </div>
            </div>
        </div>
    );
}
