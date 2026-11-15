import { TerrainSummary, toCoordKey } from '@/shared';
import { useCommandInput } from '../hooks/use-command-input';
import { CommandInputHeader } from './CommandInputHeader';
import { CommandInputGrid } from './CommandInputGrid';
import type { CommandInputPopupProps } from '../types';

type CommandInputContentProps = Pick<CommandInputPopupProps, 'coord' | 'terrain' | 'islandName' | 'onSelectCommand'>;

function CommandInputContent({ coord, terrain, islandName, onSelectCommand }: CommandInputContentProps) {
    const { activeMode, setActiveMode, quantity, setQuantity, visibleCommands } = useCommandInput();

    return (
        <>
            <TerrainSummary size="md" coord={coord} terrain={terrain} islandName={islandName} />
            <div className="mt-1 border-t border-cyan-400/30 pt-1">
                <CommandInputHeader
                    activeMode={activeMode}
                    onChangeMode={setActiveMode}
                    quantity={quantity}
                    onChangeQuantity={setQuantity}
                />
                <CommandInputGrid
                    commands={visibleCommands}
                    quantity={quantity}
                    onSelectCommand={(def) => onSelectCommand(def, quantity)}
                />
            </div>
        </>
    );
}

export function CommandInputPopup({
    coord,
    terrain,
    islandName,
    visible,
    onClose,
    onSelectCommand,
}: CommandInputPopupProps) {
    return (
        <div
            className={`absolute top-1/2 left-1/2 z-40 w-4/5 max-w-120 -translate-x-1/2 rounded-xs border border-cyan-400/50 bg-[rgba(10,25,45,0.75)] shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all duration-150 ease-out md:w-1/3 md:max-w-none ${
                visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
        >
            <button
                type="button"
                onClick={onClose}
                className="absolute top-2 right-2 flex size-7 cursor-pointer items-center justify-center rounded-xs bg-cyan-900/40 text-lg text-cyan-300 transition-colors select-none hover:bg-cyan-800/50"
                aria-label="閉じる"
            >
                ×
            </button>
            <CommandInputContent
                key={toCoordKey(coord)}
                coord={coord}
                terrain={terrain}
                islandName={islandName}
                onSelectCommand={onSelectCommand}
            />
        </div>
    );
}
