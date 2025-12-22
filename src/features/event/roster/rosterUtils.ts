import {Squad, Character, ClanMember} from '@/shared/types';

export function addMemberToSquad(
    squads: Squad[],
    squadId: string,
    characterId: string,
    rosterMap: Record<string, Character & ClanMember>
): Squad[] {
    return squads.map(s => {
        // Handle target squad
        if (s.id === squadId) {
            if (s.members.includes(characterId)) return s;

            const char = rosterMap[characterId];
            const isPL = char?.role === 'PL';

            // Logic: if squad has no leader and char is PL, they become leader
            const shouldBecomeLeader = s.leaderId === '' && isPL;
            const newLeaderId = shouldBecomeLeader ? characterId : s.leaderId;

            // Logic: if they become leader, they go to the top (prepend)
            // Otherwise, append to end
            const newMembers = shouldBecomeLeader
                ? [characterId, ...s.members]
                : [...s.members, characterId];

            return {...s, members: newMembers, leaderId: newLeaderId};
        }

        // Handle source squad (remove character if present)
        if (s.members.includes(characterId)) {
            const newMembers = s.members.filter(m => m !== characterId);
            const newLeaderId = s.leaderId === characterId ? '' : s.leaderId;
            return {...s, members: newMembers, leaderId: newLeaderId};
        }

        return s;
    });
}
