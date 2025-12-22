import {describe, it} from 'vitest';
import {render} from '@/shared/lib/test-utils';
import ClanStats from './ClanStats';

describe('ClanStats', () => {
    it('renders without crashing', () => {
        render(<ClanStats/>);
    });
});