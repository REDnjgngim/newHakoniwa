import React from 'react';
import { TERRAIN_IMAGE_MAP } from '../../constants/terrain';
import { sectorTerrain } from '../../mocks/sector-terrain';
import { getTerrainTypeAt } from '../../map/terrain-lookup';
import type { Coordinate } from '../../types/command-reservation';

export interface TerrainIconProps {
    coordinate?: Coordinate;
    size?: number;
}

const TERRAIN_LABEL: Record<string, string> = {
    sea: '海',
    shallow: '浅瀬',
    wasteland: '荒地',
    plains: '平野',
    mountain: '山',
};

/** コマンド座標の地形をマップと同じ画像で表示する */
export const TerrainIcon: React.FC<TerrainIconProps> = ({ coordinate, size = 20 }) => {
    if (!coordinate) return null;
    const terrainType = getTerrainTypeAt(sectorTerrain, coordinate);
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
};
