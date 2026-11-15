import { getClassicTerrain } from '@/rules/classic';
import { TERRAIN_IMAGE_MAP } from '@/shared/terrain-images';
import { getTerrainTypeAt } from '@/shared/terrain-lookup';
import type { Coordinate, SectorTerrainData } from '@/shared/terrain-types';

export type TerrainIconProps = {
    coordinate?: Coordinate;
    terrain?: SectorTerrainData;
    size?: number;
};

/** コマンド座標の地形をマップと同じ画像で表示する */
export function TerrainIcon({ coordinate, terrain, size = 20 }: TerrainIconProps) {
    if (!coordinate || !terrain) return null;
    const terrainType = getTerrainTypeAt(terrain, coordinate);
    if (!terrainType) return null;

    const terrainDef = getClassicTerrain(terrainType);
    const src = terrainDef?.image ?? TERRAIN_IMAGE_MAP[terrainType];
    const label = terrainDef?.name ?? terrainType;

    return (
        <img
            src={src}
            alt={`地形:${label}`}
            width={size}
            height={size}
            draggable={false}
            className="shrink-0 rounded-[3px] border border-slate-700/70 object-cover"
            style={{ width: size, height: size, imageRendering: 'pixelated' }}
        />
    );
}
