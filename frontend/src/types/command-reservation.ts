export type CommandType = 'normal' | 'fast';

export interface Coordinate {
    x: number;
    y: number;
}

export interface ReservationCommand {
    id: string;
    order: number;
    commandType: CommandType;
    name: string;
    coordinate?: Coordinate;
    summaryText?: string;
    targetIsland?: string;
    stackCount?: number;
    estimatedTurn: number;
    estimatedFundsDelta: number;
    params?: Record<string, string | number | boolean>;
}

export type TabType = 'reservation' | 'log' | 'message';

export type BottomSheetSnap = 'collapsed' | 'half' | 'expanded';
