import { renderHook } from '@testing-library/react';
import { useTileSelection } from './use-tile-selection';
import type { AnimationLoopController } from '../engine/types';
import type { TileCoord } from '@/shared/terrain-types';
import type { SectorTerrainData, TerrainCell } from '@/shared/terrain-types';

describe('useTileSelection', () => {
    it('handleTileConfirm が onSelect を呼ぶ', () => {
        const selectedTileRef = { current: null as TileCoord | null };
        const cursorAnimStartRef = { current: 0 };
        const cursorLoop = { start: vi.fn(), stop: vi.fn(), isRunning: () => false } as AnimationLoopController;
        const terrain_grid = [[{ type: 'sea' } as TerrainCell]] as SectorTerrainData['terrain_grid'];
        const onSelect = vi.fn();
        const { result } = renderHook(() =>
            useTileSelection({ selectedTileRef, cursorAnimStartRef, cursorLoop, terrain_grid, onSelect })
        );
        result.current.handleTileConfirm({ x: 0, y: 0 });
        expect(onSelect).toHaveBeenCalled();
    });
});
