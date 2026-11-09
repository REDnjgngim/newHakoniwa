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
                    <button
                        type="button"
                        onClick={() => onChangeMode('classic')}
                        className={`cursor-pointer rounded-xs px-2 py-1 text-xs font-medium transition-colors ${
                            activeMode === 'classic'
                                ? 'border-t-2 border-t-sky-400 bg-slate-800 text-sky-400'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        クラシック
                    </button>
                    <button
                        type="button"
                        onClick={() => onChangeMode('admin')}
                        className={`cursor-pointer rounded-xs px-2 py-1 text-xs font-medium transition-colors ${
                            activeMode === 'admin'
                                ? 'border-t-2 border-t-sky-400 bg-slate-800 text-sky-400'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        運営
                    </button>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onChangeQuantity(quantity - 1)}
                        disabled={quantity <= 1}
                        className="cursor-pointer rounded-xs border border-slate-500 px-2 py-1 text-xs text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        −
                    </button>
                    <input
                        type="number"
                        min={1}
                        max={99}
                        value={quantity}
                        onChange={(e) => {
                            const n = Number(e.target.value);
                            if (Number.isNaN(n)) return;
                            onChangeQuantity(n);
                        }}
                        className="w-12 rounded-xs border border-slate-500 bg-slate-800 p-1 text-center text-xs text-slate-100"
                    />
                    <button
                        type="button"
                        onClick={() => onChangeQuantity(quantity + 1)}
                        disabled={quantity >= 99}
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
