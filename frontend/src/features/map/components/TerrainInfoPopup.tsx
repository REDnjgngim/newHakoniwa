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
            style={{ left: `${position.x}px`, top: `${position.y}px`, transform: 'translateX(-50%)' }}
            className={`pointer-events-none absolute z-30 w-4/5 max-w-60 rounded-xs border border-cyan-400/50 bg-[rgba(10,25,45,0.75)] p-1 text-left shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all duration-150 ease-out md:w-1/3 md:max-w-none ${
                visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
        >
            <div className="flex items-center justify-start gap-1">
                {/* 左側: 地形アイコン */}
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xs bg-[rgba(0,0,0,0.3)]">
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
                <div className="min-w-0 flex-1 text-left">
                    <div className="truncate text-xs font-bold text-cyan-300">{islandName ?? '所属不明'}</div>
                    <div className="truncate font-mono text-xs text-cyan-200/90 tabular-nums">
                        ({coord.x},{coord.y}) {terrainName}
                    </div>
                </div>

                {/* 右側: コマンド開閉ボタン */}
                <div className="flex h-11 w-20 shrink-0 items-center justify-center" />
            </div>
        </div>
    );
}
