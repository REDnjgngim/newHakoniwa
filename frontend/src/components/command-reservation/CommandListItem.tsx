import React from 'react';
import type { ReservationCommand } from '../../types/command-reservation';
import { TerrainIcon } from './TerrainIcon';

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

    // 2行目: 数量・パラメータ情報（表示優先のため summaryText をそのまま出す）
    const detailLine = command.summaryText?.trim() ? command.summaryText : null;
    // 3行目: 目標の島が必要な場合は別行にする
    const targetIslandLine = command.targetIsland?.trim() ? command.targetIsland : null;
    // 2行分の高さで固定し、3行になる場合は全体を縮小して収める
    const isThreeLines = targetIslandLine !== null;

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
                className={`relative flex h-13 cursor-pointer items-center gap-1.5 overflow-hidden rounded px-2 py-1 text-xs transition-all sm:text-sm ${
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
                    className="cursor-grab self-center px-0.5 font-mono text-slate-400 select-none hover:text-slate-200 active:cursor-grabbing"
                    onClick={(e) => e.stopPropagation()}
                >
                    ⋮⋮
                </div>

                {/* 2桁リスト番号 */}
                <span className="min-w-5 self-center font-mono font-semibold text-slate-400">{orderFormatted}</span>

                {/* アコーディオン開閉トグル */}
                <button
                    type="button"
                    aria-label={isExpanded ? '詳細を閉じる' : '詳細を開く'}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand();
                    }}
                    className="self-center p-0.5 text-xs text-slate-300 transition-transform hover:text-white"
                >
                    {isExpanded ? '▼' : '▶'}
                </button>

                {/* 中央: 1行目（座標・地形・コマンド名）＋2行目以降 */}
                <div className="flex min-w-0 flex-1 flex-col justify-center self-stretch text-left">
                    <div
                        className={`flex min-w-0 items-center gap-1.5 text-left leading-relaxed ${isThreeLines ? 'text-[11px] leading-tight' : ''}`}
                    >
                        {/* 座標 (X, Y) */}
                        {command.coordinate && (
                            <span
                                className={`shrink-0 font-mono text-sky-300 ${isThreeLines ? 'text-[10px]' : 'text-xs sm:text-[13px]'}`}
                            >
                                ({command.coordinate.x},{command.coordinate.y})
                            </span>
                        )}

                        {/* 地形アイコン（座標から取得した地形画像） */}
                        <TerrainIcon coordinate={command.coordinate} size={isThreeLines ? 16 : 20} />

                        {/* コマンド名 */}
                        <span
                            className={`truncate text-left font-medium text-slate-100 ${isThreeLines ? 'text-[11px]' : 'text-[13px] sm:text-sm'}`}
                        >
                            {command.name}
                        </span>

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
                    </div>

                    {/* 数量・パラメータ行 */}
                    {detailLine && (
                        <div
                            data-testid={`command-detail-line-${command.id}`}
                            className={`truncate text-left text-slate-300 ${isThreeLines ? 'text-[10px] leading-tight' : 'text-xs/relaxed sm:text-[13px]'}`}
                        >
                            {detailLine}
                        </div>
                    )}

                    {/* 目標の島行 */}
                    {targetIslandLine && (
                        <div
                            data-testid={`command-target-line-${command.id}`}
                            className="truncate text-left text-[10px] leading-tight text-emerald-300"
                            title={command.targetIsland}
                        >
                            &lt;{targetIslandLine}&gt;
                        </div>
                    )}
                </div>

                {/* 削除ボタン */}
                <button
                    type="button"
                    aria-label="コマンド削除"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="shrink-0 self-center rounded p-1 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
};
