import { useCallback, type RefObject } from 'react';
import type { SectorTerrainData } from '../../types/terrain';
import type { AnimationLoopController, OnSelectTile, TileCoord } from '../types';

// ============================================================================
// タイル選択の確定処理を提供するフック。onSelect 通知・
// カーソル演出（パルス）の開始をまとめて行う。
// ============================================================================

export interface TileSelectionParams {
    selectedTileRef: RefObject<TileCoord | null>;
    cursorAnimStartRef: RefObject<number>;
    cursorLoop: AnimationLoopController;
    terrain_grid: SectorTerrainData['terrain_grid'];
    onSelect?: OnSelectTile;
}

export interface TileSelectionResult {
    handleTileConfirm: (tile: TileCoord) => void;
}

export function useTileSelection(params: TileSelectionParams): TileSelectionResult {
    const { selectedTileRef, cursorAnimStartRef, cursorLoop, terrain_grid, onSelect } = params;

    const handleTileConfirm = useCallback(
        (tile: TileCoord) => {
            selectedTileRef.current = tile;

            // セルが取得できない場合は通知しない
            const cell = terrain_grid[tile.y]?.[tile.x];
            if (cell) onSelect?.({ coord: tile, cell });

            cursorAnimStartRef.current = performance.now();
            cursorLoop.start();
        },
        [selectedTileRef, cursorAnimStartRef, cursorLoop, terrain_grid, onSelect]
    );

    return { handleTileConfirm };
}
