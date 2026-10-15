import type { Coordinate } from '../types/command-reservation';
import type { SectorTerrainData, TerrainType } from '../types/terrain';

/** コマンド座標に対応する地形種別を取得する（範囲外は undefined） */
export function getTerrainTypeAt(sector: SectorTerrainData, coordinate?: Coordinate): TerrainType | undefined {
    if (!coordinate) return undefined;
    if (coordinate.x < 0 || coordinate.y < 0) return undefined;
    if (coordinate.x >= sector.map_width || coordinate.y >= sector.map_height) return undefined;
    return sector.terrain_grid[coordinate.y]?.[coordinate.x]?.type;
}
