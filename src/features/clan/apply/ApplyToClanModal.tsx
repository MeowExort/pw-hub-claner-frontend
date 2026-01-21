import React, {useState} from 'react';

interface ApplyToClanModalProps {
    clanName: string;
    onApply: (message: string) => void;
    onClose: () => void;
}

export default function ApplyToClanModal({clanName, onApply, onClose}: ApplyToClanModalProps) {
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onApply(message.trim());
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div style={{fontWeight: 700, marginBottom: 12}}>Подать заявку в клан {clanName}</div>
                <form onSubmit={handleSubmit} className="grid" style={{gridTemplateColumns: '1fr', gap: 12}}>
                    <textarea 
                        className="input" 
                        placeholder="Сообщение к заявке (обязательно)" 
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        required
                        autoFocus
                    />
                    <div style={{display: 'flex', gap: 8, justifyContent: 'flex-end'}}>
                        <button type="button" className="btn secondary" onClick={onClose}>Отмена</button>
                        <button type="submit" className="btn" disabled={!message.trim()}>Отправить</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
