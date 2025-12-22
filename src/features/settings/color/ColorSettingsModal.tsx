import React from 'react';
import {useTheme} from '@/app/providers/ThemeContext';

export default function ColorSettingsModal({onClose}: { onClose: () => void }) {
    const {theme, themes, setTheme} = useTheme();

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div style={{fontWeight: 700, marginBottom: 12}}>Цветовая схема</div>
                <div className="grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12}}>
                    {themes.map(t => (
                        <button key={t} className="card" data-theme={t} onClick={() => {
                            setTheme(t);
                        }} style={{
                            padding: 12,
                            borderColor: theme === t ? 'var(--primary)' : 'var(--border)',
                            color: 'var(--text)'
                        }}>
                            <div style={{fontWeight: 600, marginBottom: 6}}>{t}</div>
                            <div style={{display: 'flex', gap: 6}}>
                                <div style={{width: 18, height: 18, background: 'var(--primary)', borderRadius: 4}}/>
                                <div style={{width: 18, height: 18, background: 'var(--bg-elev)', borderRadius: 4}}/>
                                <div style={{width: 18, height: 18, background: 'var(--border)', borderRadius: 4}}/>
                            </div>
                        </button>
                    ))}
                </div>
                <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: 12}}>
                    <button className="btn" onClick={onClose}>Готово</button>
                </div>
            </div>
        </div>
    );
}
