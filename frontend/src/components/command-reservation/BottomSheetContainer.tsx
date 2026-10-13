import React from 'react';
import { useBottomSheet } from '../../hooks/useBottomSheet';

export interface BottomSheetContainerProps {
    children: React.ReactNode;
}

export const BottomSheetContainer: React.FC<BottomSheetContainerProps> = ({ children }) => {
    const { snap, handleDragHandleClick, snapHeightStyle } = useBottomSheet('half');

    return (
        <div
            data-testid="bottom-sheet-container"
            data-snap={snap}
            /* スマホ表示 (<768px): 画面下部固定のボトムシート / PC表示 (>=768px): 画面右側に幅固定の並列サイドパネル */
            className={`fixed inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden rounded-t-xl border border-sky-300/25 bg-[#0a3d4d]/95 shadow-[0_0_24px_rgba(56,189,248,0.18),inset_0_1px_0_rgba(186,230,253,0.15)] backdrop-blur-md md:static md:size-full md:max-h-full md:rounded-none md:border-t-0 md:border-l md:shadow-[inset_1px_0_0_rgba(186,230,253,0.12),0_0_32px_rgba(56,189,248,0.1)]`}
            style={
                // 画面幅がモバイルの場合のみ snapHeightStyle を適用する
                typeof window !== 'undefined' && window.innerWidth >= 768 ? undefined : snapHeightStyle
            }
        >
            {/* モバイル用ドラッグハンドルバー（PCでは非表示） */}
            <div
                data-testid="bottom-sheet-handle"
                onClick={handleDragHandleClick}
                className="flex shrink-0 cursor-pointer items-center justify-center py-2 transition-colors select-none hover:bg-sky-300/10 md:hidden"
                aria-label="ボトムシート高さ切り替えハンドル"
            >
                <div className="h-1.5 w-12 rounded-full bg-sky-200/50 hover:bg-sky-100/80" />
            </div>

            {/* パネルコンテンツ領域 */}
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                {/* 上部サイバー発光ライン */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-6 top-0 z-10 h-px bg-linear-to-r from-transparent via-sky-200/80 to-transparent"
                />
                {children}
            </div>
        </div>
    );
};
