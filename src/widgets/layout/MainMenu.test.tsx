import {describe, it} from 'vitest';
import {render} from '@/shared/lib/test-utils';
import MainMenu from './MainMenu';

describe('MainMenu', () => {
    it('renders without crashing', () => {
        render(<MainMenu/>);
    });
});