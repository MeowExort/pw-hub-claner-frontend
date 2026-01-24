import React, { useMemo } from 'react';
import { Modal } from '@/shared/ui/Modal/Modal';
import { ClanEvent, Squad } from '@/shared/types';
import { useAppStore } from '@/shared/model/AppStore';
import s from './SquadFeedbackMonitorModal.module.scss';

interface SquadFeedbackMonitorModalProps {
    event: ClanEvent;
    onClose?: () => void;
    onSelectSquad: (squadId: string) => void;
}

export const SquadFeedbackMonitorModal = ({ event, onClose, onSelectSquad }: SquadFeedbackMonitorModalProps) => {
    const { getClanRoster } = useAppStore();
    const [roster, setRoster] = React.useState<any[]>([]);

    React.useEffect(() => {
        getClanRoster().then(setRoster);
    }, [getClanRoster]);

    const pendingSquads = useMemo(() => {
        return (event.squads || []).filter(s => !s.feedbackSubmitted);
    }, [event.squads]);

    const getPLName = (leaderId: string) => {
        if (!leaderId) return 'Не назначен';
        return roster.find(m => m.id === leaderId)?.name || leaderId;
    };

    return (
        <Modal 
            isOpen={true} 
            onClose={onClose} 
            title={`Мониторинг ОС: ${event.name}`}
            maxWidth="500px"
        >
            <div className={s.container}>
                <p className={s.hint}>Список отрядов, по которым еще не подана обратная связь:</p>
                <div className={s.squadList}>
                    {pendingSquads.map(sq => (
                        <div 
                            key={sq.id} 
                            className={s.squadCard}
                            onClick={() => onSelectSquad(sq.id)}
                        >
                            <div className={s.squadName}>{sq.name}</div>
                            <div className={s.squadPL}>ПЛ: <span>{getPLName(sq.leaderId)}</span></div>
                        </div>
                    ))}
                    {pendingSquads.length === 0 && (
                        <div className={s.empty}>Все ПЛы отчитались по этому событию.</div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
