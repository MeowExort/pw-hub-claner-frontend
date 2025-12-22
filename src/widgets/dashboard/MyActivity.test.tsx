import {describe, it} from 'vitest';
import {render} from '@/shared/lib/test-utils';
import MyActivity from './MyActivity';

describe('MyActivity', () => {
    it('renders without crashing', () => {
        render(<MyActivity/>);
    });
});