import React from 'react';
import {Navigate, Route, Routes, useLocation} from 'react-router-dom';
import {AuthProvider, useAuth} from '@/app/providers/AuthContext';
import {ThemeProvider} from '@/app/providers/ThemeContext';
import {ToastProvider} from '@/app/providers/ToastContext';
import {AppStoreProvider} from '@/shared/model/AppStore';
import {MyActivityProvider} from '@/shared/model/MyActivityStore';
import {useAppStore} from '@/shared/model/AppStore';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ClanManagementPage from '@/pages/ClanManagementPage';
import ClanSettingsPage from '@/pages/ClanSettingsPage';
import EventsPage from '@/pages/EventsPage';
import SettingsPage from '@/pages/SettingsPage';
import CharacterCreationPage from '@/pages/CharacterCreationPage';
import ClansListPage from '@/pages/ClansListPage';
import PublicProfilePage from '@/pages/PublicProfilePage';
import ClanAuditPage from '@/pages/ClanAuditPage';
import WeeklySummaryPage from '@/pages/WeeklySummaryPage';
import SystemTasksPage from '@/pages/SystemTasksPage';
import AdminStatsPage from '@/pages/AdminStatsPage';
import AdminClansPage from '@/pages/AdminClansPage';
import PopulateDbPage from '@/pages/PopulateDbPage';
import styles from './styles/App.module.scss';
import Header from '@/widgets/layout/Header';
import MainMenu from '@/widgets/layout/MainMenu';

function ProtectedRoute({children}: { children: React.ReactNode }) {
    const {user, loading} = useAuth();
    const location = useLocation();

    if (loading) return <div className={styles.loading}>Загрузка...</div>;

    if (!user) return <Navigate to="/login" replace/>;

    if (user.characters.length === 0 && location.pathname !== '/create-character') {
        return <Navigate to="/create-character" replace/>;
    }

    return <>{children}</>;
}

function RequireClan({children}: { children: React.ReactNode }) {
    const {clan, loading} = useAppStore();
    if (loading) return <div className={styles.loading}>Загрузка...</div>;
    if (!clan) return <Navigate to="/clans" replace/>;
    return <>{children}</>;
}

function RequireNoClan({children}: { children: React.ReactNode }) {
    const {clan, loading} = useAppStore();
    if (loading) return <div className={styles.loading}>Загрузка...</div>;
    if (clan) return <Navigate to="/" replace/>;
    return <>{children}</>;
}

function RequireAdmin({children}: { children: React.ReactNode }) {
    const {user, loading} = useAuth();
    if (loading) return <div className={styles.loading}>Загрузка...</div>;
    if (user?.role !== 'ADMIN') return <Navigate to="/" replace/>;
    return <>{children}</>;
}

function RootRedirector() {
    const {clan, loading} = useAppStore();
    if (loading) return <div className={styles.loading}>Загрузка...</div>;
    if (clan) return <Navigate to="/dashboard" replace/>;
    return <Navigate to="/clans" replace/>;
}

function Shell() {
    const {user} = useAuth();
    const {clan} = useAppStore(); // To show menu only if clan exists

    return (
        <div className={styles.appRoot}>
            <header className={styles.topBar}>
                <div className={styles.container}>
                    <Header/>
                </div>
            </header>
            {user && user.characters.length > 0 && (
                <div className={styles.mainMenu}>
                    <div className={styles.container}>
                        <MainMenu/>
                    </div>
                </div>
            )}
            <main className={styles.contentWrap}>
                <div className={styles.container}>
                    <Routes>
                        <Route path="/" element={<ProtectedRoute><RootRedirector/></ProtectedRoute>}/>
                        <Route path="/dashboard"
                               element={<ProtectedRoute><RequireClan><DashboardPage/></RequireClan></ProtectedRoute>}/>
                        <Route path="/events"
                               element={<ProtectedRoute><RequireClan><EventsPage/></RequireClan></ProtectedRoute>}/>
                        <Route path="/clan" element={
                            <ProtectedRoute><RequireClan><ClanManagementPage/></RequireClan></ProtectedRoute>}/>
                        <Route path="/clan/settings" element={
                            <ProtectedRoute><RequireClan><ClanSettingsPage/></RequireClan></ProtectedRoute>}/>
                        <Route path="/clan/audit"
                               element={<ProtectedRoute><RequireClan><ClanAuditPage/></RequireClan></ProtectedRoute>}/>
                        <Route path="/clan/summary" element={
                            <ProtectedRoute><RequireClan><WeeklySummaryPage/></RequireClan></ProtectedRoute>}/>
                        <Route path="/clans" element={
                            <ProtectedRoute><RequireNoClan><ClansListPage/></RequireNoClan></ProtectedRoute>}/>
                        <Route path="/admin/stats" element={
                            <ProtectedRoute><RequireAdmin><AdminStatsPage/></RequireAdmin></ProtectedRoute>}/>
                        <Route path="/admin/clans" element={
                            <ProtectedRoute><RequireAdmin><AdminClansPage/></RequireAdmin></ProtectedRoute>}/>
                        <Route path="/system/tasks" element={
                            <ProtectedRoute><RequireAdmin><SystemTasksPage/></RequireAdmin></ProtectedRoute>}/>
                        <Route path="/system/populate" element={
                            <ProtectedRoute><RequireAdmin><PopulateDbPage/></RequireAdmin></ProtectedRoute>}/>
                        <Route path="/settings" element={<ProtectedRoute><SettingsPage/></ProtectedRoute>}/>
                        <Route path="/create-character"
                               element={<ProtectedRoute><CharacterCreationPage/></ProtectedRoute>}/>
                        <Route path="/login" element={<LoginPage/>}/>
                        <Route path="/profile/:id" element={<PublicProfilePage/>}/>
                        <Route path="/c/:id" element={<PublicProfilePage/>}/>
                        <Route path="*" element={<Navigate to="/" replace/>}/>
                    </Routes>
                </div>
            </main>
        </div>
    );
}

function ContextWrapper({children}: { children: React.ReactNode }) {
    const {user} = useAuth();
    // Force re-mount of stores when character changes to clear context
    const key = user?.mainCharacterId ?? 'guest';

    return (
        <AppStoreProvider key={key}>
            <MyActivityProvider key={key}>
                {children}
            </MyActivityProvider>
        </AppStoreProvider>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <ToastProvider>
                <AuthProvider>
                    <ContextWrapper>
                        <Shell/>
                    </ContextWrapper>
                </AuthProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}
