import type { SectorTerrainData } from '@/shared/terrain-types';
import { applyCanvasRenderOptions, calcTileRenderSize } from './canvas';
import { tileToPixel } from './geometry';
import type { BuildTerrainCacheParams, ResolvedMapSettings, TerrainCache } from './types';

export function buildTerrainCache(params: BuildTerrainCacheParams): TerrainCache {
    const { sector, settings, images } = params;
    const { map_width, map_height, terrain_grid } = sector;
    const { theme, renderOptions, tileSize: baseTileSize } = settings.view;

    const width = (map_width + 0.5) * baseTileSize;
    const height = map_height * baseTileSize;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return { canvas, width, height, tileSize: baseTileSize };
    }

    applyCanvasRenderOptions(ctx, renderOptions);

    const tileSize = baseTileSize;
    const renderSize = calcTileRenderSize(tileSize, renderOptions);

    for (let y = 0; y < map_height; y++) {
        for (let x = 0; x < map_width; x++) {
            const terrain = terrain_grid[y]?.[x];
            const imgSrc = terrain ? settings.images[terrain.type] : undefined;
            const img = imgSrc ? images.get(imgSrc) : undefined;

            const { px, py } = tileToPixel(x, y, { offsetX: 0, offsetY: 0, scale: 1 }, baseTileSize);
            const drawX = px - tileSize / 2;
            const drawY = py - tileSize / 2;

            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, drawX, drawY, renderSize, renderSize);
            } else {
                ctx.fillStyle = theme.fallbackBg;
                ctx.fillRect(drawX, drawY, renderSize, renderSize);
                ctx.strokeStyle = theme.fallbackBorder;
                ctx.strokeRect(drawX, drawY, renderSize, renderSize);
            }
        }
    }

    return { canvas, width, height, tileSize: baseTileSize };
}

export function getTerrainCacheKey(
    sector: SectorTerrainData,
    settings: ResolvedMapSettings,
    images: ReadonlyMap<string, HTMLImageElement>
): string {
    return `${sector.map_width}x${sector.map_height}:${Object.keys(settings.images).join(',')}:${images.size}`;
}
