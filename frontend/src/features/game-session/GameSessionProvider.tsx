import { useCallback, useState } from 'react';
import type { Coordinate, SectorTerrainData } from '@/shared/terrain-types';
import type { IslandStatus } from '../island-status/types';
import { useReservationHistory } from '../command-reservation/hooks/use-reservation-history';
import { GameSessionContext } from './context';
import type { GameSessionContextValue, GameSessionProviderProps } from './types';

export function GameSessionProvider({
    children,
    initialSector,
    initialIslandStatus,
    initialCommands = [],
}: GameSessionProviderProps) {
    const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinate | null>(null);
    const [sectorTerrain] = useState<SectorTerrainData>(initialSector);
    const [islandStatus] = useState<IslandStatus>(initialIslandStatus);

    const history = useReservationHistory(initialCommands);

    const selectTile = useCallback((coord: Coordinate | null) => {
        setSelectedCoordinate(coord);
    }, []);

    const value: GameSessionContextValue = {
        selectedCoordinate,
        sectorTerrain,
        islandStatus,
        commands: history.commands,
        selectTile,
        addCommand: history.addCommand,
        updateCommand: history.updateCommand,
        deleteCommand: history.deleteCommand,
        reorderCommands: history.reorderCommands,
        undo: history.undo,
        redo: history.redo,
        canUndo: history.canUndo,
        canRedo: history.canRedo,
        isDirty: history.isDirty,
        markSaved: history.markSaved,
        resetCommands: history.resetCommands,
    };

    return <GameSessionContext value={value}>{children}</GameSessionContext>;
}
