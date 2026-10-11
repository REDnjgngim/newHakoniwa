import React from 'react';
import type { ReservationCommand } from '../../types/command-reservation';

export interface CommandListItemProps {
    command: ReservationCommand;
    isExpanded: boolean;
    isFocused: boolean;
    isInsertTarget?: boolean;
    onToggleExpand: () => void;
    onSelect: () => void;
    onDelete: () => void;
    onStackClick?: () => void;
    dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export const CommandListItem: React.FC<CommandListItemProps> = ({
    command,
    isExpanded,
    isFocused,
    isInsertTarget = false,
    onToggleExpand,
    onSelect,
    onDelete,
    onStackClick,
    dragHandleProps,
}) => {
    const isFast = command.commandType === 'fast';
    const orderFormatted = String(command.order).padStart(2, '0');

    // ターゲット島名の短縮表示（10文字超は「…」）
    const targetIslandDisplay = command.targetIsland
        ? command.targetIsland.length > 10
            ? `${command.targetIsland.slice(0, 10)}…`
            : command.targetIsland
        : null;

    return (
        <div className="relative w-full select-none">
            {/* 直上の挿入ライン */}
            {isInsertTarget && (
                <div
                    data-testid="insert-target-line"
                    className="absolute inset-x-0 -top-1 z-10 h-0.5 bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"
                />
            )}

            <div
                data-testid={`command-item-${command.id}`}
                onClick={onSelect}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect();
                    }
                }}
                className={`relative flex cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 text-xs transition-all sm:text-sm ${
                    isFast
                        ? 'mb-0.5 border-l-4 border-l-yellow-400 bg-slate-900/80'
                        : 'mb-2 border-l-4 border-l-blue-500 bg-slate-800/80'
                } ${
                    isFocused ? 'shadow-md ring-2 shadow-red-500/20 ring-red-500' : 'hover:bg-slate-700/80'
                } border border-slate-700/60 text-slate-100`}
            >
                {/* 並び替えハンドル */}
                <div
                    {...dragHandleProps}
                    aria-label="並び替えハンドル"
                    className="cursor-grab px-0.5 font-mono text-slate-400 select-none hover:text-slate-200 active:cursor-grabbing"
                    onClick={(e) => e.stopPropagation()}
                >
                    ⋮⋮
                </div>

                {/* 2桁リスト番号 */}
                <span className="min-w-5 font-mono font-semibold text-slate-400">{orderFormatted}</span>

                {/* アコーディオン開閉トグル */}
                <button
                    type="button"
                    aria-label={isExpanded ? '詳細を閉じる' : '詳細を開く'}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand();
                    }}
                    className="p-0.5 text-xs text-slate-300 transition-transform hover:text-white"
                >
                    {isExpanded ? '▼' : '▶'}
                </button>

                {/* 座標 (X, Y) */}
                {command.coordinate && (
                    <span className="shrink-0 font-mono text-[11px] text-sky-300 sm:text-xs">
                        ({command.coordinate.x},{command.coordinate.y})
                    </span>
                )}

                {/* 地形アイコン */}
                {command.terrainIcon && (
                    <span className="shrink-0 text-sm" role="img" aria-label="地形アイコン">
                        {command.terrainIcon}
                    </span>
                )}

                {/* コマンド名 */}
                <span className="max-w-30 truncate font-medium text-slate-100 sm:max-w-40">{command.name}</span>

                {/* サマリーテキスト（数量・パラメータ情報） */}
                {command.summaryText && (
                    <span className="max-w-35 truncate text-[11px] text-slate-300 sm:text-xs">
                        {command.summaryText}
                    </span>
                )}

                {/* ターゲット島名 */}
                {targetIslandDisplay && (
                    <span
                        className="max-w-22.5 truncate rounded border border-emerald-800/50 bg-slate-900/70 px-1 py-0.5 text-[10px] text-emerald-300 sm:text-[11px]"
                        title={command.targetIsland}
                    >
                        &lt;{targetIslandDisplay}&gt;
                    </span>
                )}

                {/* スタックバッジ */}
                {command.stackCount && command.stackCount > 1 && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onStackClick?.();
                        }}
                        className="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/20 px-1.5 py-1 font-mono text-[10px] font-bold text-amber-300 hover:bg-amber-500/30"
                    >
                        X {command.stackCount}
                    </button>
                )}

                <div className="flex-1" />

                {/* 削除ボタン */}
                <button
                    type="button"
                    aria-label="コマンド削除"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
};
