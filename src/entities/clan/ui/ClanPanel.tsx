import React, {useMemo, useState, useEffect} from 'react';
import s from '@/app/styles/Dashboard.module.scss';
import {useAppStore} from '@/shared/model/AppStore';
import {clanApi} from '@/shared/api';
import {generateBannerGradient} from '@/shared/lib/color';
import type {ClanMember, ClanEvent, CharacterClass} from '@/shared/types';
import UploadProgressModal from './UploadProgressModal';
import {ClassIcon} from '@/shared/ui/ClassIcon';

const PVE_TYPES = ['CLAN_HALL', 'RHYTHM', 'FORBIDDEN_KNOWLEDGE'];
const PVP_TYPES = ['MTV', 'GVG', 'SADEMAN'];

export default function ClanPanel() {
    const {clan, events, resolveCharacterNames, hasPermission} = useAppStore();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [names, setNames] = useState<Record<string, { name: string; class: CharacterClass }>>({});
    const [uploadTaskId, setUploadTaskId] = useState<string | null>(null);

    const leadership = useMemo(() => {
        const rolesOrder: Record<string, number> = {MASTER: 0, MARSHAL: 1, OFFICER: 2, PL: 3};
        return (clan?.members ?? [])
            .filter(m => ['MASTER', 'MARSHAL', 'OFFICER', 'PL'].includes(m.role))
            .slice()
            .sort((a, b) => (rolesOrder[a.role] ?? 99) - (rolesOrder[b.role] ?? 99))
            .slice(0, 4);
    }, [clan]);

    // Calculate Stats
    const {totalValor, pveActivity, pvpActivity, hasPvpEvents} = useMemo(() => {
        if (!clan || !events) return {totalValor: 0, pveActivity: 0, pvpActivity: 0, hasPvpEvents: false};

        const valor = clan.totalValor;

        const memberCount = clan.members?.length || 1; // Avoid div by zero

        const calcActivity = (evs: ClanEvent[]) => {
            if (evs.length === 0) return 0;
            const sumPct = evs.reduce((sum, e) => {
                const attendees = e.participants?.filter(p => p.attendance).length || 0;
                return sum + (attendees / memberCount);
            }, 0);
            return Math.round((sumPct / evs.length) * 100);
        };

        const pve = events.filter(e => PVE_TYPES.includes(e.type));
        const pvp = events.filter(e => PVP_TYPES.includes(e.type));

        return {
            totalValor: valor,
            pveActivity: calcActivity(pve),
            pvpActivity: calcActivity(pvp),
            hasPvpEvents: pvp.length > 0
        };
    }, [clan, events]);

    useEffect(() => {
        if (leadership.length > 0) {
            const ids = leadership
                .filter(m => !m.name) // Skip if name is already present
                .map(m => m.characterId)
                .filter(Boolean) as string[];

            if (ids.length > 0) {
                resolveCharacterNames(ids).then(setNames).catch(console.error);
            }
        }
    }, [leadership, resolveCharacterNames]);

    if (!clan) {
        return (
            <aside className={s.leftColumn}>
                <div className={s.clanBanner}>Вы не состоите в клане</div>
            </aside>
        );
    }

    const initials = clan.name.slice(0, 2).toUpperCase();

    const renderMemberName = (m: ClanMember) => {
        let name = m.name;

        if (!name && m.characterId && names[m.characterId]) {
            name = names[m.characterId].name;
        }

        const displayName = name || m.characterId || m.userId || '—';

        return <span>{displayName}</span>;
    };

    const memberInitials = (m: ClanMember) => {
        const name = m.name || (names[m.characterId]?.name) || m.characterId || m.userId || '??';
        return name.slice(0, 2).toUpperCase();
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !clan) return;
        const file = e.target.files[0];

        try {
            const data: any = await clanApi.uploadHistory(clan.id, file);
            if (data && data.taskId) {
                setUploadTaskId(data.taskId);
            } else {
                alert('Загружено, но ID задачи не получен.');
            }
        } catch (err: any) {
            console.error(err);
            alert('Ошибка загрузки: ' + err.message);
        }
        e.target.value = '';
    };

    return (
        <aside className={s.leftColumn} style={{position: 'relative'}}>
            {uploadTaskId && clan && (
                <UploadProgressModal
                    taskId={uploadTaskId}
                    clanId={clan.id}
                    onClose={() => setUploadTaskId(null)}
                />
            )}
            <button
                className="btn secondary small"
                style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    zIndex: 10,
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                onClick={() => setIsCollapsed(v => !v)}
                title={isCollapsed ? 'Развернуть' : 'Свернуть'}
            >
                {isCollapsed ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                         strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                         strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 15l-6-6-6 6"/>
                    </svg>
                )}
            </button>
            <div
                className={s.clanBanner}
                style={{
                    background: generateBannerGradient(clan.name),
                    minHeight: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <div className={s.clanName}
                     style={{margin: 0, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)', zIndex: 1}}>
                    {clan.name}
                </div>
            </div>
            <div className={s.clanIcon}>{initials}</div>

            {!isCollapsed && (
                <>
                    <div>
                        <div className={s.statItem}>
                            <span>Очки доблести:</span>
                            <span>{(totalValor ?? 0).toLocaleString()}</span>
                        </div>
                        <div className={s.statItem}>
                            <span>Участников:</span>
                            <span>{(clan.members || []).length}/200</span>
                        </div>
                    </div>

                    <div className={s.membersList}>
                        <div className={s.sectionTitle}>👑 Руководство</div>
                        {leadership.map(m => {
                            let cls = m.class;
                            if (!cls && m.characterId && names[m.characterId]) {
                                cls = names[m.characterId].class;
                            }
                            return (
                                <div key={`${m.role}-${m.userId}-${m.characterId}`} className={s.memberItem}>
                                    <div className={s.memberAvatar} style={{
                                        background: cls ? 'transparent' : undefined,
                                        border: cls ? 'none' : undefined
                                    }}>
                                        {cls ? <ClassIcon cls={cls} size={32}/> : memberInitials(m)}
                                    </div>
                                    <div>
                                        <div>{renderMemberName(m)}</div>
                                        <div className={s.memberRole}>{translateRole(m.role)}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {hasPermission('CAN_UPLOAD_REPORTS') && (
                        <div style={{marginTop: 20, textAlign: 'center'}}>
                            <label className="btn primary small" style={{cursor: 'pointer', display: 'inline-block'}}>
                                📂 Загрузить отчет
                                <input type="file" hidden onChange={handleUpload} accept=".data,.bin"/>
                            </label>
                        </div>
                    )}
                </>
            )}
        </aside>
    );
}

function translateRole(role: string) {
    switch (role) {
        case 'MASTER':
            return 'Мастер';
        case 'MARSHAL':
            return 'Маршал';
        case 'OFFICER':
            return 'Офицер';
        case 'PL':
            return 'ПЛ';
        default:
            return role;
    }
}
