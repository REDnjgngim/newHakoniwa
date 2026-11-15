import type { TerrainCell, TerrainDisplay, TerrainResolver, TileCoord } from '@/shared/terrain-types';
import type { CommandDefinition } from '@/features/command-reservation';

export type CommandInputMode = 'classic' | 'manage';

export type CommandInputModeOption = {
    mode: CommandInputMode;
    label: string;
};

/** コマンド入力の対象マス */
export type CommandInputTarget = {
    coord: TileCoord;
    cell: TerrainCell;
};

export type CommandInputPopupProps = {
    coord: TileCoord;
    terrain: TerrainDisplay;
    islandName?: string;
    visible: boolean;
    onClose: () => void;
    onSelectCommand: (def: CommandDefinition, quantity: number) => void;
};

export type CommandInputPopupContainerProps = {
    resolveTerrain?: TerrainResolver;
};

export type UseCommandInputResult = {
    activeMode: CommandInputMode;
    setActiveMode: (mode: CommandInputMode) => void;
    quantity: number;
    setQuantity: (q: number) => void;
    visibleCommands: CommandDefinition[];
};
