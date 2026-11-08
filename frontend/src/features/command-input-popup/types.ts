import type { TileCoord, TerrainCell } from '@/shared/terrain-types';
import type { CommandDefinition } from '@/features/command-reservation/command-definition-types';
import type { PopupPosition } from '@/features/map/engine/types';

export type CommandInputMode = 'classic' | 'admin';

export type CommandInputPopupProps = {
    coord: TileCoord;
    cell: TerrainCell;
    position: PopupPosition;
    /** TerrainInfoPopup の高さ（コマンドポップアップのtop基点オフセット）。px単位 */
    terrainPopupHeightPx: number;
    visible: boolean;
    onClose: () => void;
    onSelectCommand: (def: CommandDefinition, quantity: number) => void;
};

export type UseCommandInputResult = {
    activeMode: CommandInputMode;
    setActiveMode: (mode: CommandInputMode) => void;
    quantity: number;
    setQuantity: (q: number) => void;
    visibleCommands: CommandDefinition[];
};
