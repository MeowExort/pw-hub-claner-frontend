import {describe, it} from 'vitest';
import {render} from '@/shared/lib/test-utils';
import Header from './Header';

describe('Header', () => {
    it('renders without crashing', () => {
        render(<Header/>);
    });
});