import {describe, it} from 'vitest';
import {render} from '@/shared/lib/test-utils';
import DashboardPage from './DashboardPage';

describe('DashboardPage', () => {
    it('renders without crashing', () => {
        render(<DashboardPage/>);
    });
});