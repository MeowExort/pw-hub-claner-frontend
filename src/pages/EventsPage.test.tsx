import {describe, it} from 'vitest';
import {render} from '@/shared/lib/test-utils';
import EventsPage from './EventsPage';

describe('EventsPage', () => {
    it('renders without crashing', () => {
        render(<EventsPage/>);
    });
});