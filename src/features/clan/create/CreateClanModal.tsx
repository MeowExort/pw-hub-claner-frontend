import React, {useState} from 'react';
import {useAppStore} from '@/shared/model/AppStore';

export default function CreateClanModal({onClose}: { onClose: () => void }) {
    const {createClan} = useAppStore();
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('🛡️');
    const [description, setDescription] = useState('');

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        await createClan(name, icon, description);
        onClose();
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div style={{fontWeight: 700, marginBottom: 12}}>Создать клан</div>
                <form onSubmit={submit} className="grid" style={{gridTemplateColumns: '1fr', gap: 12}}>
                    <input className="input" placeholder="Название" value={name}
                           onChange={e => setName(e.target.value)}/>
                    <input className="input" placeholder="Иконка (emoji или url)" value={icon}
                           onChange={e => setIcon(e.target.value)}/>
                    <textarea className="input" placeholder="Описание" value={description}
                              onChange={e => setDescription(e.target.value)}/>
                    <div style={{display: 'flex', gap: 8, justifyContent: 'flex-end'}}>
                        <button type="button" className="btn secondary" onClick={onClose}>Отмена</button>
                        <button type="submit" className="btn" disabled={!name}>Создать</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
