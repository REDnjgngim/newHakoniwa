import { getClassicTerrain } from '@/rules/classic';
import type { Coordinate, TerrainCell } from '@/shared/terrain-types';

export type TerrainInfoPopupProps = {
    coord: Coordinate;
    cell: TerrainCell;
    islandName?: string;
    position: { x: number; y: number };
    visible: boolean;
};

export function TerrainInfoPopup({ coord, cell, islandName, position, visible }: TerrainInfoPopupProps) {
    const terrain = getClassicTerrain(cell.type);
    const terrainName = terrain?.name ?? cell.type;

    return (
        <div
            style={{ left: `${position.x}px`, top: `${position.y}px` }}
            className={`pointer-events-none absolute z-30 w-120 max-w-[calc(100%-16px)] rounded-lg border border-cyan-400/50 bg-[rgba(10,25,45,0.88)] p-2 shadow-[0_0_20px_rgba(6,182,212,0.25)] backdrop-blur-md transition-all duration-150 ease-out ${
                visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
        >
            <div className="flex items-center gap-3">
                {/* 左側: 地形アイコン */}
                <div className="flex size-11 shrink-0 items-center justify-center rounded border border-cyan-500/30 bg-[rgba(0,0,0,0.3)]">
                    {terrain?.image ? (
                        <img
                            src={terrain.image}
                            alt={terrainName}
                            className="size-9 object-contain [image-rendering:pixelated]"
                        />
                    ) : (
                        <span className="text-xs text-cyan-200/70">?</span>
                    )}
                </div>

                {/* 中央: 情報テキスト */}
                <div className="min-w-0 flex-1">
                    <div className="truncate font-bold text-cyan-300 [text-shadow:0_0_8px_rgba(6,182,212,0.6)]">
                        {islandName ?? '所属不明'}
                    </div>
                    <div className="truncate font-mono text-sm text-cyan-200/90 tabular-nums">
                        ({coord.x}, {coord.y}) {terrainName}
                    </div>
                </div>

                {/* 右側: コマンド用ブランク領域 */}
                <div className="flex h-11 w-20 shrink-0 items-center justify-center rounded border border-dashed border-cyan-500/20 bg-[rgba(0,0,0,0.15)]" />
            </div>
        </div>
    );
}
