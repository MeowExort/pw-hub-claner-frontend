import {describe, it, vi} from 'vitest';
import {render} from '@/shared/lib/test-utils';
import ClanPanel from './ClanPanel';

vi.mock('@/shared/model/AppStore', () => ({
    useAppStore: () => ({
        clan: {
            id: '123',
            name: 'Test Clan',
            members: [],
            settings: {}
        },
        events: [],
        resolveCharacterNames: async () => ({}),
        hasPermission: () => true
    }),
}));

describe('ClanPanel', () => {
    it('renders without crashing', () => {
        render(<ClanPanel/>);
    });
});