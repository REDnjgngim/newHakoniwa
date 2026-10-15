import React, { useRef } from 'react';
import type { ReservationCommand } from '../../types/command-reservation';
import { CommandListItem } from './CommandListItem';
import { CommandDetailEditor } from './CommandDetailEditor';
import { useCommandReorder } from '../../hooks/useCommandReorder';

export interface CommandListProps {
    commands: ReservationCommand[];
    expandedIds: Set<string>;
    focusedId: string | null;
    onToggleExpand: (id: string) => void;
    onSelectCommand: (command: ReservationCommand | null) => void;
    onUpdateCommand: (id: string, partial: Partial<ReservationCommand>) => void;
    onDeleteCommand: (id: string) => void;
    onReorderCommands: (fromIndex: number, toIndex: number) => void;
}

export const CommandList: React.FC<CommandListProps> = ({
    commands,
    expandedIds,
    focusedId,
    onToggleExpand,
    onSelectCommand,
    onUpdateCommand,
    onDeleteCommand,
    onReorderCommands,
}) => {
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const {
        draggingIndex,
        dragOverIndex,
        dragOffsetY,
        isPointerDragging,
        handleHtml5DragStart,
        handleHtml5DragOver,
        handleHtml5DragEnd,
        handlePointerDown,
    } = useCommandReorder({
        itemCount: commands.length,
        viewportElementRef: viewportRef,
        onReorder: onReorderCommands,
    });

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
                    // 上へ移動（または同じ位置）: dragOverIndex の行の上にライン
                    const isInsertAbove =
                        dragOverIndex === index && draggingIndex !== null && dragOverIndex <= draggingIndex;
                    // 下へ移動: dragOverIndex の行の下にライン
                    const isInsertBelow =
                        dragOverIndex === index && draggingIndex !== null && dragOverIndex > draggingIndex;
                    // 高速（青色）同士が連続する場合のみ連結表示する
                    const prevCommand = commands[index - 1];
                    const nextCommand = commands[index + 1];
                    const isConnectedToPrev = cmd.commandType === 'fast' && prevCommand?.commandType === 'fast';
                    const isConnectedToNext = cmd.commandType === 'fast' && nextCommand?.commandType === 'fast';

                    return (
                        <div
                            key={cmd.id}
                            data-command-row-index={index}
                            draggable={false}
                            onDragStart={(e) => e.preventDefault()}
                            onDragOver={(e) => handleHtml5DragOver(e, index)}
                            onDragEnd={handleHtml5DragEnd}
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
                            className={`transition-opacity ${isPointerDragging && draggingIndex === index ? 'relative z-20 touch-none shadow-xl' : 'touch-pan-y'} ${draggingIndex === index ? 'opacity-90' : 'opacity-100'}`}
                        >
                            <CommandListItem
                                command={cmd}
                                isExpanded={isExpanded}
                                isFocused={isFocused}
                                isInsertAbove={isInsertAbove}
                                isInsertBelow={isInsertBelow}
                                isConnectedToPrev={isConnectedToPrev}
                                isConnectedToNext={isConnectedToNext}
                                detailContent={
                                    <CommandDetailEditor
                                        command={cmd}
                                        onUpdate={(updated) => onUpdateCommand(cmd.id, updated)}
                                    />
                                }
                                onToggleExpand={() => onToggleExpand(cmd.id)}
                                onSelect={() => handleRowSelect(cmd)}
                                onDelete={() => onDeleteCommand(cmd.id)}
                                dragHandleProps={{
                                    draggable: !isPointerDragging,
                                    onDragStart: (e) => {
                                        e.stopPropagation();
                                        handleHtml5DragStart(index);
                                    },
                                }}
                            />
                        </div>
                    );
                })
            )}
        </div>
    );
};
