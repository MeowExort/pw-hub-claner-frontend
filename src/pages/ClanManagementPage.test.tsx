import {describe, it, vi} from 'vitest';
import {render} from '@/shared/lib/test-utils';
import ClanManagementPage from './ClanManagementPage';

vi.mock('@/shared/model/AppStore', () => ({
    useAppStore: () => ({
        clan: {id: '1', name: 'Test', members: []},
        leaveClan: vi.fn(),
        getClanRoster: vi.fn().mockResolvedValue([]),
        getApplications: vi.fn().mockResolvedValue([]),
        resolveCharacterNames: vi.fn().mockResolvedValue({}),
        processApplication: vi.fn(),
        hasPermission: () => true
    }),
}));

describe('ClanManagementPage', () => {
    it('renders without crashing', () => {
        render(<ClanManagementPage/>);
    });
});