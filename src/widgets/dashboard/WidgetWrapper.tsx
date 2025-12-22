import React from 'react';
import {WIDGET_TYPES} from './types';
import ClanPanel from '@/entities/clan/ui/ClanPanel';
import MyActivity from '@/widgets/dashboard/MyActivity';
import ClanHallWidget from '@/widgets/dashboard/ClanHallWidget';
import UpcomingEvents from '@/widgets/events/UpcomingEvents';
import EventCalendar from '@/widgets/events/EventCalendar';
import ActivityFeed from '@/widgets/dashboard/ActivityFeed';
import {useLayout} from './LayoutContext';

interface Props {
    widgetId: string;
    areaId: string;
    index: number;
    isFirst: boolean;
    isLast: boolean;
}

export const WidgetWrapper: React.FC<Props> = ({widgetId, areaId, index, isFirst, isLast}) => {
    const {layout, isEditing, removeWidget, moveWidget} = useLayout();
    const widget = layout.widgets[widgetId];

    if (!widget) return null;

    let Component: React.ComponentType | null = null;
    switch (widget.type) {
        case WIDGET_TYPES.CLAN_PANEL:
            Component = ClanPanel;
            break;
        case WIDGET_TYPES.MY_ACTIVITY:
            Component = MyActivity;
            break;
        case WIDGET_TYPES.CLAN_HALL:
            Component = ClanHallWidget;
            break;
        case WIDGET_TYPES.UPCOMING_EVENTS:
            Component = UpcomingEvents;
            break;
        case WIDGET_TYPES.EVENT_CALENDAR:
            Component = EventCalendar;
            break;
        case WIDGET_TYPES.ACTIVITY_FEED:
            Component = ActivityFeed;
            break;
        default:
            Component = () => <div>Unknown widget type: {widget.type}</div>;
    }

    if (!isEditing) {
        return <Component/>;
    }

    return (
        <div style={{
            border: '2px dashed rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            marginBottom: '15px',
            position: 'relative',
            background: 'rgba(0, 0, 0, 0.2)'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderTopLeftRadius: '6px',
                borderTopRightRadius: '6px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <span style={{fontSize: '0.8rem', fontWeight: 'bold', color: '#aaa'}}>{widget.type}</span>
                <div style={{display: 'flex', gap: '4px'}}>
                    <button
                        disabled={isFirst}
                        onClick={() => moveWidget(widgetId, areaId, index - 1)}
                        style={{cursor: isFirst ? 'default' : 'pointer', opacity: isFirst ? 0.3 : 1}}
                    >
                        ⬆️
                    </button>
                    <button
                        disabled={isLast}
                        onClick={() => moveWidget(widgetId, areaId, index + 1)}
                        style={{cursor: isLast ? 'default' : 'pointer', opacity: isLast ? 0.3 : 1}}
                    >
                        ⬇️
                    </button>

                    <select
                        style={{background: '#333', color: '#fff', border: 'none', borderRadius: '4px'}}
                        value={areaId}
                        onChange={(e) => moveWidget(widgetId, e.target.value, 0)} // Move to top of target area
                    >
                        {layout.areas.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => removeWidget(widgetId)}
                        style={{
                            background: '#ff4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            cursor: 'pointer'
                        }}
                    >
                        🗑️
                    </button>
                </div>
            </div>
            <div style={{padding: '10px', opacity: 0.7, pointerEvents: 'none'}}>
                <Component/>
            </div>
        </div>
    );
};
