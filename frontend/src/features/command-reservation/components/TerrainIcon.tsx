import { TERRAIN_IMAGE_MAP } from '@/shared/terrain-images';
import { getTerrainTypeAt } from '@/shared/terrain-lookup';
import type { SectorTerrainData } from '@/shared/terrain-types';
import type { Coordinate } from '@/shared/terrain-types';

export type TerrainIconProps = {
    coordinate?: Coordinate;
    terrain?: SectorTerrainData;
    size?: number;
};

const TERRAIN_LABEL: Record<string, string> = {
    sea: '海',
    shallow: '浅瀬',
    wasteland: '荒地',
    plains: '平野',
    mountain: '山',
};

/** コマンド座標の地形をマップと同じ画像で表示する */
export function TerrainIcon({ coordinate, terrain, size = 20 }: TerrainIconProps) {
    if (!coordinate || !terrain) return null;
    const terrainType = getTerrainTypeAt(terrain, coordinate);
    if (!terrainType) return null;
    const src = TERRAIN_IMAGE_MAP[terrainType];

    return (
        <img
            src={src}
            alt={`地形:${TERRAIN_LABEL[terrainType] ?? terrainType}`}
            width={size}
            height={size}
            draggable={false}
            className="shrink-0 rounded-[3px] border border-slate-700/70 object-cover"
            style={{ width: size, height: size, imageRendering: 'pixelated' }}
        />
    );
}
