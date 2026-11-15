import { renderHook } from '@testing-library/react';
import { useTileSelection } from './use-tile-selection';
import type { AnimationLoopController } from '../engine/types';
import type { SectorTerrainData, TileCoord } from '@/shared/terrain-types';

function createCursorLoop(): AnimationLoopController {
    return {
        start: vi.fn(),
        stop: vi.fn(),
        isRunning: () => false,
    };
}

describe('useTileSelection', () => {
    const terrain_grid: SectorTerrainData['terrain_grid'] = [
        [{ type: 'sea' }, { type: 'plains' }],
        [{ type: 'sea' }, { type: 'mountain' }],
    ];

    it('handleTileConfirm が onSelect を呼ぶ', () => {
        const selectedTileRef: { current: TileCoord | null } = { current: null };
        const cursorAnimStartRef = { current: 0 };
        const cursorLoop = createCursorLoop();
        const onSelect = vi.fn();
        const { result } = renderHook(() =>
            useTileSelection({
                selectedCoord: null,
                selectedTileRef,
                cursorAnimStartRef,
                cursorLoop,
                terrain_grid,
                onSelect,
            })
        );
        result.current.handleTileConfirm({ x: 0, y: 0 });
        expect(onSelect).toHaveBeenCalledWith({ coord: { x: 0, y: 0 }, cell: { type: 'sea' } });
    });

    it('clearSelection が selectedTileRef を null にし、cursorLoop.stop と renderOverlay と onSelect(null) を呼ぶ', () => {
        const selectedTileRef: { current: TileCoord | null } = { current: { x: 1, y: 1 } };
        const cursorAnimStartRef = { current: 0 };
        const cursorLoop = createCursorLoop();
        const onSelect = vi.fn();
        const renderOverlay = vi.fn();
        const { result } = renderHook(() =>
            useTileSelection({
                selectedCoord: { x: 1, y: 1 },
                selectedTileRef,
                cursorAnimStartRef,
                cursorLoop,
                terrain_grid,
                onSelect,
                renderOverlay,
            })
        );

        result.current.clearSelection();

        expect(selectedTileRef.current).toBeNull();
        expect(cursorLoop.stop).toHaveBeenCalled();
        expect(renderOverlay).toHaveBeenCalled();
        expect(onSelect).toHaveBeenCalledWith(null);
    });

    it('selectedTileRef が既に null の場合 clearSelection は何もしない', () => {
        const selectedTileRef: { current: TileCoord | null } = { current: null };
        const cursorAnimStartRef = { current: 0 };
        const cursorLoop = createCursorLoop();
        const onSelect = vi.fn();
        const renderOverlay = vi.fn();
        const { result } = renderHook(() =>
            useTileSelection({
                selectedCoord: null,
                selectedTileRef,
                cursorAnimStartRef,
                cursorLoop,
                terrain_grid,
                onSelect,
                renderOverlay,
            })
        );

        result.current.clearSelection();

        expect(cursorLoop.stop).not.toHaveBeenCalled();
        expect(renderOverlay).not.toHaveBeenCalled();
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('selectedCoord の外部変更にカーソルを同期し、onSelect は再通知しない', () => {
        const selectedTileRef: { current: TileCoord | null } = { current: null };
        const cursorAnimStartRef = { current: 0 };
        const cursorLoop = createCursorLoop();
        const onSelect = vi.fn();
        const renderOverlay = vi.fn();

        const { rerender } = renderHook(
            ({ selectedCoord }: { selectedCoord: TileCoord | null }) =>
                useTileSelection({
                    selectedCoord,
                    selectedTileRef,
                    cursorAnimStartRef,
                    cursorLoop,
                    terrain_grid,
                    onSelect,
                    renderOverlay,
                }),
            { initialProps: { selectedCoord: null as TileCoord | null } }
        );

        rerender({ selectedCoord: { x: 1, y: 0 } });
        expect(selectedTileRef.current).toEqual({ x: 1, y: 0 });
        expect(cursorLoop.start).toHaveBeenCalledTimes(1);
        expect(onSelect).not.toHaveBeenCalled();

        rerender({ selectedCoord: null });
        expect(selectedTileRef.current).toBeNull();
        expect(cursorLoop.stop).toHaveBeenCalledTimes(1);
        expect(renderOverlay).toHaveBeenCalledTimes(1);
        expect(onSelect).not.toHaveBeenCalled();
    });
});
