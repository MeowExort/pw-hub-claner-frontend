import React from 'react';
import {useLayout} from './LayoutContext';
import {AreaComponent} from './AreaComponent';
import s from '@/app/styles/Dashboard.module.scss';
import appStyles from '@/app/styles/App.module.scss';

export const DashboardLayout = () => {
    const {layout, isEditing, toggleEditMode, addArea, resetLayout} = useLayout();

    const gridTemplateColumns = layout.areas.map(a => a.width || '1fr').join(' ');

    var edit = (
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <div className={appStyles.pageTitle} style={{margin: 0}}>Дашборд</div>
            <div style={{display: 'flex', gap: '10px'}}>
                <button
                    onClick={toggleEditMode}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: 'none',
                        background: isEditing ? '#4caf50' : '#333',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    {isEditing ? '✓ Готово' : '✏️ Редактировать макет'}
                </button>
                {isEditing && (
                    <>
                        <button
                            onClick={() => addArea('New Area')}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '4px',
                                border: 'none',
                                background: '#2196f3',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            + Область
                        </button>
                        <button
                            onClick={resetLayout}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '4px',
                                border: 'none',
                                background: '#f44336',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            Сброс
                        </button>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div className={s.dashboard}>
            {edit}
            <div className={s.mainContent} style={{gridTemplateColumns}}>
                {layout.areas.map(area => (
                    <AreaComponent key={area.id} area={area}/>
                ))}
            </div>
        </div>
    );
};
