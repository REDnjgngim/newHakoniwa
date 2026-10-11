import React, { useState } from 'react';
import type { ReservationCommand } from '../../types/command-reservation';
import { CommandListItem } from './CommandListItem';
import { CommandDetailEditor } from './CommandDetailEditor';

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
    // ドラッグ＆ドロップ状態
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = (index: number) => {
        setDraggingIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragEnd = () => {
        if (draggingIndex !== null && dragOverIndex !== null && draggingIndex !== dragOverIndex) {
            onReorderCommands(draggingIndex, dragOverIndex);
        }
        setDraggingIndex(null);
        setDragOverIndex(null);
    };

    const handleRowSelect = (command: ReservationCommand) => {
        if (focusedId === command.id) {
            onSelectCommand(null); // 再タップで解除
        } else {
            onSelectCommand(command);
        }
    };

    return (
        <div data-testid="command-list-container" className="flex-1 space-y-1 overflow-y-auto p-2 select-none">
            {commands.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">予約されたコマンドはありません</div>
            ) : (
                commands.map((cmd, index) => {
                    const isExpanded = expandedIds.has(cmd.id);
                    const isFocused = focusedId === cmd.id;
                    const isInsertTarget = dragOverIndex === index || (focusedId === cmd.id && draggingIndex === null);

                    return (
                        <div
                            key={cmd.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`transition-opacity ${draggingIndex === index ? 'opacity-40' : 'opacity-100'}`}
                        >
                            <CommandListItem
                                command={cmd}
                                isExpanded={isExpanded}
                                isFocused={isFocused}
                                isInsertTarget={isInsertTarget}
                                onToggleExpand={() => onToggleExpand(cmd.id)}
                                onSelect={() => handleRowSelect(cmd)}
                                onDelete={() => onDeleteCommand(cmd.id)}
                            />

                            {/* アコーディオン展開時の詳細編集パネル */}
                            {isExpanded && (
                                <CommandDetailEditor
                                    command={cmd}
                                    onUpdate={(updated) => onUpdateCommand(cmd.id, updated)}
                                />
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
};
