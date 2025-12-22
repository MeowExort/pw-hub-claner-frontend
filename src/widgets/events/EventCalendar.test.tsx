import {describe, it, vi} from 'vitest';
import {render} from '@/shared/lib/test-utils';
import EventCalendar from './EventCalendar';

vi.mock('@/shared/model/AppStore', () => ({
    useAppStore: () => ({
        events: [
            {id: '1', type: 'GVG', date: '2025-12-21T19:00:00.000Z', name: 'Test GVG'}
        ],
        refreshAll: vi.fn(),
    }),
}));

vi.mock('@/shared/model/MyActivityStore', () => ({
    useMyActivity: () => ({
        week: '2025-W51',
        setWeek: vi.fn(),
    }),
}));

describe('EventCalendar', () => {
    it('renders without crashing', () => {
        render(<EventCalendar/>);
    });
});