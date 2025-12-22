import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@/shared/lib/test-utils';
import ClansListPage from './ClansListPage';
import * as AppStoreModule from '@/shared/model/AppStore';
import * as AuthContextModule from '@/app/providers/AuthContext';

// Mock the modules
vi.mock('@/shared/model/AppStore', () => ({
    useAppStore: vi.fn(),
}));

vi.mock('@/app/providers/AuthContext', async () => {
    return {
        useAuth: vi.fn(),
        AuthProvider: ({children}: { children: React.ReactNode }) => <div>{children}</div>,
    };
});

describe('ClansListPage', () => {
    const mockListClans = vi.fn();
    const mockApplyToClan = vi.fn();

    const mockUser = {
        id: 'user1',
        username: 'testuser',
        characters: [
            {id: 'char1', name: 'Hero', server: 'Server1', clanId: null}
        ],
        mainCharacterId: 'char1'
    };

    const mockClans = [
        {
            id: 'clan-none',
            name: 'Clan No App',
            server: 'Server1',
            icon: '🏰',
            description: 'Desc',
            members: [],
            applications: []
        },
        {
            id: 'clan-pending',
            name: 'Clan Pending',
            server: 'Server1',
            icon: '⏳',
            description: 'Desc',
            members: [],
            applications: [
                {id: 'app1', characterId: 'char1', status: 'PENDING'}
            ]
        },
        {
            id: 'clan-rejected',
            name: 'Clan Rejected',
            server: 'Server1',
            icon: '❌',
            description: 'Desc',
            members: [],
            applications: [
                {id: 'app2', characterId: 'char1', status: 'REJECTED'}
            ]
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup mock implementations
        // @ts-ignore
        AppStoreModule.useAppStore.mockReturnValue({
            listClans: mockListClans,
            applyToClan: mockApplyToClan
        });

        // @ts-ignore
        AuthContextModule.useAuth.mockReturnValue({
            user: mockUser
        });

        mockListClans.mockResolvedValue(mockClans);
    });

    it('displays correct button states for different application statuses', async () => {
        render(<ClansListPage/>);

        // Wait for clans to load
        await waitFor(() => {
            expect(screen.getByText('Clan No App')).toBeInTheDocument();
        });

        // 1. No application -> "Подать заявку"
        const applyBtn = screen.getAllByText('Подать заявку')[0];
        expect(applyBtn).toBeInTheDocument();
        expect(applyBtn).not.toBeDisabled();

        // 2. Pending -> "Заявка отправлена" (disabled)
        const pendingBtn = screen.getByText('Заявка отправлена');
        expect(pendingBtn).toBeInTheDocument();
        expect(pendingBtn).toBeDisabled();

        // 3. Rejected -> "Подать еще раз"
        const rejectedBtn = screen.getByText('Подать еще раз');
        expect(rejectedBtn).toBeInTheDocument();
        expect(rejectedBtn).not.toBeDisabled();
    });

    it('calls applyToClan when "Подать еще раз" is clicked', async () => {
        // Mock prompt
        vi.spyOn(window, 'prompt').mockReturnValue('My msg');

        render(<ClansListPage/>);

        await waitFor(() => {
            expect(screen.getByText('Clan Rejected')).toBeInTheDocument();
        });

        const rejectedBtn = screen.getByText('Подать еще раз');
        fireEvent.click(rejectedBtn);

        expect(mockApplyToClan).toHaveBeenCalledWith('clan-rejected', 'My msg');
    });
});