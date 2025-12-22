import React from 'react';
import {useAppStore} from '@/shared/model/AppStore';

export default function ClanStats() {
    const {clan} = useAppStore();
    if (!clan) return <div className="card">Не состоит в клане</div>;
    const members = clan.members.length;
    // Simple stats demo
    return (
        <div className="card">
            <div style={{fontWeight: 700, marginBottom: 8}}>Статистика клана</div>
            <div>Название: {clan.name} {clan.icon}</div>
            <div>Участников: {members}</div>
        </div>
    );
}
