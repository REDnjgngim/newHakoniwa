import type { Coordinate } from '@/shared/terrain-types';

export type CommandType = 'normal' | 'fast';

export type ReservationCommand = {
    id: string;
    commandCode?: string;
    commandType: CommandType;
    name: string;
    coordinate?: Coordinate;
    summaryText?: string;
    targetIsland?: string;
    stackCount?: number;
    estimatedTurn: number;
    estimatedFundsDelta: number;
    params?: Record<string, string | number | boolean>;
};

export type TabType = 'reservation' | 'log' | 'message';

export type BottomSheetSnap = 'hidden' | 'collapsed' | 'half' | 'expanded' | 'full';
