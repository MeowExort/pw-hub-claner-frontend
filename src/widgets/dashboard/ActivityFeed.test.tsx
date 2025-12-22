import {describe, it} from 'vitest';
import {render} from '@/shared/lib/test-utils';
import ActivityFeed from './ActivityFeed';

describe('ActivityFeed', () => {
    it('renders without crashing', () => {
        render(<ActivityFeed/>);
    });
});