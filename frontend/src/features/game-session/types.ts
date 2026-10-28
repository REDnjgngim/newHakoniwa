import type { ReactNode } from 'react';
import type { Coordinate, SectorTerrainData } from '../../shared/types/terrain';
import type { IslandStatus } from '../island-status/types';
import type { ReservationCommand } from '../command-reservation/types';

export type GameSessionState = {
    /** マップ上で現在選択されているHex座標（未選択時は null） */
    selectedCoordinate: Coordinate | null;
    /** 現在のセクター地形データ */
    sectorTerrain: SectorTerrainData;
    /** 島ステータス */
    islandStatus: IslandStatus;
    /** 予約コマンドリスト */
    commands: ReservationCommand[];
};

export type GameSessionActions = {
    /** マス座標選択アクション */
    selectTile: (coord: Coordinate | null) => void;
    /** コマンド追加アクション */
    addCommand: (command: ReservationCommand) => void;
    /** コマンド更新アクション */
    updateCommand: (id: string, partial: Partial<ReservationCommand>) => void;
    /** コマンド削除アクション */
    deleteCommand: (id: string) => void;
    /** コマンド並び替えアクション */
    reorderCommands: (fromIndex: number, toIndex: number) => void;
    /** 履歴Undo */
    undo: () => void;
    /** 履歴Redo */
    redo: () => void;
    /** Undo可能か */
    canUndo: boolean;
    /** Redo可能か */
    canRedo: boolean;
    /** 変更があるか */
    isDirty: boolean;
    /** 保存済みマーク */
    markSaved: () => void;
    /** コマンドリセット */
    resetCommands: (newCommands: ReservationCommand[]) => void;
};

export type GameSessionContextValue = GameSessionState & GameSessionActions;

export type GameSessionProviderProps = {
    children: ReactNode;
    initialSector: SectorTerrainData;
    initialIslandStatus: IslandStatus;
    initialCommands?: ReservationCommand[];
};
