import type { ReactNode } from 'react';

// ============================================================================
// 画面いっぱいを覆うコンテナと、その中央に配置する 9:16 の不可視論理枠を提供する。
// 論理枠は UI 配置の基準領域であり、描画線や背景を持たず操作を通過させる。
// 今回は Inspector を 1 個だけ持ち、canvas は画面いっぱい（full viewport）に広がる。
// ============================================================================

interface InspectorFrameProps {
    children?: ReactNode;
}

export default function InspectorFrame({ children }: InspectorFrameProps) {
    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden bg-slate-950 md:flex-row">
            {children}
            {/* UI 配置用の 9:16 論理枠（不可視・操作を通過させる） */}
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 'min(100dvw, calc(100dvh * 9 / 16))',
                    height: 'min(100dvh, calc(100dvw * 16 / 9))',
                    background: 'transparent',
                    pointerEvents: 'none',
                }}
            />
        </div>
    );
}
