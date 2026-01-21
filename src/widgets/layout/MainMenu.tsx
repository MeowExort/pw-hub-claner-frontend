import React from 'react';
import {NavLink} from 'react-router-dom';
import styles from '@/app/styles/App.module.scss';
import {useAppStore} from '@/shared/model/AppStore';
import {useAuth} from '@/app/providers/AuthContext';

export default function MainMenu() {
    const {clan, hasPermission} = useAppStore();
    const {user} = useAuth();

    if (!clan) {
        return (
            <nav className={styles.menu}>
                <NavLink to="/clans"
                         className={({isActive}) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>Кланы</NavLink>
                <NavLink to="/settings/general"
                         className={({isActive}) => isActive || window.location.pathname.startsWith('/settings') ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>Настройки</NavLink>
                {user?.role === 'ADMIN' && (
                    <>
                        <NavLink to="/admin/stats"
                                 className={({isActive}) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>Статистика</NavLink>
                        <NavLink to="/admin/clans"
                                 className={({isActive}) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>Кланы (А)</NavLink>
                    </>
                )}
            </nav>
        );
    }

    return (
        <nav className={styles.menu}>
            <NavLink to="/dashboard"
                     className={({isActive}) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>Дашборд</NavLink>
            <NavLink to="/events"
                     className={({isActive}) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>События</NavLink>
            <NavLink to="/clan" end
                     className={({isActive}) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>Состав</NavLink>
            <NavLink to="/clan/summary"
                     className={({isActive}) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>Сводка</NavLink>
            {hasPermission('CAN_EDIT_SETTINGS') && (
                <NavLink to="/clan/settings"
                         className={({isActive}) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>Настр.
                    клана</NavLink>
            )}
            {user?.role === 'ADMIN' && (
                <>
                    <NavLink to="/admin/stats"
                             className={({isActive}) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>Статистика</NavLink>
                    <NavLink to="/admin/clans"
                             className={({isActive}) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>Кланы (А)</NavLink>
                    <NavLink to="/system/tasks"
                             className={({isActive}) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>Задачи</NavLink>
                    <NavLink to="/system/populate"
                             className={({isActive}) => isActive ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>БД</NavLink>
                </>
            )}
            <NavLink to="/settings/general"
                     className={({isActive}) => isActive || window.location.pathname.startsWith('/settings') ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem}>Настройки</NavLink>
        </nav>
    );
}
