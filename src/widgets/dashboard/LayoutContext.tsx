import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {Area, LayoutState, Widget, WIDGET_TYPES} from './types';

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

const DEFAULT_LAYOUT: LayoutState = {
    areas: [
        {
            id: 'area-sidebar',
            name: 'Левая колонка',
            width: '300px',
            direction: 'column',
            widgetIds: ['w-clan-panel', 'w-clan-hall']
        },
        {
            id: 'area-main',
            name: 'Основная область',
            width: '1fr',
            direction: 'column',
            widgetIds: ['w-calendar', 'w-my-activity', 'w-upcoming', 'w-feed']
        }
    ],
    widgets: {
        'w-clan-panel': {id: 'w-clan-panel', type: WIDGET_TYPES.CLAN_PANEL},
        'w-my-activity': {id: 'w-my-activity', type: WIDGET_TYPES.MY_ACTIVITY},
        'w-clan-hall': {id: 'w-clan-hall', type: WIDGET_TYPES.CLAN_HALL},
        'w-upcoming': {id: 'w-upcoming', type: WIDGET_TYPES.UPCOMING_EVENTS},
        'w-calendar': {id: 'w-calendar', type: WIDGET_TYPES.EVENT_CALENDAR},
        'w-feed': {id: 'w-feed', type: WIDGET_TYPES.ACTIVITY_FEED},
    }
};

interface LayoutContextType {
    layout: LayoutState;
    isEditing: boolean;
    toggleEditMode: () => void;
    addArea: (name: string) => void;
    removeArea: (areaId: string) => void;
    updateArea: (areaId: string, updates: Partial<Area>) => void;
    addWidget: (type: string, areaId: string) => void;
    removeWidget: (widgetId: string) => void;
    moveWidget: (widgetId: string, targetAreaId: string, index: number) => void;
    resetLayout: () => void;
    availableWidgets: string[];
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({children}) => {
    const [layout, setLayout] = useState<LayoutState>(DEFAULT_LAYOUT);
    const [isEditing, setIsEditing] = useState(false);

    // Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('dashboard_layout_v3');
        if (saved) {
            try {
                setLayout(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load layout', e);
            }
        }
    }, []);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('dashboard_layout_v3', JSON.stringify(layout));
    }, [layout]);

    const toggleEditMode = () => setIsEditing(prev => !prev);

    const addArea = (name: string) => {
        const newArea: Area = {
            id: `area-${generateId()}`,
            name,
            width: '1fr',
            direction: 'column',
            widgetIds: []
        };
        setLayout(prev => ({
            ...prev,
            areas: [...prev.areas, newArea]
        }));
    };

    const removeArea = (areaId: string) => {
        setLayout(prev => {
            // Find widgets in this area and remove them? Or move them to "orphan"?
            // For simplicity, let's just remove them for now, or better, warn user.
            // Implemeting simple removal.
            const area = prev.areas.find(a => a.id === areaId);
            if (!area) return prev;

            const newWidgets = {...prev.widgets};
            area.widgetIds.forEach(wid => delete newWidgets[wid]);

            return {
                areas: prev.areas.filter(a => a.id !== areaId),
                widgets: newWidgets
            };
        });
    };

    const updateArea = (areaId: string, updates: Partial<Area>) => {
        setLayout(prev => ({
            ...prev,
            areas: prev.areas.map(a => a.id === areaId ? {...a, ...updates} : a)
        }));
    };

    const addWidget = (type: string, areaId: string) => {
        const newId = `w-${generateId()}`;
        setLayout(prev => {
            const areaIndex = prev.areas.findIndex(a => a.id === areaId);
            if (areaIndex === -1) return prev;

            const newAreas = [...prev.areas];
            newAreas[areaIndex] = {
                ...newAreas[areaIndex],
                widgetIds: [...newAreas[areaIndex].widgetIds, newId]
            };

            return {
                areas: newAreas,
                widgets: {
                    ...prev.widgets,
                    [newId]: {id: newId, type}
                }
            };
        });
    };

    const removeWidget = (widgetId: string) => {
        setLayout(prev => {
            const newAreas = prev.areas.map(area => ({
                ...area,
                widgetIds: area.widgetIds.filter(id => id !== widgetId)
            }));
            const newWidgets = {...prev.widgets};
            delete newWidgets[widgetId];
            return {areas: newAreas, widgets: newWidgets};
        });
    };

    const moveWidget = (widgetId: string, targetAreaId: string, index: number) => {
        setLayout(prev => {
            // 1. Find current area
            const sourceAreaIndex = prev.areas.findIndex(a => a.widgetIds.includes(widgetId));
            if (sourceAreaIndex === -1) return prev;

            // 2. Remove from source
            const sourceArea = prev.areas[sourceAreaIndex];
            const newSourceWidgetIds = sourceArea.widgetIds.filter(id => id !== widgetId);

            // 3. Add to target
            const targetAreaIndex = prev.areas.findIndex(a => a.id === targetAreaId);
            if (targetAreaIndex === -1) return prev; // Should not happen

            // Careful if source == target
            let newTargetWidgetIds = (sourceAreaIndex === targetAreaIndex)
                ? newSourceWidgetIds
                : [...prev.areas[targetAreaIndex].widgetIds];

            // Insert at index
            newTargetWidgetIds.splice(index, 0, widgetId);

            const newAreas = [...prev.areas];
            newAreas[sourceAreaIndex] = {...sourceArea, widgetIds: newSourceWidgetIds}; // Temporary update
            newAreas[targetAreaIndex] = {...newAreas[targetAreaIndex], widgetIds: newTargetWidgetIds}; // Final update (handles same area case implicitly if logic correct?)

            // Actually simpler:
            // If same area: remove then insert.
            // If different: remove from A, insert to B.

            if (sourceAreaIndex === targetAreaIndex) {
                const ids = [...prev.areas[sourceAreaIndex].widgetIds];
                const oldIndex = ids.indexOf(widgetId);
                ids.splice(oldIndex, 1);
                // Adjusted index if we removed before insertion point?
                // index is "target index".
                // logic is complex without dnd lib.
                // Simpler approach: Remove first, then insert.
                ids.splice(index, 0, widgetId);
                newAreas[sourceAreaIndex] = {...prev.areas[sourceAreaIndex], widgetIds: ids};
            } else {
                newAreas[sourceAreaIndex] = {...prev.areas[sourceAreaIndex], widgetIds: newSourceWidgetIds};

                // Re-fetch target widget list because it might have changed if we just modified it? No, different areas.
                const targetIds = [...prev.areas[targetAreaIndex].widgetIds];
                targetIds.splice(index, 0, widgetId);
                newAreas[targetAreaIndex] = {...prev.areas[targetAreaIndex], widgetIds: targetIds};
            }

            return {...prev, areas: newAreas};
        });
    };

    const resetLayout = () => {
        setLayout(DEFAULT_LAYOUT);
        localStorage.removeItem('dashboard_layout_v2');
    };

    const availableWidgets = Object.values(WIDGET_TYPES);

    return (
        <LayoutContext.Provider value={{
            layout,
            isEditing,
            toggleEditMode,
            addArea,
            removeArea,
            updateArea,
            addWidget,
            removeWidget,
            moveWidget,
            resetLayout,
            availableWidgets
        }}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};
