import { useCommandInput } from '../hooks/use-command-input';
import { CommandInputHeader } from './CommandInputHeader';
import { CommandInputGrid } from './CommandInputGrid';
import type { CommandInputPopupProps } from '../types';
import type { CommandDefinition } from '@/features/command-reservation/command-definition-types';

export function CommandInputPopup({
    position,
    terrainPopupHeightPx,
    visible,
    onSelectCommand,
}: CommandInputPopupProps) {
    const { activeMode, setActiveMode, quantity, setQuantity, visibleCommands } = useCommandInput();

    const handleSelect = (def: CommandDefinition) => {
        onSelectCommand(def, quantity);
    };

    return (
        <div
            style={{
                left: `${position.x}px`,
                top: `${position.y + terrainPopupHeightPx}px`,
                transform: 'translateX(-50%)',
            }}
            className={`pointer-events-auto absolute z-40 w-4/5 max-w-120 rounded-xs border border-cyan-400/50 bg-[rgba(10,25,45,0.75)] shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all duration-150 ease-out ${
                visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
        >
            <CommandInputHeader
                activeMode={activeMode}
                onChangeMode={setActiveMode}
                quantity={quantity}
                onChangeQuantity={setQuantity}
            />
            <CommandInputGrid commands={visibleCommands} quantity={quantity} onSelectCommand={handleSelect} />
        </div>
    );
}
