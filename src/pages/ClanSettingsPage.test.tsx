import {describe, it, vi} from 'vitest';
import {render} from '@/shared/lib/test-utils';
import ClanSettingsPage from './ClanSettingsPage';

const mockClan = {
    id: '1',
    settings: {
        rolePermissions: [],
        obligations: {}
    }
};

// Mock useAppStore
vi.mock('@/shared/model/AppStore', () => ({
    useAppStore: () => ({
        clan: mockClan,
        updateClanSettings: vi.fn(),
        hasPermission: (perm: string) => true
    })
}));

describe('ClanSettingsPage', () => {
    it('renders without crashing', () => {
        render(<ClanSettingsPage/>);
    });
});