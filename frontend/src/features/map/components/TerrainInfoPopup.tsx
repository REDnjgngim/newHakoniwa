import { useCommandInput } from '@/features/command-input-popup/hooks/use-command-input';
import { CommandInputHeader } from '@/features/command-input-popup/components/CommandInputHeader';
import { CommandInputGrid } from '@/features/command-input-popup/components/CommandInputGrid';
import type { CommandDefinition } from '@/features/command-reservation/command-definition-types';

import type { TerrainInfoPopupProps } from '../engine/types';

export type { TerrainInfoPopupProps } from '../engine/types';

export function TerrainInfoPopup({
    coord,
    terrainName,
    terrainImage,
    islandName,
    position,
    visible,
    isCommandOpen,
    onToggleCommandPanel,
    onSelectCommand,
}: TerrainInfoPopupProps) {
    const { activeMode, setActiveMode, quantity, setQuantity, visibleCommands } = useCommandInput();

    const handleSelect = (def: CommandDefinition) => {
        onSelectCommand?.(def, quantity);
    };

    return (
        <div
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: 'translateX(-50%)',
            }}
            className={`pointer-events-auto absolute z-40 max-h-[85vh] w-4/5 max-w-120 overflow-y-auto rounded-xs border border-cyan-400/50 bg-[rgba(10,25,45,0.75)] p-1 text-left shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all duration-150 ease-out md:w-1/3 md:max-w-none ${
                visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerMove={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center justify-start gap-1">
                {/* 左側: 地形アイコン */}
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

                {/* 中央: 情報テキスト */}
                <div className="min-w-0 flex-1 text-left">
                    <div className="truncate text-xs font-bold text-cyan-300">{islandName ?? '所属不明'}</div>
                    <div className="truncate font-mono text-xs text-cyan-200/90 tabular-nums">
                        ({coord.x},{coord.y}) {terrainName}
                    </div>
                </div>

                {/* 右側: コマンド開閉ボタン */}
                {isCommandOpen && (
                    <button
                        type="button"
                        onClick={onToggleCommandPanel}
                        className="pointer-events-auto flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xs bg-cyan-900/40 text-3xl leading-none font-medium text-cyan-300 transition-colors select-none hover:bg-cyan-800/50"
                    >
                        <span className="leading-none" style={{ transform: 'translateY(-2px)' }}>
                            ×
                        </span>
                    </button>
                )}
            </div>

            {isCommandOpen && (
                <div className="pointer-events-auto mt-1 border-t border-cyan-400/30 pt-1">
                    <CommandInputHeader
                        activeMode={activeMode}
                        onChangeMode={setActiveMode}
                        quantity={quantity}
                        onChangeQuantity={setQuantity}
                    />
                    <CommandInputGrid commands={visibleCommands} quantity={quantity} onSelectCommand={handleSelect} />
                </div>
            )}
        </div>
    );
}
