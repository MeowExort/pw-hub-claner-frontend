import {describe, it} from 'vitest';
import {render} from '@/shared/lib/test-utils';
import LoginPage from './LoginPage';

describe('LoginPage', () => {
    it('renders without crashing', () => {
        render(<LoginPage/>);
    });
});