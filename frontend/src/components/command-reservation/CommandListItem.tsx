import React from 'react';
import type { ReservationCommand } from '../../types/command-reservation';
import { TerrainIcon } from './TerrainIcon';

export interface CommandListItemProps {
    command: ReservationCommand;
    isExpanded: boolean;
    isFocused: boolean;
    isInsertAbove?: boolean;
    isInsertBelow?: boolean;
    /** 直前が同じ種別（青色同士など）の場合に連結表示する */
    isConnectedToPrev?: boolean;
    /** 直後が同じ種別（青色同士など）の場合に連結表示する */
    isConnectedToNext?: boolean;
    /** 展開時に中央列へ埋め込む詳細編集コンテンツ */
    detailContent?: React.ReactNode;
    onToggleExpand: () => void;
    onSelect: () => void;
    onDelete: () => void;
    onStackClick?: () => void;
    dragHandleProps?: React.HTMLAttributes<HTMLDivElement> & {
        draggable?: boolean;
        onDragStart?: React.DragEventHandler<HTMLDivElement>;
    };
}

export const CommandListItem: React.FC<CommandListItemProps> = ({
    command,
    isExpanded,
    isFocused,
    isInsertAbove = false,
    isInsertBelow = false,
    isConnectedToPrev = false,
    isConnectedToNext = false,
    detailContent,
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
    // 青色（高速）の下は常に隙間なし。青色・黄色とも角丸なしの四角で統一する
    const roundedClass = 'rounded-none';
    const borderClass = isFast
        ? `${isConnectedToPrev ? 'border-t-0' : ''} ${isConnectedToNext ? 'border-b-0' : ''}`
        : '';
    const marginClass = isFast ? 'mb-0' : 'mb-2';

    return (
        <div className="relative w-full select-none">
            {/* 直上の挿入ライン */}
            {isInsertAbove && (
                <div
                    data-testid="insert-target-line-above"
                    className="absolute inset-x-0 -top-1 z-10 h-0.5 bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"
                />
            )}
            {/* 直下の挿入ライン */}
            {isInsertBelow && (
                <div
                    data-testid="insert-target-line-below"
                    className="absolute inset-x-0 -bottom-1 z-10 h-0.5 bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"
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
                className={`relative flex min-h-13 cursor-pointer gap-1 overflow-hidden ${roundedClass} ${borderClass} border py-1 pr-2 pl-1 text-xs transition-[background-color,border-color,box-shadow] duration-200 sm:text-sm ${
                    isFast
                        ? `${marginClass} border-cyan-200/50 bg-linear-to-b from-[#0d7f9c] via-[#0080A0] to-[#046276] text-white shadow-[inset_0_1px_0_rgba(207,250,254,0.35),0_1px_6px_rgba(8,145,178,0.35)] hover:from-[#1093b1] hover:via-[#0092b5] hover:to-[#057183]`
                        : `${marginClass} border-amber-200/50 bg-linear-to-b from-[#e89a1d] via-[#d08000] to-[#9c5f00] text-white shadow-[inset_0_1px_0_rgba(254,243,199,0.4),0_1px_6px_rgba(180,83,9,0.35)] hover:from-[#f0a832] hover:via-[#dd8d0f] hover:to-[#a96a05]`
                } ${isFocused ? 'z-10 shadow-md ring-2 shadow-red-500/20 ring-red-500' : ''}`}
            >
                {/* 上部ハイライトライン */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-2 top-0 h-px bg-linear-to-r from-transparent via-white/60 to-transparent"
                />
                {/* 並び替えハンドル: 枠なし上下矢印（PC/スマホ同一・常時表示） */}
                <div
                    {...dragHandleProps}
                    data-drag-handle
                    aria-label="並び替えハンドル"
                    title="ドラッグで入れ替え"
                    className="relative flex cursor-grab touch-none items-center self-stretch px-0.5 py-1 select-none active:cursor-grabbing"
                    style={{ touchAction: 'none' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        aria-hidden="true"
                        className="flex h-full w-3.5 flex-col items-center justify-center gap-1 opacity-80"
                    >
                        <span className="size-0 border-x-5 border-b-7 border-x-transparent border-b-white/90" />
                        <span className="size-0 border-x-5 border-t-7 border-x-transparent border-t-white/90" />
                    </div>
                </div>

                {/* 2桁リスト番号 */}
                <span className="min-w-5 self-center font-mono text-white/90">{orderFormatted}</span>

                {/* アコーディオン開閉トグル */}
                <button
                    type="button"
                    aria-label={isExpanded ? '詳細を閉じる' : '詳細を開く'}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand();
                    }}
                    className="self-center px-0.5 text-xs text-white/85 hover:cursor-pointer hover:text-white"
                >
                    {isExpanded ? '▼' : '▶'}
                </button>

                {/* 中央: 1行目（座標・地形・コマンド名）＋2行目以降 */}
                <div className="flex min-w-0 flex-1 flex-col justify-center self-stretch text-left">
                    <div
                        className={`grid min-w-0 transition-[grid-template-rows,opacity] duration-200 ease-out ${
                            isExpanded ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
                        }`}
                        aria-hidden={isExpanded}
                    >
                        <div className="min-w-0 overflow-hidden">
                            <div
                                className={`flex min-w-0 items-center gap-1.5 text-left leading-relaxed ${isThreeLines ? 'text-[11px] leading-tight' : ''}`}
                            >
                                {/* 座標 (X, Y) */}
                                {command.coordinate && (
                                    <span
                                        className={`shrink-0 font-mono text-white ${isThreeLines ? 'text-[10px]' : 'text-xs sm:text-[13px]'}`}
                                    >
                                        ({command.coordinate.x},{command.coordinate.y})
                                    </span>
                                )}

                                {/* 地形アイコン（座標から取得した地形画像） */}
                                <TerrainIcon coordinate={command.coordinate} size={isThreeLines ? 16 : 20} />

                                {/* コマンド名 */}
                                <span
                                    className={`truncate text-left font-medium text-white ${isThreeLines ? 'text-[11px]' : 'text-[13px] sm:text-sm'}`}
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
                                    className={`truncate text-left text-white/90 ${isThreeLines ? 'text-[10px] leading-tight' : 'text-xs/relaxed sm:text-[13px]'}`}
                                >
                                    {detailLine}
                                </div>
                            )}

                            {/* 目標の島行 */}
                            {targetIslandLine && (
                                <div
                                    data-testid={`command-target-line-${command.id}`}
                                    className="truncate text-left text-[10px] leading-tight text-white/90"
                                    title={command.targetIsland}
                                >
                                    &lt;{targetIslandLine}&gt;
                                </div>
                            )}
                        </div>
                    </div>
                    <div
                        className={`grid min-w-0 text-left transition-[grid-template-rows,opacity] duration-200 ease-out ${
                            isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        } ${isExpanded ? '' : 'invisible'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="min-w-0 overflow-hidden">{detailContent}</div>
                    </div>
                </div>

                {/* 削除ボタン */}
                <button
                    type="button"
                    aria-label="コマンド削除"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="m-1 shrink-0 self-center rounded p-1 text-white transition-colors hover:cursor-pointer hover:bg-black/35"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
};
