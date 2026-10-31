import { useRef, useEffect } from 'react';
import type { ReservationCommand } from '../types';
import type { SectorTerrainData } from '@/shared/terrain-types';
import type { IslandSearchOption } from './IslandSearchSelect';
import type { ReactNode } from 'react';
import { CommandListItem } from './CommandListItem';
import { CommandDetailEditor } from './CommandDetailEditor';
import { useCommandReorder } from '../hooks/use-command-reorder';

export type CommandListProps = {
    commands: ReservationCommand[];
    terrain?: SectorTerrainData;
    expandedIds: Set<string>;
    focusedId: string | null;
    islandOptions?: IslandSearchOption[];
    itemOptions?: IslandSearchOption[];
    fleetOptions?: IslandSearchOption[];
    renderDetail?: (command: ReservationCommand) => ReactNode;
    onToggleExpand: (id: string) => void;
    onSelectCommand: (command: ReservationCommand | null) => void;
    onUpdateCommand: (id: string, partial: Partial<ReservationCommand>) => void;
    onDeleteCommand: (id: string) => void;
    onReorderCommands: (fromIndex: number, toIndex: number) => void;
};

export function CommandList({
    commands,
    terrain,
    expandedIds,
    focusedId,
    onToggleExpand,
    onSelectCommand,
    onUpdateCommand,
    onDeleteCommand,
    onReorderCommands,
}: CommandListProps) {
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const { draggingIndex, dragOffsetY, isPointerDragging, handlePointerDown } = useCommandReorder({
        itemCount: commands.length,
        viewportElementRef: viewportRef,
        onReorder: onReorderCommands,
    });

    useEffect(() => {
        if (isPointerDragging) {
            document.body.style.cursor = 'grabbing';
            return () => {
                document.body.style.cursor = '';
            };
        }
        document.body.style.cursor = '';
    }, [isPointerDragging]);

    const handleRowSelect = (command: ReservationCommand) => {
        if (focusedId === command.id) {
            onSelectCommand(null); // 再タップで解除
        } else {
            onSelectCommand(command);
        }
    };

    return (
        <div ref={viewportRef} data-testid="command-list-container" className="flex-1 overflow-y-auto p-2 select-none">
            {commands.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">予約されたコマンドはありません</div>
            ) : (
                commands.map((cmd, index) => {
                    const isExpanded = expandedIds.has(cmd.id);
                    const isFocused = focusedId === cmd.id;
                    // 高速（青色）同士が連続する場合のみ連結表示する

                    return (
                        <div
                            key={cmd.id}
                            data-command-row-index={index}
                            onPointerDown={(e) => handlePointerDown(e, index)}
                            onClickCapture={
                                isPointerDragging && draggingIndex === index
                                    ? (e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                      }
                                    : undefined
                            }
                            style={
                                isPointerDragging && draggingIndex === index
                                    ? { transform: `translateY(${dragOffsetY}px)`, touchAction: 'none' }
                                    : undefined
                            }
                            className={`${isPointerDragging && draggingIndex === index ? 'relative z-20 cursor-grabbing touch-none shadow-xl' : 'touch-pan-y'} ${draggingIndex === index ? 'opacity-90' : 'opacity-100'}`}
                        >
                            <div
                                className={
                                    isPointerDragging && draggingIndex === index
                                        ? 'scale-[1.02] transition-transform duration-100'
                                        : ''
                                }
                            >
                                <CommandListItem
                                    command={cmd}
                                    terrain={terrain}
                                    displayOrder={index + 1}
                                    isExpanded={isExpanded}
                                    isFocused={isFocused}
                                    renderDetail={(command) => (
                                        <CommandDetailEditor
                                            command={command}
                                            onUpdate={(updated) => onUpdateCommand(command.id, updated)}
                                        />
                                    )}
                                    onToggleExpand={() => onToggleExpand(cmd.id)}
                                    onSelect={() => handleRowSelect(cmd)}
                                    onDelete={() => onDeleteCommand(cmd.id)}
                                />
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
