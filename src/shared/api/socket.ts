import {io, Socket} from 'socket.io-client';

const env = (import.meta as any).env || {};
const apiUrl = env.VITE_API_URL || 'http://localhost:3000/api';

function deriveWsUrl(): string {
    try {
        const u = new URL(apiUrl);
        // Strip trailing "/api" if present for WS origin
        const hasApiPath = u.pathname.endsWith('/api');
        const wsProtocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
        const origin = `${wsProtocol}//${u.host}`;
        return `${origin}/events`;
    } catch {
        return 'ws://localhost:3000/events';
    }
}

const WS_URL = env.VITE_WS_URL || deriveWsUrl();

export const socket: Socket = io(WS_URL, {
    autoConnect: false,
    transports: ['websocket'],
});
