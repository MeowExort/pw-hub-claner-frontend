import React from 'react';
import {useTheme} from '@/app/providers/ThemeContext';
import {Modal} from '@/shared/ui/Modal/Modal';

export default function ColorSettingsModal({onClose}: { onClose: () => void }) {
    const {theme, themes, setTheme} = useTheme();

    return (
        <Modal 
            isOpen={true} 
            onClose={onClose} 
            title="Цветовая схема"
            footer={<button className="btn" onClick={onClose}>Готово</button>}
        >
            <div className="grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12}}>
                {themes.map(t => (
                    <button key={t} className="card" data-theme={t} onClick={() => {
                        setTheme(t);
                    }} style={{
                        padding: 12,
                        borderColor: theme === t ? 'var(--primary)' : 'var(--border)',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        background: 'var(--bg-elev)',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        transition: 'var(--transition-fast)'
                    }}>
                        <div style={{fontWeight: 700, fontSize: '0.9rem', textTransform: 'capitalize'}}>{t}</div>
                        
                        {/* Visual Preview */}
                        <div style={{
                            background: 'var(--bg)',
                            padding: 8,
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4
                        }}>
                            <div style={{display: 'flex', gap: 4, alignItems: 'center'}}>
                                <div style={{width: 12, height: 12, background: 'var(--primary)', borderRadius: 2}}/>
                                <div style={{height: 4, background: 'var(--primary)', flex: 1, borderRadius: 2, opacity: 0.5}}/>
                            </div>
                            <div style={{display: 'flex', gap: 4, alignItems: 'center'}}>
                                <div style={{width: 12, height: 12, background: 'var(--success)', borderRadius: 2}}/>
                                <div style={{height: 4, background: 'var(--text)', flex: 1, borderRadius: 2, opacity: 0.2}}/>
                            </div>
                            <div style={{display: 'flex', gap: 4, alignItems: 'center'}}>
                                <div style={{width: 12, height: 12, background: 'var(--danger)', borderRadius: 2}}/>
                                <div style={{height: 4, background: 'var(--muted)', flex: 1, borderRadius: 2, opacity: 0.2}}/>
                            </div>
                        </div>

                        {theme === t && (
                            <div style={{
                                fontSize: '0.75rem', 
                                color: 'var(--primary)', 
                                fontWeight: 600,
                                textAlign: 'right'
                            }}>
                                Выбрано ✓
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </Modal>
    );
}
