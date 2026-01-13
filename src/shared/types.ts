// Domain types per spec
export type CharacterClass =
    | 'Воин' | 'Маг' | 'Стрелок'
    | 'Оборотень' | 'Друид' | 'Странник'
    | 'Лучник' | 'Жрец' | 'Паладин'
    | 'Убийца' | 'Шаман' | 'Бард'
    | 'Страж' | 'Мистик' | 'Дух крови'
    | 'Призрак' | 'Жнец';

export type ServerName = 'Центавр' | 'Фенрир' | 'Мицар' | 'Капелла';

export interface Character {
    id: string;
    name: string;
    server: ServerName;
    class: CharacterClass;
    pwobsLink: string;
    gameCharId?: string;
    level: number; // Not explicitly asked but good to keep, maybe derived or just default 1

    // Stats
    minAttack: number;
    maxAttack: number;
    critChance: number;
    critDamage: number; // default 200
    spirit: number; // Боевой дух
    physPenetration: number;
    magPenetration: number;
    levelBonus: number;
    chanting: number; // Пение
    atkPerSec: number;
    attackLevel: number;
    health: number;
    physDef: number;
    magDef: number;
    defenseLevel: number;
    physReduction: number; // %
    magReduction: number; // %
}

export interface User {
    id: string;
    username: string;
    email?: string;
    role?: string;
    characters: Character[];
    mainCharacterId: string;
}

export type ClanRole = 'MASTER' | 'MARSHAL' | 'OFFICER' | 'MEMBER' | 'PL';

export interface ClanMember {
    userId: string;
    characterId: string;
    name?: string;
    class?: CharacterClass;
    role: ClanRole;
    joinDate: string; // ISO
}

export interface RolePermissions {
    role: ClanRole;
    permissions: string[]; // simple list of permission keys
}

export interface CustomEventTemplate {
    id: string;
    name: string;
    icon?: string;
    description?: string;
}

export interface ClanSettings {
    rolePermissions: RolePermissions[];
    customEvents: CustomEventTemplate[];
    // PVP & obligations configuration
    pvpDefaultRallyOffsetMinutes?: number; // default rally offset before start, minutes (default 30)
    obligations?: {
        rhythmRequired: boolean; // "танцы" (RHYTHM) required to be shown in My Activity if not attended
        forbiddenKnowledge: {
            required: boolean;
            // thresholds for classifying weekly result; inclusive lower-bounds
            // bad: [badFrom, normalFrom)
            // normal: [normalFrom, goodFrom)
            // good: [goodFrom, +inf)
            badFrom: number; // default 0
            normalFrom: number; // default 1
            goodFrom: number; // default 3
        };
        clanHall: {
            required: boolean;
            // Stages that must be attended specifically on the day they are open
            requiredStagesSameDay: ClanHallStage[]; // subset of 1..7
        };
    };
}

export interface ClanApplication {
    id: string;
    userId: string;
    characterId: string;
    message: string;
    createdDate: string; // ISO
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Clan {
    id: string;
    name: string;
    server: ServerName;
    icon: string; // url or emoji
    description: string;
    members: ClanMember[];
    applications: ClanApplication[];
    settings: ClanSettings;
    weekIso?: string;
    totalValor?: number;
    createdAt?: string;
    updatedAt?: string;
}

export type EventType =
    | 'CLAN_HALL'
    | 'RHYTHM'
    | 'FORBIDDEN_KNOWLEDGE'
    | 'SADEMAN'
    | 'MTV' // межсерверная территория (PVP), always Saturday 20:00-21:00
    | 'GVG' // внутри сервера (PVP), allowed slots Sun 20:00 / Sun 22:00 / Thu 22:00
    | 'CUSTOM';
export type EventStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED';

export interface EventParticipant {
    id?: string;
    eventId?: string;
    characterId: string;
    status: 'GOING' | 'NOT_GOING' | 'UNDECIDED';
    attendance?: boolean;
    valor?: number;
}

export interface Squad {
    id: string;
    name: string;
    leaderId: string; // characterId
    members: string[]; // characterIds
}

export interface ClanEvent {
    id: string;
    contextId?: string;
    clanId?: string; // made optional as it's missing in some JSON views if context is implied
    type: EventType;
    name: string;
    date: string; // ISO
    description?: string;
    participants: EventParticipant[];
    squads?: Squad[]; // JSON shows it, but might be missing
    status: EventStatus;
    // Мок-флаг загрузки отчёта для событий, где это применимо (например, RHYTHM)
    reportUploaded?: boolean;
    // PVP-specific fields
    // Opponent can be a known clan (id) or free-text name if not in list
    opponent?: { clanId?: string; name: string } | string | null; // JSON has "opponent": "xyi" (string) or null
    // Rally time (ISO). If absent for PVP, UI should derive from pvpDefaultRallyOffsetMinutes
    rallyTime?: string;
    createdAt?: string;
    updatedAt?: string;
    updatedBy?: string;
}

export interface AppState {
    users: User[];
    clans: Clan[];
    events: ClanEvent[];
    session: { userId?: string };
}

export type ThemeName = 'blue' | 'purple' | 'teal' | 'orange' | 'pink' | 'green';

// My Activity domain (mocked backend payload)
export type MyActivityStatus = 'COMPLETED' | 'GOING' | 'MISSED' | 'NONE';

export interface MyActivityData {
    characterId: string;
    rhythm?: { status: MyActivityStatus; valor: number };
    forbiddenKnowledge?: { circles: number; valor: number };
    clanHall?: {
        availableStage: number;
        stageCounts: Record<string, number>;
        stageCloses: Record<string, any>;
        dailyStagesMap: Record<string, number>;
        attendedStages: number[];
        history?: { stage: number; date: string }[];
        nextStage: number;
    };
    events?: ClanEvent[];
}

// Allowed time slot hints for PVP scheduling (for UI validation/documentation)
export const MTV_SLOT_HINT = 'Saturday 20:00-21:00';
export const GVG_SLOTS_HINT = [
    'Sunday 20:00',
    'Sunday 22:00',
    'Thursday 22:00'
] as const;

// Clan Hall progress (weekly history)
export type ClanHallStage = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ClanHallProgress {
    weekIso: string; // e.g. 2025-W48
    stageChecks: Record<ClanHallStage, number>; // number of valid checks per stage
}

export interface AuditLog {
    id: string;
    clanId: string;
    actorId: string | null;
    actor?: {
        id: string;
        name: string;
        class: string;
    };
    action: string;
    target: string | null;
    details: any;
    createdAt: string; // ISO
}

export interface WeeklyStats {
    characterId: string;
    name?: string;
    class?: CharacterClass;
    khAttendedDates: string[];
    khHistory: { stage: number; date: string }[];
    rhythmValor: number;
    zuCircles: number;
    zuValor: number;
    khValor: number;
    totalValor: number;
}
