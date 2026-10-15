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

/** コマンドの詳細フィールドパターン */
export type CommandDetailPattern =
    | 'missile' // missileCount + 目標の島
    | 'exportAmount' // exportAmount（食料輸出など）
    | 'item' // itemName
    | 'fleet' // fleetName + 移動元島 + 移動先島
    | 'amount' // amount
    | 'scale' // scale
    | 'stack' // stackCount
    | 'coord-only' // 座標のみ、追加フィールドなし
    | 'none'; // フィールドなし

export type TabType = 'reservation' | 'log' | 'message';

export type BottomSheetSnap = 'hidden' | 'collapsed' | 'half' | 'expanded' | 'full';
