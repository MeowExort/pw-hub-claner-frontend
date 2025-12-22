import {describe, it} from 'vitest';
import {render} from '@/shared/lib/test-utils';
import EventRosterModal from './EventRosterModal';

describe('EventRosterModal', () => {
    it('renders without crashing', () => {
        render(<EventRosterModal eventId="test-id" onClose={() => {
        }}/>);
    });
});