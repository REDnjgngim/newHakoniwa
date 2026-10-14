import React from 'react';
import { useBottomSheet } from '../../hooks/useBottomSheet';

export interface BottomSheetContainerProps {
    children: React.ReactNode;
}

export const BottomSheetContainer: React.FC<BottomSheetContainerProps> = ({ children }) => {
    const { sheetHeightVh, isSheetHidden, handleDragHandlePointerDown, isDraggingSheet, snapHeightStyle } =
        useBottomSheet();

    return (
        <div
            data-testid="bottom-sheet-container"
            data-sheet-height-vh={Math.round(sheetHeightVh)}
            /* スマホ表示 (<768px): 画面下部固定のボトムシート / PC表示 (>=768px): 画面右側に幅固定の並列サイドパネル */
            className={`fixed inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden rounded-t-xl border border-sky-300/25 bg-[#0a3d4d]/95 shadow-[0_0_24px_rgba(56,189,248,0.18),inset_0_1px_0_rgba(186,230,253,0.15)] backdrop-blur-md md:static md:h-full md:max-h-full md:min-h-0 md:w-100 md:shrink-0 md:self-stretch md:rounded-xl md:border md:border-sky-300/30 md:shadow-[0_0_40px_rgba(56,189,248,0.25),inset_0_0_60px_rgba(8,145,178,0.15)]`}
            style={
                // 画面幅がモバイルの場合のみ snapHeightStyle を適用する
                typeof window !== 'undefined' && window.innerWidth >= 768 ? undefined : snapHeightStyle
            }
        >
            {/* モバイル用ドラッグハンドルバー（PCでは非表示） */}
            <div
                data-testid="bottom-sheet-handle"
                onPointerDown={handleDragHandlePointerDown}
                className={`flex shrink-0 cursor-grab touch-none items-center justify-center py-2 transition-colors select-none hover:bg-sky-300/10 active:cursor-grabbing md:hidden ${isDraggingSheet ? 'bg-sky-300/10' : ''}`}
                style={{ touchAction: 'none' }}
                aria-label="ボトムシート高さ調整ハンドル（ドラッグで拡縮）"
            >
                <div className="h-1.5 w-12 rounded-full bg-sky-200/50 hover:bg-sky-100/80" />
            </div>

            {/* パネルコンテンツ領域（下げ切ったら取っ手のみ残す） */}
            <div className={`relative flex min-h-0 flex-1 flex-col overflow-hidden ${isSheetHidden ? 'hidden' : ''}`}>
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
