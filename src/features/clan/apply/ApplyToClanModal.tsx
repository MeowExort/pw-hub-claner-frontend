import React, {useState} from 'react';

interface ApplyToClanModalProps {
    clanName: string;
    onApply: (message: string) => Promise<void>;
    onClose: () => void;
}

export default function ApplyToClanModal({clanName, onApply, onClose}: ApplyToClanModalProps) {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onApply(message.trim());
        } catch (error) {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={loading ? undefined : onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div style={{fontWeight: 700, marginBottom: 12}}>Подать заявку в клан {clanName}</div>
                <form onSubmit={handleSubmit} className="grid" style={{gridTemplateColumns: '1fr', gap: 12}}>
                    <textarea 
                        className="input" 
                        placeholder="Сообщение к заявке (необязательно)" 
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        autoFocus
                        disabled={loading}
                    />
                    <div style={{display: 'flex', gap: 8, justifyContent: 'flex-end'}}>
                        <button type="button" className="btn secondary" onClick={onClose} disabled={loading}>Отмена</button>
                        <button type="submit" className="btn" disabled={loading}>
                            {loading ? 'Отправка...' : 'Отправить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
