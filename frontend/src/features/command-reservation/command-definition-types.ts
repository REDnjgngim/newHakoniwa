import type { Coordinate, SectorData, TerrainType } from '@/shared/terrain-types';

// パラメータのスキーマ種別
export type ParameterKind = 'slider' | 'island-select';

// スライダー型パラメータの定義
export type SliderParamSchema = {
    kind: 'slider';
    key: string; // params に格納するキー名（例: 'missileCount'）
    label: string; // 表示ラベル（例: '発射数'）
    min: number;
    max: number;
    /** スライダーの整数値を実際の値に変換するスケール係数。デフォルト1 */
    scale?: number;
    /** 表示用単位ラベル（例: 'トン'、'億円'）*/
    unit?: string;
};

// 島選択型パラメータの定義
export type SelectParamSchema = {
    kind: 'island-select';
    key: string; // params に格納するキー名
    label: string; // 表示ラベル
    labelSuffix: string; // IslandSearchSelect の labelSuffix
};

export type ParameterSchema = SliderParamSchema | SelectParamSchema;

export type CommandExecutionContext = {
    sector: SectorData;
    coordinate?: Coordinate;
};

// コマンド定義
export type CommandDefinition = {
    commandCode: string; // 一意の識別子（例: 'MISSILE', 'EXPORT_FOOD'）
    name: string; // 表示名（例: '通常ミサイル'）
    commandType: 'normal' | 'fast';
    hasCoordinate: boolean; // 座標を持つか
    parameterSchemas: ParameterSchema[]; // パラメータ定義のリスト（順序が表示順）
    estimatedTurn: number;
    estimatedFundsDelta: number;
    cost: number;
    allowedTerrains?: TerrainType[];
    allowedObjects?: string[];
    requiresNoObject?: boolean;
};
