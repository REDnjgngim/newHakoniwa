import type { RefObject } from 'react';

// ============================================================================
// マップの計測値と選択状態を表示するHUD。
// 毎フレームの更新は textContent を直接書き換えて行う（Reactの再レンダリングを避けるため）。
// ============================================================================

export interface MapHudProps {
    statsRef: RefObject<HTMLDivElement | null>;
    selectedHudRef: RefObject<HTMLDivElement | null>;
}

export default function MapHud({ statsRef, selectedHudRef }: MapHudProps) {
    return (
        <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col gap-1 rounded bg-black/50 px-2 py-1 text-left">
            <div ref={statsRef} className="text-[#ffd27a] text-[11px] leading-tight">
                描画: -ms / マス数: 0
            </div>
            <div ref={selectedHudRef} className="text-[#ffd27a] text-[11px] leading-tight">
                選択: -
            </div>
        </div>
    );
}
