import {describe, it} from 'vitest';
import {render} from '@/shared/lib/test-utils';
import SettingsPage from './SettingsPage';

describe('SettingsPage', () => {
    it('renders without crashing', () => {
        render(<SettingsPage/>);
    });
});