import terrainDataJson from './sector_terrain.json';
import type { SectorTerrainData, TerrainType } from '../types/terrain';

// ============================================================================
// モックJSONを地形ドメインの型として公開するローダ。
// JSONの文字列は string 型に拡張されるため、既知の地形タイプか検査して絞り込む
// （キャストで型の不整合を隠さない）。
// ============================================================================

const TERRAIN_TYPES: readonly TerrainType[] = ['sea', 'shallow', 'wasteland', 'plains', 'mountain'];

function toTerrainType(value: string): TerrainType {
    for (const type of TERRAIN_TYPES) {
        if (type === value) return type;
    }
    throw new Error(`未知の地形タイプです: ${value}`);
}

export const sectorTerrain: SectorTerrainData = {
    ...terrainDataJson,
    terrain_grid: terrainDataJson.terrain_grid.map((row) =>
        row.map((cell) => ({ ...cell, type: toTerrainType(cell.type) }))
    ),
};
