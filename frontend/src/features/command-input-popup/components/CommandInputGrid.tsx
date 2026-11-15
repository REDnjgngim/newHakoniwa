import { CommandInputCard } from './CommandInputCard';
import type { CommandDefinition } from '@/features/command-reservation';

export type CommandInputGridProps = {
    commands: CommandDefinition[];
    quantity: number;
    onSelectCommand: (def: CommandDefinition) => void;
};

export function CommandInputGrid({ commands, quantity, onSelectCommand }: CommandInputGridProps) {
    if (commands.length === 0) {
        return <div className="p-2 text-center text-xs text-slate-300">表示できるコマンドはありません</div>;
    }

    return (
        <div className="grid grid-cols-2 gap-2 overflow-y-auto p-2">
            {commands.map((def) => (
                <CommandInputCard
                    key={def.commandCode}
                    def={def}
                    quantity={quantity}
                    onSelect={() => onSelectCommand(def)}
                />
            ))}
        </div>
    );
}
