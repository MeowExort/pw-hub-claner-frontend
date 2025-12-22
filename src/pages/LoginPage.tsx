import React from 'react';
import {Navigate} from 'react-router-dom';
import {useAuth} from '@/app/providers/AuthContext';
import styles from '@/app/styles/App.module.scss';

export default function LoginPage() {
    const {login, user, loading} = useAuth();

    if (user) return <Navigate to="/"/>;

    return (
        <div style={{display: 'grid', placeItems: 'center', height: '100%'}}>
            <div className="card" style={{width: 360, textAlign: 'center'}}>
                <div className={styles.pageTitle}>PW Hub - Кланер</div>
                <div style={{display: 'grid', gap: 12, marginTop: 20}}>
                    <button className="btn" onClick={() => login()} disabled={loading}>
                        Войти через PW Hub
                    </button>
                </div>
            </div>
        </div>
    );
}
