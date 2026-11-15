import type { TerrainDisplay, TileCoord } from './terrain-types';

type TerrainSummarySize = 'sm' | 'md';

type SizeClassSet = {
    row: string;
    iconBox: string;
    iconImg: string;
};

const SIZE_CLASSES: Record<TerrainSummarySize, SizeClassSet> = {
    sm: {
        row: 'gap-2',
        iconBox: 'size-10',
        iconImg: 'size-8',
    },
    md: {
        row: 'gap-1 p-1',
        iconBox: 'size-11',
        iconImg: 'size-9',
    },
};

export type TerrainSummaryProps = {
    coord: TileCoord;
    terrain: TerrainDisplay;
    islandName?: string;
    /** sm: ホバーバブル用 / md: コマンド入力ポップアップ用 */
    size?: TerrainSummarySize;
};

/** 地形アイコン・島名・座標と地形名をまとめた共通サマリー表示 */
export function TerrainSummary({ coord, terrain, islandName, size = 'sm' }: TerrainSummaryProps) {
    const classes = SIZE_CLASSES[size];

    return (
        <div className={`flex items-center justify-start ${classes.row}`}>
            <div
                className={`flex shrink-0 items-center justify-center rounded-xs bg-[rgba(0,0,0,0.3)] ${classes.iconBox}`}
            >
                {terrain.image ? (
                    <img
                        src={terrain.image}
                        alt={terrain.name}
                        className={`object-contain [image-rendering:pixelated] ${classes.iconImg}`}
                    />
                ) : (
                    <span className="text-xs text-cyan-200/70">?</span>
                )}
            </div>
            <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-xs font-bold text-cyan-300">{islandName ?? '所属不明'}</div>
                <div className="truncate font-mono text-xs text-cyan-200/90 tabular-nums">
                    ({coord.x},{coord.y}) {terrain.name}
                </div>
            </div>
        </div>
    );
}
