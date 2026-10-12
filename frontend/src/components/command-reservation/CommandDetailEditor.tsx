import React from 'react';
import type { ReservationCommand } from '../../types/command-reservation';
import { mockIslands } from '../../mocks/command-reservation';

export interface CommandDetailEditorProps {
    command: ReservationCommand;
    onUpdate: (updatedCommand: ReservationCommand) => void;
}

export const CommandDetailEditor: React.FC<CommandDetailEditorProps> = ({ command, onUpdate }) => {
    // 座標の変更
    const handleCoordChange = (dx: number, dy: number) => {
        const currentX = command.coordinate?.x ?? 0;
        const currentY = command.coordinate?.y ?? 0;
        const newX = Math.max(0, currentX + dx);
        const newY = Math.max(0, currentY + dy);
        onUpdate({
            ...command,
            coordinate: { x: newX, y: newY },
        });
    };

    // 数量/スタック等の数値変更
    const currentAmount =
        typeof command.params?.amount === 'number'
            ? command.params.amount
            : typeof command.params?.repeatCount === 'number'
              ? command.params.repeatCount
              : typeof command.params?.missileCount === 'number'
                ? command.params.missileCount
                : typeof command.params?.scale === 'number'
                  ? command.params.scale
                  : typeof command.stackCount === 'number'
                    ? command.stackCount
                    : 1;

    const handleAmountChange = (newVal: number) => {
        const safeVal = Math.max(1, newVal);
        const updatedParams = { ...command.params };

        if ('amount' in updatedParams) {
            updatedParams.amount = safeVal;
        } else if ('repeatCount' in updatedParams) {
            updatedParams.repeatCount = safeVal;
        } else if ('missileCount' in updatedParams) {
            updatedParams.missileCount = safeVal;
        } else if ('scale' in updatedParams) {
            updatedParams.scale = safeVal;
        } else if (command.stackCount !== undefined) {
            updatedParams.stackCount = safeVal;
        }

        // サマリーテキストも適宜連動
        let summaryText = command.summaryText;
        if ('repeatCount' in updatedParams) {
            summaryText = `${safeVal}回`;
        } else if ('amount' in updatedParams) {
            summaryText = `輸出量: ${safeVal}トン`;
        } else if ('missileCount' in updatedParams) {
            summaryText = `発射数: ${safeVal}発`;
        } else if ('scale' in updatedParams) {
            summaryText = `規模: ${safeVal}億円`;
        }

        onUpdate({
            ...command,
            summaryText,
            stackCount: command.stackCount !== undefined ? safeVal : command.stackCount,
            params: updatedParams,
        });
    };

    // 対象島の変更
    const handleIslandChange = (islandName: string) => {
        onUpdate({
            ...command,
            targetIsland: islandName,
            params: {
                ...command.params,
                targetIsland: islandName,
            },
        });
    };

    return (
        <div
            data-testid={`command-detail-${command.id}`}
            className="mb-2 space-y-3 rounded-md border border-slate-700/80 bg-slate-900/90 p-3 text-xs text-slate-200 sm:text-sm"
            onClick={(e) => e.stopPropagation()}
        >
            {/* リアルタイム計算表示ヘッダー */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300">実行予定:</span>
                    <span className="rounded bg-sky-950 px-1.5 py-0.5 font-mono font-bold text-sky-400">
                        T{command.estimatedTurn}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300">推定資金増減:</span>
                    <span
                        className={`font-mono font-bold ${
                            command.estimatedFundsDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                    >
                        {command.estimatedFundsDelta >= 0 ? '+' : ''}
                        {command.estimatedFundsDelta}億円
                    </span>
                </div>
            </div>

            {/* 座標微調整（座標指定がある場合） */}
            {command.coordinate && (
                <div className="flex items-center justify-between gap-2">
                    <span className="shrink-0 text-slate-400">座標微調整:</span>
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sky-300">
                            ({command.coordinate.x}, {command.coordinate.y})
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                            <div />
                            <button
                                type="button"
                                aria-label="上へ移動"
                                onClick={() => handleCoordChange(0, -1)}
                                className="rounded border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] hover:bg-slate-700"
                            >
                                ▲
                            </button>
                            <div />
                            <button
                                type="button"
                                aria-label="左へ移動"
                                onClick={() => handleCoordChange(-1, 0)}
                                className="rounded border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] hover:bg-slate-700"
                            >
                                ◀
                            </button>
                            <button
                                type="button"
                                aria-label="下へ移動"
                                onClick={() => handleCoordChange(0, 1)}
                                className="rounded border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] hover:bg-slate-700"
                            >
                                ▼
                            </button>
                            <button
                                type="button"
                                aria-label="右へ移動"
                                onClick={() => handleCoordChange(1, 0)}
                                className="rounded border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] hover:bg-slate-700"
                            >
                                ▶
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 数量・規模スライダー / ステッパー */}
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <span className="text-slate-400">数量・規模設定:</span>
                    <div className="flex items-center gap-1.5 font-mono">
                        <button
                            type="button"
                            aria-label="数量を減らす"
                            onClick={() => handleAmountChange(currentAmount - 1)}
                            className="rounded border border-slate-600 bg-slate-800 px-2 py-0.5 font-bold hover:bg-slate-700"
                        >
                            -
                        </button>
                        <span className="min-w-12 text-center font-bold text-amber-300">{currentAmount}</span>
                        <button
                            type="button"
                            aria-label="数量を増やす"
                            onClick={() => handleAmountChange(currentAmount + 1)}
                            className="rounded border border-slate-600 bg-slate-800 px-2 py-0.5 font-bold hover:bg-slate-700"
                        >
                            +
                        </button>
                    </div>
                </div>
                <input
                    type="range"
                    aria-label="数量スライダー"
                    min="1"
                    max={currentAmount > 100 ? currentAmount * 2 : 100}
                    value={currentAmount}
                    onChange={(e) => handleAmountChange(Number(e.target.value))}
                    className="w-full cursor-pointer accent-sky-400"
                />
            </div>

            {/* 対象島の選択（対象島が指定可能な場合） */}
            {command.targetIsland !== undefined && (
                <div className="flex items-center justify-between gap-2">
                    <label htmlFor={`target-island-select-${command.id}`} className="shrink-0 text-slate-400">
                        対象島:
                    </label>
                    <select
                        id={`target-island-select-${command.id}`}
                        aria-label="対象島選択"
                        value={command.targetIsland}
                        onChange={(e) => handleIslandChange(e.target.value)}
                        className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:ring-1 focus:ring-sky-400"
                    >
                        {mockIslands.map((isl) => (
                            <option key={isl.id} value={isl.name}>
                                {isl.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
};
