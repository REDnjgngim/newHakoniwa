import { useEffect, useState } from 'react';
import { useCommandInput } from '../hooks/use-command-input';
import { CommandInputHeader } from './CommandInputHeader';
import { CommandInputGrid } from './CommandInputGrid';
import type { CommandInputPopupProps } from '../types';
import type { CommandDefinition } from '@/features/command-reservation/command-definition-types';

export function CommandInputPopup({
    coord,
    terrainName,
    terrainImage,
    islandName,
    anchorPosition,
    visible,
    onClose,
    onSelectCommand,
}: CommandInputPopupProps) {
    const { activeMode, setActiveMode, quantity, setQuantity, visibleCommands } = useCommandInput();

    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const id = window.requestAnimationFrame(() => setIsVisible(true));
        return () => window.cancelAnimationFrame(id);
    }, []);

    const handleSelect = (def: CommandDefinition) => {
        onSelectCommand(def, quantity);
    };

    return (
        <div
            style={{
                left: `${anchorPosition.x}px`,
                top: `${anchorPosition.y}px`,
                transform: 'translateX(-50%)',
            }}
            className={`absolute z-40 w-4/5 max-w-120 rounded-xs border border-cyan-400/50 bg-[rgba(10,25,45,0.75)] shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all duration-150 ease-out md:w-1/3 md:max-w-none ${
                isVisible && visible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerMove={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            <button
                type="button"
                onClick={onClose}
                className="absolute top-2 right-2 flex size-7 cursor-pointer items-center justify-center rounded-xs bg-cyan-900/40 text-lg text-cyan-300 transition-colors select-none hover:bg-cyan-800/50"
                aria-label="閉じる"
            >
                ×
            </button>
            <div className="flex items-center justify-start gap-1 p-1">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xs bg-[rgba(0,0,0,0.3)]">
                    {terrainImage ? (
                        <img
                            src={terrainImage}
                            alt={terrainName}
                            className="size-9 object-contain [image-rendering:pixelated]"
                        />
                    ) : (
                        <span className="text-xs text-cyan-200/70">?</span>
                    )}
                </div>
                <div className="min-w-0 flex-1 text-left">
                    <div className="truncate text-xs font-bold text-cyan-300">{islandName ?? '所属不明'}</div>
                    <div className="truncate font-mono text-xs text-cyan-200/90 tabular-nums">
                        ({coord.x},{coord.y}) {terrainName}
                    </div>
                </div>
            </div>
            <div className="mt-1 border-t border-cyan-400/30 pt-1">
                <CommandInputHeader
                    activeMode={activeMode}
                    onChangeMode={setActiveMode}
                    quantity={quantity}
                    onChangeQuantity={setQuantity}
                />
                <CommandInputGrid commands={visibleCommands} quantity={quantity} onSelectCommand={handleSelect} />
            </div>
        </div>
    );
}
