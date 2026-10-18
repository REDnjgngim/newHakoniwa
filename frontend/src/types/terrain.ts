export type TerrainType = 'sea' | 'shallow' | 'wasteland' | 'plains' | 'mountain';

export type TerrainCell = {
    type: TerrainType;
    has_impact_mark?: boolean;
};

export type SectorTerrainData = {
    sector_id: number;
    map_width: number;
    map_height: number;
    terrain_grid: TerrainCell[][];
};
