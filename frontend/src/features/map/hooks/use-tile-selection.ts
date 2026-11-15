import { useCallback, useEffect, type RefObject } from 'react';
import type { SectorTerrainData, TileCoord } from '@/shared/terrain-types';
import type { AnimationLoopController, OnSelectTile } from '../engine/types';

// ============================================================================
// タイル選択の確定処理を提供するフック。onSelect 通知・
// カーソル演出（パルス）の開始をまとめて行う。
// ============================================================================

export type TileSelectionParams = {
    selectedCoord: TileCoord | null;
    selectedTileRef: RefObject<TileCoord | null>;
    cursorAnimStartRef: RefObject<number>;
    cursorLoop: AnimationLoopController;
    terrain_grid: SectorTerrainData['terrain_grid'];
    onSelect?: OnSelectTile;
    renderOverlay?: () => void;
};

export type TileSelectionResult = {
    handleTileConfirm: (tile: TileCoord) => void;
    clearSelection: () => void;
};

function isSameTile(a: TileCoord | null, b: TileCoord | null): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    return a.x === b.x && a.y === b.y;
}

export function useTileSelection(params: TileSelectionParams): TileSelectionResult {
    const { selectedCoord, selectedTileRef, cursorAnimStartRef, cursorLoop, terrain_grid, onSelect, renderOverlay } =
        params;

    // 外部（GameSession）で選択が変わったときだけカーソル表示を合わせる。確定操作で ref は更新済みなので二重に開始しない
    useEffect(() => {
        if (isSameTile(selectedTileRef.current, selectedCoord)) return;
        selectedTileRef.current = selectedCoord;
        if (selectedCoord) {
            cursorAnimStartRef.current = performance.now();
            cursorLoop.start();
        } else {
            cursorLoop.stop();
            renderOverlay?.();
        }
    }, [selectedCoord, selectedTileRef, cursorAnimStartRef, cursorLoop, renderOverlay]);

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

    const clearSelection = useCallback(() => {
        if (!selectedTileRef.current) return;
        selectedTileRef.current = null;
        cursorLoop.stop();
        renderOverlay?.();
        onSelect?.(null);
    }, [selectedTileRef, cursorLoop, renderOverlay, onSelect]);

    return { handleTileConfirm, clearSelection };
}
