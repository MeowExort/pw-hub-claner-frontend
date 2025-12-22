import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from '@/app/App';
import './styles/global.scss';

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing');
const root = createRoot(container);

root.render(
    <BrowserRouter>
        <App/>
    </BrowserRouter>
);
