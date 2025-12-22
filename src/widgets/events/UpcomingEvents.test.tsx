import {describe, it} from 'vitest';
import {render} from '@/shared/lib/test-utils';
import UpcomingEvents from './UpcomingEvents';

describe('UpcomingEvents', () => {
    it('renders without crashing', () => {
        render(<UpcomingEvents/>);
    });
});