import React from 'react';

export interface PanelFooterProps {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onToggleAllAccordion: () => void;
    onSubmit: () => void;
}

export const PanelFooter: React.FC<PanelFooterProps> = ({
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onToggleAllAccordion,
    onSubmit,
}) => {
    return (
        <div
            data-testid="panel-footer"
            className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-700/80 bg-slate-900/95 px-3 py-2 text-xs backdrop-blur-sm select-none"
        >
            {/* 左側: Undo / Redo */}
            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    data-testid="undo-button"
                    onClick={onUndo}
                    disabled={!canUndo}
                    className={`rounded border px-2 py-1 font-medium transition-colors ${
                        canUndo
                            ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'
                            : 'cursor-not-allowed border-slate-800 bg-slate-900 text-slate-600'
                    }`}
                >
                    (前)
                </button>
                <button
                    type="button"
                    data-testid="redo-button"
                    onClick={onRedo}
                    disabled={!canRedo}
                    className={`rounded border px-2 py-1 font-medium transition-colors ${
                        canRedo
                            ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'
                            : 'cursor-not-allowed border-slate-800 bg-slate-900 text-slate-600'
                    }`}
                >
                    (後)
                </button>
            </div>

            {/* 中央: 全開 / 全閉 */}
            <div>
                <button
                    type="button"
                    data-testid="toggle-all-button"
                    onClick={onToggleAllAccordion}
                    className="rounded border border-slate-600 bg-slate-800 px-2.5 py-1 font-medium text-slate-200 transition-colors hover:bg-slate-700"
                >
                    [全開/全閉]
                </button>
            </div>

            {/* 右側: 予約登録 */}
            <div>
                <button
                    type="button"
                    data-testid="submit-reservation-button"
                    onClick={onSubmit}
                    className="rounded border border-sky-400 bg-sky-600 px-3 py-1 font-bold text-white shadow-sm shadow-sky-600/40 transition-colors hover:bg-sky-500"
                >
                    [予約登録]
                </button>
            </div>
        </div>
    );
};
