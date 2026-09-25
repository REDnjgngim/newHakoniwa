export type TerrainType = 'sea' | 'shallow' | 'wasteland' | 'plains' | 'mountain';

export interface TerrainCell {
    type: TerrainType;
    has_impact_mark?: boolean;
}

export interface SectorTerrainData {
    sector_id: number;
    map_width: number;
    map_height: number;
    terrain_grid: TerrainCell[][];
}
