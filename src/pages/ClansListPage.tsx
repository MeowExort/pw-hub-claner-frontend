import React, {useEffect, useState} from 'react';
import styles from '@/app/styles/App.module.scss';
import {useAppStore} from '@/shared/model/AppStore';
import {useAuth} from '@/app/providers/AuthContext';
import CreateClanModal from '@/features/clan/create/CreateClanModal';
import ApplyToClanModal from '@/features/clan/apply/ApplyToClanModal';
import type {Clan} from '@/shared/types';

export default function ClansListPage() {
    const {listClans, applyToClan} = useAppStore();
    const {user} = useAuth();
    const [showCreate, setShowCreate] = useState(false);
    const [applyingClan, setApplyingClan] = useState<Clan | null>(null);
    const [clansList, setClansList] = useState<Clan[]>([]);

    const currentCharacter = user?.characters.find(c => c.id === user.mainCharacterId);

    const loadClans = () => {
        listClans().then(allClans => {
            // Filter by server if current character exists
            // Also handle legacy clans without server (maybe show them or hide them? Let's show if undefined to avoid empty list during dev, or hide.
            // Strict requirement: "list of clans on the same server".
            if (currentCharacter) {
                setClansList(allClans.filter(c => c.server === currentCharacter.server));
            } else {
                setClansList([]);
            }
        });
    };

    useEffect(() => {
        loadClans();
    }, [user?.mainCharacterId, currentCharacter?.server]);

    const handleApply = async (clanId: string, msg: string) => {
        // Optimistic update
        if (currentCharacter) {
            setClansList(prev => prev.map(c => {
                if (c.id === clanId) {
                    const optimisticApp: any = {
                        id: 'temp_' + Date.now(),
                        characterId: currentCharacter.id,
                        clanId: c.id,
                        status: 'PENDING',
                        message: msg,
                        createdDate: new Date().toISOString()
                    };
                    const others = (c.applications || []).filter(a => a.characterId !== currentCharacter.id);
                    return {...c, applications: [...others, optimisticApp]};
                }
                return c;
            }));
        }

        await applyToClan(clanId, msg);
        setApplyingClan(null);
        loadClans();
    };

    return (
        <div>
            <div className={styles.pageTitle}>Кланы {currentCharacter ? `— ${currentCharacter.server}` : ''}</div>
            <div className="card">
                <div style={{fontWeight: 700, marginBottom: 8}}>Вступить или создать</div>
                <div style={{marginBottom: 16}}>Ваш текущий персонаж не состоит в клане. Выберите клан из списка или
                    создайте свой.
                </div>

                <button className="btn" onClick={() => setShowCreate(true)} style={{marginBottom: 24}}>
                    + Создать свой клан
                </button>

                <div style={{fontWeight: 700, marginBottom: 8}}>Список кланов ({clansList.length})</div>
                <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                    {clansList.map(c => {
                        const myApps = currentCharacter && c.applications
                            ? c.applications.filter(a => a.characterId === currentCharacter.id)
                            : [];

                        // Prioritize PENDING application to show "Sent" state correctly.
                        // If no PENDING, check for REJECTED to show "Apply again".
                        const pendingApp = myApps.find(a => a.status === 'PENDING');
                        const rejectedApp = myApps.find(a => a.status === 'REJECTED');

                        const isPending = !!pendingApp;
                        const isRejected = !pendingApp && !!rejectedApp;

                        return (
                            <div key={c.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: 12,
                                background: '#2b2b3b',
                                borderRadius: 4
                            }}>
                                <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
                                    <span style={{fontSize: '1.2em'}}>{c.icon}</span>
                                    <div>
                                        <div style={{fontWeight: 600}}>{c.name}</div>
                                        <div style={{fontSize: '0.9em', color: '#aaa'}}>{c.description}</div>
                                    </div>
                                </div>
                                <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                                    <span style={{fontSize: '0.9em', color: '#aaa'}}>{c.members.length} уч.</span>
                                    {isPending ? (
                                        <button className="btn" disabled
                                                style={{opacity: 0.7, cursor: 'default'}}>Заявка отправлена</button>
                                    ) : (
                                        <button className="btn" onClick={() => setApplyingClan(c)}>
                                            {isRejected ? 'Подать еще раз' : 'Подать заявку'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {clansList.length === 0 &&
                        <div style={{color: '#888', padding: 10}}>Нет доступных кланов на этом сервере.</div>}
                </div>
            </div>
            {showCreate && <CreateClanModal onClose={() => setShowCreate(false)}/>}
            {applyingClan && (
                <ApplyToClanModal
                    clanName={applyingClan.name}
                    onApply={(msg) => handleApply(applyingClan.id, msg)}
                    onClose={() => setApplyingClan(null)}
                />
            )}
        </div>
    );
}
