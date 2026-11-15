import type { TerrainBubbleProps } from '../engine/types';

export function TerrainBubble({
    coord,
    terrainName,
    terrainImage,
    islandName,
    anchorPosition,
    visible,
}: TerrainBubbleProps) {
    return (
        <div
            style={{
                left: `${anchorPosition.x}px`,
                top: `${anchorPosition.y}px`,
                transform: 'translate(-50%, calc(-100% - 32px))',
            }}
            className={`pointer-events-none absolute z-30 max-w-64 min-w-40 rounded-md border-2 border-cyan-400/50 bg-[rgba(10,25,45,0.5)] p-1 shadow-[0_4px_16px_rgba(6,182,212,0.4),0_2px_8px_rgba(0,0,0,0.6)] backdrop-blur-xs transition-all duration-100 ease-out ${
                visible ? 'opacity-100' : 'opacity-0'
            }`}
        >
            <div className="flex items-center justify-start gap-2">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xs bg-[rgba(0,0,0,0.3)]">
                    {terrainImage ? (
                        <img
                            src={terrainImage}
                            alt={terrainName}
                            className="size-8 object-contain [image-rendering:pixelated]"
                        />
                    ) : (
                        <span className="text-xs text-cyan-200/70">?</span>
                    )}
                </div>
                <div className="min-w-0 flex-1 text-left">
                    <div className="truncate text-xs font-bold text-cyan-300">{islandName ?? '所属不明'}</div>
                    <div className="truncate font-mono text-xs text-cyan-200/90 tabular-nums">
                        ({coord.x},{coord.y}) {terrainName}
                    </div>
                </div>
            </div>
        </div>
    );
}
