import { useCallback, useEffect, useRef, useState } from 'react';
import { toCoordKey, usePresence, type TileCoord } from '@/shared';
import type {
    HoverCell,
    PopupPosition,
    TerrainBubbleTarget,
    UseTerrainBubbleParams,
    UseTerrainBubbleResult,
} from '../engine/types';
import { tileToPixel } from '../engine/geometry';

export function useTerrainBubble({
    terrain_grid,
    viewRef,
    baseTileSize,
    fadeOutDelayMs = 150,
    viewChangeDebounceMs = 100,
}: UseTerrainBubbleParams): UseTerrainBubbleResult {
    const [target, setTarget] = useState<TerrainBubbleTarget | null>(null);
    const viewChangeTimerRef = useRef<number | null>(null);

    const clearViewChangeTimer = useCallback(() => {
        if (viewChangeTimerRef.current !== null) {
            window.clearTimeout(viewChangeTimerRef.current);
            viewChangeTimerRef.current = null;
        }
    }, []);

    const toAnchor = useCallback(
        (coord: TileCoord): PopupPosition => {
            const { px, py } = tileToPixel(coord.x, coord.y, viewRef.current, baseTileSize);
            return { x: px, y: py };
        },
        [viewRef, baseTileSize]
    );

    const onCellHovered = useCallback(
        (cell: HoverCell | null) => {
            if (!cell) {
                setTarget(null);
                return;
            }
            const terrainCell = terrain_grid[cell.y]?.[cell.x];
            if (!terrainCell) return;
            setTarget({ selection: { coord: cell, cell: terrainCell }, anchor: toAnchor(cell) });
        },
        [terrain_grid, toAnchor]
    );

    // パン・ズーム中は毎フレーム再描画せず、操作が落ち着いてから位置を合わせ直す
    const onViewChange = useCallback(() => {
        clearViewChangeTimer();
        viewChangeTimerRef.current = window.setTimeout(() => {
            viewChangeTimerRef.current = null;
            setTarget((prev) => (prev ? { ...prev, anchor: toAnchor(prev.selection.coord) } : prev));
        }, viewChangeDebounceMs);
    }, [toAnchor, viewChangeDebounceMs, clearViewChangeTimer]);

    useEffect(() => clearViewChangeTimer, [clearViewChangeTimer]);

    const bubble = usePresence(target, {
        getKey: (t) => toCoordKey(t.selection.coord),
        exitDurationMs: fadeOutDelayMs,
    });

    return { bubble, onCellHovered, onViewChange };
}
