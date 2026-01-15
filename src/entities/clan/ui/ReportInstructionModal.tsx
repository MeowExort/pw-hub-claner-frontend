import React, {useState} from 'react';

interface Props {
    onClose: () => void;
    onConfirm?: () => void;
}

export default function ReportInstructionModal({onClose, onConfirm}: Props) {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const savePreference = () => {
        if (dontShowAgain) {
            localStorage.setItem('hide_report_instruction', 'true');
        }
    };

    const handleClose = () => {
        savePreference();
        onClose();
    };

    const handleConfirm = () => {
        savePreference();
        if (onConfirm) {
            onConfirm();
        } else {
            onClose();
        }
    };

    return (
        <div className="modal-backdrop" onClick={handleClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: '500px'}}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                }}>
                    <h3 style={{margin: 0}}>Инструкция по загрузке отчета</h3>
                    <button className="btn secondary small" onClick={handleClose} style={{padding: '4px 8px'}}>✕
                    </button>
                </div>

                <div style={{lineHeight: '1.6', color: 'var(--text)'}}>
                    <p>Для обновления данных о событиях гильдии необходимо загрузить файл истории из клиента игры.</p>

                    <div style={{
                        background: 'var(--bg)',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        marginBottom: '20px'
                    }}>
                        <b style={{color: 'var(--primary)', display: 'block', marginBottom: '8px'}}>Путь к файлу:</b>
                        <code style={{fontSize: '0.9em', wordBreak: 'break-all'}}>
                            Папка с игрой → element → userdata → FactionData → FactionHistoryData
                        </code>
                        <p style={{marginTop: '12px', fontSize: '0.9em', color: 'var(--muted)'}}>
                            Вам нужен файл вида: <br/>
                            <span style={{color: 'var(--text)'}}>FactionBoard&lt;id&gt;</span> (без расширения)
                        </p>
                    </div>

                    <ol style={{paddingLeft: '20px', marginBottom: '20px'}}>
                        <li>Откройте папку с установленной игрой.</li>
                        <li>Перейдите по указанному выше пути.</li>
                        <li>Найдите файл, соответствующий вашей гильдии.</li>
                        <li>Выберите его в окне загрузки.</li>
                    </ol>
                </div>

                <div style={{
                    marginTop: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--border)',
                    paddingTop: '16px'
                }}>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9em'
                    }}>
                        <input
                            type="checkbox"
                            checked={dontShowAgain}
                            onChange={e => setDontShowAgain(e.target.checked)}
                        />
                        Больше не показывать
                    </label>
                    <button className="btn primary" onClick={handleConfirm}>Понятно</button>
                </div>
            </div>
        </div>
    );
}
