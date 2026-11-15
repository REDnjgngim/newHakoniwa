import { useCallback, useMemo } from 'react';
import { getTerrainCellAt, resolveTerrainDisplay, usePresence } from '@/shared';
import { useGameSessionActions, useGameSessionState } from '@/features/game-session';
import { buildReservationCommandFromDefinition, type CommandDefinition } from '@/features/command-reservation';
import { COMMAND_POPUP_EXIT_MS } from '../command-input-logic';
import { CommandInputPopup } from './CommandInputPopup';
import type { CommandInputPopupContainerProps, CommandInputTarget } from '../types';

const POPUP_PRESENCE_KEY = 'command-input-popup';

export function CommandInputPopupContainer({ resolveTerrain }: CommandInputPopupContainerProps) {
    const { selectedCoordinate, sectorTerrain, islandStatus } = useGameSessionState();
    const { addCommand, selectTile } = useGameSessionActions();

    // 選択座標と地形データからコマンド入力の対象を決める（セルがない座標は対象にしない）
    const target = useMemo<CommandInputTarget | null>(() => {
        if (!selectedCoordinate) return null;
        const cell = getTerrainCellAt(sectorTerrain, selectedCoordinate);
        return cell ? { coord: selectedCoordinate, cell } : null;
    }, [selectedCoordinate, sectorTerrain]);

    // 開いている間の別マス選択では外枠をフェードし直さないよう、存在キーを固定にする
    const presence = usePresence(target, {
        getKey: () => POPUP_PRESENCE_KEY,
        exitDurationMs: COMMAND_POPUP_EXIT_MS,
    });

    // 閉じる＝選択解除。選択状態を GameSession だけで持ち、カーソルとポップアップが食い違わないようにする
    const handleClose = useCallback(() => selectTile(null), [selectTile]);

    const handleSelectCommand = useCallback(
        (def: CommandDefinition, quantity: number) => {
            if (!target) return;
            addCommand(buildReservationCommandFromDefinition(def, quantity, target.coord));
        },
        [target, addCommand]
    );

    if (presence === null) return null;

    return (
        <CommandInputPopup
            key={presence.key}
            coord={presence.item.coord}
            terrain={resolveTerrainDisplay(presence.item.cell.type, resolveTerrain)}
            islandName={islandStatus.name}
            visible={presence.visible}
            onClose={handleClose}
            onSelectCommand={handleSelectCommand}
        />
    );
}
