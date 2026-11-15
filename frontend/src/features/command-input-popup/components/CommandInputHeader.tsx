import { COMMAND_INPUT_MODE_OPTIONS, QUANTITY_MAX, QUANTITY_MIN } from '../command-input-logic';
import type { CommandInputMode } from '../types';

export type CommandInputHeaderProps = {
    activeMode: CommandInputMode;
    onChangeMode: (mode: CommandInputMode) => void;
    quantity: number;
    onChangeQuantity: (q: number) => void;
};

export function CommandInputHeader({ activeMode, onChangeMode, quantity, onChangeQuantity }: CommandInputHeaderProps) {
    return (
        <div className="flex flex-col gap-1 p-1">
            <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1">
                    {COMMAND_INPUT_MODE_OPTIONS.map((option) => (
                        <button
                            key={option.mode}
                            type="button"
                            onClick={() => onChangeMode(option.mode)}
                            className={`cursor-pointer rounded-xs px-2 py-1 text-xs font-medium transition-colors ${
                                activeMode === option.mode
                                    ? 'border-t-2 border-t-sky-400 bg-slate-800 text-sky-400'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onChangeQuantity(quantity - 1)}
                        disabled={quantity <= QUANTITY_MIN}
                        className="cursor-pointer rounded-xs border border-slate-500 px-2 py-1 text-xs text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        −
                    </button>
                    <input
                        type="number"
                        min={QUANTITY_MIN}
                        max={QUANTITY_MAX}
                        value={quantity}
                        onChange={(e) => onChangeQuantity(Number(e.target.value))}
                        className="w-12 rounded-xs border border-slate-500 bg-slate-800 p-1 text-center text-xs text-slate-100"
                    />
                    <button
                        type="button"
                        onClick={() => onChangeQuantity(quantity + 1)}
                        disabled={quantity >= QUANTITY_MAX}
                        className="cursor-pointer rounded-xs border border-slate-500 px-2 py-1 text-xs text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        +
                    </button>
                </div>
            </div>
            <div className="text-center text-[10px] text-slate-400">タップしてコマンドを予約</div>
        </div>
    );
}
