import React, {useState} from 'react';
import {Area} from './types';
import {useLayout} from './LayoutContext';
import {WidgetWrapper} from './WidgetWrapper';

interface Props {
    area: Area;
}

export const AreaComponent: React.FC<Props> = ({area}) => {
    const {isEditing, removeArea, updateArea, addWidget, availableWidgets} = useLayout();
    const [selectedWidgetToAdd, setSelectedWidgetToAdd] = useState(availableWidgets[0]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateArea(area.id, {name: e.target.value});
    };

    const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateArea(area.id, {width: e.target.value});
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: area.direction,
            gap: '20px',
            height: 'fit-content',
            // In edit mode, show border
            border: isEditing ? '2px dashed rgba(255, 255, 255, 0.1)' : 'none',
            padding: isEditing ? '10px' : '0',
            borderRadius: '10px',
            background: isEditing ? 'rgba(0,0,0,0.1)' : 'transparent',
            position: 'relative'
        }}>
            {isEditing && (
                <div style={{
                    marginBottom: '15px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingBottom: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px'
                }}>
                    <div style={{display: 'flex', gap: '10px'}}>
                        <input
                            value={area.name}
                            onChange={handleNameChange}
                            style={{background: '#222', border: '1px solid #444', color: 'white', padding: '4px'}}
                            placeholder="Area Name"
                        />
                        <input
                            value={area.width || ''}
                            onChange={handleWidthChange}
                            style={{
                                background: '#222',
                                border: '1px solid #444',
                                color: 'white',
                                padding: '4px',
                                width: '80px'
                            }}
                            placeholder="Width (e.g. 300px)"
                        />
                        <select
                            value={area.direction}
                            onChange={(e) => updateArea(area.id, {direction: e.target.value as 'row' | 'column'})}
                            style={{background: '#222', border: '1px solid #444', color: 'white'}}
                        >
                            <option value="column">Column</option>
                            <option value="row">Row</option>
                        </select>
                        <button onClick={() => removeArea(area.id)}
                                style={{background: 'red', color: 'white', border: 'none', cursor: 'pointer'}}>Delete
                            Area
                        </button>
                    </div>

                    <div style={{display: 'flex', gap: '5px', marginTop: '5px'}}>
                        <select
                            value={selectedWidgetToAdd}
                            onChange={(e) => setSelectedWidgetToAdd(e.target.value)}
                            style={{background: '#333', color: 'white', border: 'none'}}
                        >
                            {availableWidgets.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                        <button onClick={() => addWidget(selectedWidgetToAdd, area.id)}>+ Add Widget</button>
                    </div>
                </div>
            )}

            {area.widgetIds.map((widgetId, index) => (
                <WidgetWrapper
                    key={widgetId}
                    widgetId={widgetId}
                    areaId={area.id}
                    index={index}
                    isFirst={index === 0}
                    isLast={index === area.widgetIds.length - 1}
                />
            ))}

            {area.widgetIds.length === 0 && isEditing && (
                <div style={{padding: '20px', textAlign: 'center', color: '#666'}}>Empty Area</div>
            )}
        </div>
    );
};
