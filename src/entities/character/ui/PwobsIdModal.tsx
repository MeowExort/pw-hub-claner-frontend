import React, {useState} from 'react';
import {ServerName} from '@/shared/types';
import styles from '@/features/settings/character/CharacterForm.module.scss';
import {Select, SelectOption} from '@/shared/ui/Select/Select';

import {Modal} from '@/shared/ui/Modal/Modal';

interface Props {
    onClose: () => void;
    onSelect: (link: string) => void;
    initialServer?: ServerName;
}

const SERVER_OPTIONS: SelectOption[] = [
    {value: 'Центавр', label: 'Центавр'},
    {value: 'Фенрир', label: 'Фенрир'},
    {value: 'Мицар', label: 'Мицар'},
    {value: 'Капелла', label: 'Капелла'}
];

const SERVER_MAP: Record<string, string> = {
    'Центавр': 'centaur',
    'Фенрир': 'fenrir',
    'Мицар': 'mizar',
    'Капелла': 'capella'
};

export default function PwobsIdModal({onClose, onSelect, initialServer}: Props) {
    const [server, setServer] = useState<ServerName>(initialServer || 'Центавр');
    const [charId, setCharId] = useState('');

    const handleApply = () => {
        if (!charId.trim()) return;
        const serverSlug = SERVER_MAP[server];
        const link = `https://pwobs.com/${serverSlug}/players/${charId.trim()}`;
        onSelect(link);
        onClose();
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Как получить ID персонажа"
            maxWidth="550px"
            footer={
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn secondary" onClick={onClose}>Отмена</button>
                    <button
                        className="btn primary"
                        onClick={handleApply}
                        disabled={!charId.trim()}
                    >
                        Сформировать ссылку
                    </button>
                </div>
            }
        >
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
                        <Select
                            value={server}
                            onChange={val => setServer(val as ServerName)}
                            options={SERVER_OPTIONS}
                        />
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
        </Modal>
    );
}
