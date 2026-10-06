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
        <>
            <div ref={statsRef} className="text-[#ffd27a] text-[13px] mb-2 text-center shrink-0">
                描画: -ms / マス数: 0
            </div>
            <div ref={selectedHudRef} className="text-[#ffd27a] text-[13px] mb-2 text-center shrink-0">
                選択: -
            </div>
        </>
    );
}
