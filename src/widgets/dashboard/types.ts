import React from 'react';

export interface Widget {
    id: string;
    type: string; // 'clan_panel', 'my_activity', etc.
    title?: string;
}

export interface Area {
    id: string;
    name: string;
    width?: string; // CSS grid value like '300px' or '1fr'
    direction: 'column' | 'row';
    widgetIds: string[];
}

export interface LayoutState {
    areas: Area[];
    widgets: Record<string, Widget>; // Actual widget instances data
}

export const WIDGET_TYPES = {
    CLAN_PANEL: 'clan_panel',
    MY_ACTIVITY: 'my_activity',
    CLAN_HALL: 'clan_hall',
    UPCOMING_EVENTS: 'upcoming_events',
    EVENT_CALENDAR: 'event_calendar',
    ACTIVITY_FEED: 'activity_feed',
} as const;
