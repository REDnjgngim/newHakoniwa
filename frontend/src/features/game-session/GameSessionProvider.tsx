import { useCallback, useMemo, useState } from 'react';
import type { Coordinate, SectorTerrainData } from '@/shared/terrain-types';
import type { IslandStatus } from '../island-status/types';
import { useReservationHistory } from '../command-reservation/hooks/use-reservation-history';
import { GameSessionContext, GameSessionStateContext, GameSessionActionsContext } from './context';
import type {
    GameSessionContextValue,
    GameSessionProviderProps,
    GameSessionStateContextValue,
    GameSessionActionsContextValue,
} from './types';

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

    const stateValue: GameSessionStateContextValue = useMemo(
        () => ({
            selectedCoordinate,
            sectorTerrain,
            islandStatus,
            commands: history.commands,
        }),
        [selectedCoordinate, sectorTerrain, islandStatus, history.commands]
    );

    const actionsValue: GameSessionActionsContextValue = useMemo(
        () => ({
            selectTile,
            addCommand: history.addCommand,
            updateCommand: history.updateCommand,
            deleteCommand: history.deleteCommand,
            reorderCommands: history.reorderCommands,
            reorderCommandsById: history.reorderCommandsById,
            undo: history.undo,
            redo: history.redo,
            canUndo: history.canUndo,
            canRedo: history.canRedo,
            isDirty: history.isDirty,
            markSaved: history.markSaved,
            resetCommands: history.resetCommands,
        }),
        [
            selectTile,
            history.addCommand,
            history.updateCommand,
            history.deleteCommand,
            history.reorderCommands,
            history.reorderCommandsById,
            history.undo,
            history.redo,
            history.canUndo,
            history.canRedo,
            history.isDirty,
            history.markSaved,
            history.resetCommands,
        ]
    );

    const value: GameSessionContextValue = useMemo(
        () => ({ ...stateValue, ...actionsValue }),
        [stateValue, actionsValue]
    );

    return (
        <GameSessionStateContext value={stateValue}>
            <GameSessionActionsContext value={actionsValue}>
                <GameSessionContext value={value}>{children}</GameSessionContext>
            </GameSessionActionsContext>
        </GameSessionStateContext>
    );
}
