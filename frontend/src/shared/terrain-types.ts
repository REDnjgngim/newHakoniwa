export type Coordinate = {
    x: number;
    y: number;
};

export type TileCoord = Coordinate;

export type TerrainType = string;

export type TerrainDefinition = {
    type: TerrainType;
    name: string;
    description?: string;
    image?: string;
};

/** 地形種別から表示用の地形定義を引くリゾルバ（ルールごとに注入する） */
export type TerrainResolver = (type: TerrainType) => TerrainDefinition | undefined;

/** UI 表示用に解決した地形情報（未定義の地形は name に種別名が入る） */
export type TerrainDisplay = {
    name: string;
    image?: string;
};

export type TerrainCell = {
    type: TerrainType;
    has_impact_mark?: boolean;
};

export type LayerDefinition = {
    id: number;
    name: string;
    order: number;
    category?: string;
};

export type MapObject = {
    id: string;
    coordinate: Coordinate;
    layerId: number;
    objectType: string;
    scale?: number;
    level?: number;
};

export type Unit = {
    id: string;
    coordinate: Coordinate;
    layerId: number;
    category: string;
    unitTypeId: string;
    hp?: number;
};

export type SectorData = {
    sector_id: number;
    map_width: number;
    map_height: number;
    terrain_grid: TerrainCell[][];
    objects: MapObject[];
    units: Unit[];
    /** このセクター（マップ）で有効なレイヤー一覧 */
    layers?: LayerDefinition[];
};

// 後方互換用エイリアス（既存コード・テストが SectorTerrainData を参照し続けるため）
export type SectorTerrainData = SectorData;
