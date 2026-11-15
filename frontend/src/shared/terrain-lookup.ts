import type {
    Coordinate,
    SectorTerrainData,
    TerrainCell,
    TerrainDisplay,
    TerrainResolver,
    TerrainType,
} from './terrain-types';

/** 座標のセルを取得する（範囲外は undefined） */
export function getTerrainCellAt(sector: SectorTerrainData, coordinate?: Coordinate): TerrainCell | undefined {
    if (!coordinate) return undefined;
    if (coordinate.x < 0 || coordinate.y < 0) return undefined;
    if (coordinate.x >= sector.map_width || coordinate.y >= sector.map_height) return undefined;
    return sector.terrain_grid[coordinate.y]?.[coordinate.x];
}

/** コマンド座標に対応する地形種別を取得する（範囲外は undefined） */
export function getTerrainTypeAt(sector: SectorTerrainData, coordinate?: Coordinate): TerrainType | undefined {
    return getTerrainCellAt(sector, coordinate)?.type;
}

/** 地形種別を表示用情報に解決する（リゾルバ未指定・未定義の地形は種別名をそのまま使う） */
export function resolveTerrainDisplay(type: TerrainType, resolver?: TerrainResolver): TerrainDisplay {
    const def = resolver?.(type);
    return { name: def?.name ?? type, image: def?.image };
}

/** 座標を一意の文字列キーにする（React key / usePresence の getKey 用） */
export function toCoordKey(coord: Coordinate): string {
    return `${coord.x},${coord.y}`;
}
