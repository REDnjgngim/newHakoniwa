import { TerrainSummary } from '@/shared';
import type { TerrainBubbleProps } from '../engine/types';

export function TerrainBubble({ coord, terrain, islandName, anchorPosition, visible }: TerrainBubbleProps) {
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
            <TerrainSummary size="sm" coord={coord} terrain={terrain} islandName={islandName} />
        </div>
    );
}
