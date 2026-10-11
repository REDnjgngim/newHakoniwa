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
            className={`fixed inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden rounded-t-xl border-t border-slate-700/80 bg-slate-950/95 shadow-2xl backdrop-blur-md md:static md:size-full md:max-h-full md:rounded-none md:border-t-0 md:border-l md:border-slate-800 md:shadow-none`}
            style={
                // 画面幅がモバイルの場合のみ snapHeightStyle を適用する
                typeof window !== 'undefined' && window.innerWidth >= 768 ? undefined : snapHeightStyle
            }
        >
            {/* モバイル用ドラッグハンドルバー（PCでは非表示） */}
            <div
                data-testid="bottom-sheet-handle"
                onClick={handleDragHandleClick}
                className="flex shrink-0 cursor-pointer items-center justify-center py-2 transition-colors select-none hover:bg-slate-800/60 md:hidden"
                aria-label="ボトムシート高さ切り替えハンドル"
            >
                <div className="h-1.5 w-12 rounded-full bg-slate-500 hover:bg-slate-300" />
            </div>

            {/* パネルコンテンツ領域 */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
        </div>
    );
};
