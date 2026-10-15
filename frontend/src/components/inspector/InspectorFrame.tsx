import type { ReactNode } from 'react';

// ============================================================================
// 画面いっぱいを覆うコンテナを提供する。
// UI配置用の9:16不可視論理枠はマップパネル基準（HexMapPreview内）に置く。
// 今回は Inspector を 1 個だけ持ち、canvas は画面いっぱい（full viewport）に広がる。
// ============================================================================

interface InspectorFrameProps {
    children?: ReactNode;
}

export default function InspectorFrame({ children }: InspectorFrameProps) {
    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden bg-slate-950 md:flex-row">
            {/* PC時の左右余白用サイバー背景（青強め・マップ裏ではなく画面全体の土台） */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block"
                style={{
                    background:
                        'radial-gradient(1200px 600px at 15% 10%, rgba(14,116,144,0.35), transparent 60%), radial-gradient(1000px 700px at 85% 20%, rgba(37,99,235,0.35), transparent 60%), radial-gradient(900px 900px at 50% 110%, rgba(8,145,178,0.28), transparent 60%), linear-gradient(180deg, #020617 0%, #082f49 45%, #0c4a6e 70%, #020617 100%)',
                }}
            >
                {/* グリッド線 */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(56,189,248,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.12) 1px, transparent 1px)',
                        backgroundSize: '44px 44px',
                        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 85%)',
                        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 85%)',
                    }}
                />
                {/* 左右の発光ライン */}
                <div
                    className="absolute inset-y-0 left-0 w-px"
                    style={{ background: 'linear-gradient(180deg, transparent, rgba(56,189,248,0.8), transparent)' }}
                />
                <div
                    className="absolute inset-y-0 right-0 w-px"
                    style={{ background: 'linear-gradient(180deg, transparent, rgba(56,189,248,0.8), transparent)' }}
                />
            </div>
            {children}
        </div>
    );
}
