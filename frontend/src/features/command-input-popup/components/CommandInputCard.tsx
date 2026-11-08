import type { CommandDefinition } from '@/features/command-reservation/command-definition-types';

export type CommandInputCardProps = {
    def: CommandDefinition;
    quantity: number;
    onSelect: () => void;
};

export function CommandInputCard({ def, quantity, onSelect }: CommandInputCardProps) {
    const isFast = def.commandType === 'fast';
    const totalCost = def.cost * quantity;

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`relative flex min-h-13 w-full cursor-pointer flex-col justify-center gap-1 overflow-hidden rounded-xs border py-1 pr-2 pl-1 text-xs text-white transition-[background-color,border-color,box-shadow] duration-200 sm:text-sm ${
                isFast
                    ? 'border-cyan-200/50 bg-linear-to-b from-[#0d7f9c] via-[#0080A0] to-[#046276] shadow-[inset_0_1px_0_rgba(207,250,254,0.35),0_1px_6px_rgba(8,145,178,0.35)] hover:from-[#1093b1] hover:via-[#0092b5] hover:to-[#057183]'
                    : 'border-amber-200/50 bg-linear-to-b from-[#e89a1d] via-[#d08000] to-[#9c5f00] shadow-[inset_0_1px_0_rgba(254,243,199,0.4),0_1px_6px_rgba(180,83,9,0.35)] hover:from-[#f0a832] hover:via-[#dd8d0f] hover:to-[#a96a05]'
            }`}
        >
            {/* 上部ハイライトライン */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-2 top-0 h-px bg-linear-to-r from-transparent via-white/60 to-transparent"
            />
            <div className="flex items-center justify-between gap-1">
                <span className="truncate text-left font-bold text-white">{def.name}</span>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    className="shrink-0 text-xs text-white/80"
                    aria-label="詳細"
                >
                    ⓘ
                </button>
            </div>
            <div className={`truncate text-left text-white/90 ${quantity >= 2 ? 'font-bold' : ''}`}>
                費用 {totalCost}億円
            </div>
        </button>
    );
}
