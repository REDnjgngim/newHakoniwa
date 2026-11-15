import { memo, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { ReservationCommand } from '../types';
import type { SectorTerrainData } from '@/shared/terrain-types';
import type { IslandSearchOption } from './IslandSearchSelect';
import { CommandListItem } from './CommandListItem';
import { CommandDetailEditor } from './CommandDetailEditor';
import { mapReorderIndicesToIds } from '../command-list-reorder';
import { useCommandReorder } from '../hooks/use-command-reorder';
import { useCommandListAnimation } from '../hooks/use-command-list-animation';

export type CommandListProps = {
    commands: ReservationCommand[];
    terrain?: SectorTerrainData;
    expandedIds: Set<string>;
    focusedId: string | null;
    islandOptions?: IslandSearchOption[];
    renderDetail?: (command: ReservationCommand) => ReactNode;
    onToggleExpand: (id: string) => void;
    onSelectCommand: (command: ReservationCommand | null) => void;
    onUpdateCommand: (id: string, partial: Partial<ReservationCommand>) => void;
    onDeleteCommand: (id: string) => void;
    onReorderCommands: (fromId: string, toId: string | null) => void;
};

type CommandListRowItemProps = {
    command: ReservationCommand;
    terrain?: SectorTerrainData;
    displayOrder: number;
    isExpanded: boolean;
    isFocused: boolean;
    islandOptions?: IslandSearchOption[];
    onToggleExpand: (id: string) => void;
    onSelectCommand: (command: ReservationCommand) => void;
    onUpdateCommand: (id: string, partial: Partial<ReservationCommand>) => void;
    onDeleteCommand: (id: string) => void;
};

const CommandListRowItem = memo(function CommandListRowItem({
    command,
    terrain,
    displayOrder,
    isExpanded,
    isFocused,
    islandOptions,
    onToggleExpand,
    onSelectCommand,
    onUpdateCommand,
    onDeleteCommand,
}: CommandListRowItemProps) {
    const handleToggleExpand = useCallback(() => {
        onToggleExpand(command.id);
    }, [command.id, onToggleExpand]);

    const handleSelect = useCallback(() => {
        onSelectCommand(command);
    }, [command, onSelectCommand]);

    const handleDelete = useCallback(() => {
        onDeleteCommand(command.id);
    }, [command.id, onDeleteCommand]);

    const renderDetail = useCallback(
        (cmd: ReservationCommand) => (
            <CommandDetailEditor
                command={cmd}
                onUpdate={(updated) => onUpdateCommand(cmd.id, updated)}
                islandOptions={islandOptions}
            />
        ),
        [islandOptions, onUpdateCommand]
    );

    return (
        <CommandListItem
            command={command}
            terrain={terrain}
            displayOrder={displayOrder}
            isExpanded={isExpanded}
            isFocused={isFocused}
            renderDetail={renderDetail}
            onToggleExpand={handleToggleExpand}
            onSelect={handleSelect}
            onDelete={handleDelete}
        />
    );
});

export function CommandList({
    commands,
    terrain,
    expandedIds,
    focusedId,
    islandOptions,
    onToggleExpand,
    onSelectCommand,
    onUpdateCommand,
    onDeleteCommand,
    onReorderCommands,
}: CommandListProps) {
    const handleReorder = useCallback(
        (fromIndex: number, toIndex: number) => {
            const result = mapReorderIndicesToIds(commands, fromIndex, toIndex);
            if (!result) return;
            onReorderCommands(result.fromId, result.toId);
        },
        [commands, onReorderCommands]
    );

    const viewportRef = useRef<HTMLDivElement | null>(null);
    const listContainerRef = useRef<HTMLDivElement | null>(null);

    const { draggingIndex, dragPhase, rowShifts, placeholderTop, placeholderHeight, registerRow, handlePointerDown } =
        useCommandReorder({
            itemCount: commands.length,
            viewportElementRef: viewportRef,
            listContainerElementRef: listContainerRef,
            onReorder: handleReorder,
        });

    const isReorderActive = dragPhase !== 'idle';

    const { visibleExitingItems, minContainerHeight, setRowRef, setItemRef, setExitingRef } = useCommandListAnimation({
        commands,
        listContainerRef,
        viewportRef,
        isReorderActive,
    });

    useEffect(() => {
        if (dragPhase === 'dragging') {
            document.body.style.cursor = 'grabbing';
            return () => {
                document.body.style.cursor = '';
            };
        }
        document.body.style.cursor = '';
    }, [dragPhase]);

    const handleRowSelect = useCallback(
        (command: ReservationCommand) => {
            if (focusedId === command.id) {
                onSelectCommand(null);
            } else {
                onSelectCommand(command);
            }
        },
        [focusedId, onSelectCommand]
    );

    return (
        <div
            ref={viewportRef}
            data-testid="command-list-container"
            className="flex-1 overflow-x-hidden overflow-y-auto p-2 select-none"
        >
            <div
                ref={listContainerRef}
                className="relative"
                style={minContainerHeight !== undefined ? { minHeight: minContainerHeight } : undefined}
            >
                {visibleExitingItems.map((item) => (
                    <div
                        key={`exiting-${item.command.id}`}
                        ref={(el) => setExitingRef(item.command.id, el)}
                        data-exiting-command-id={item.command.id}
                        className="pointer-events-none absolute inset-x-0 z-0 origin-center"
                        style={{ top: item.top, height: item.height }}
                        aria-hidden="true"
                    >
                        <CommandListItem
                            command={item.command}
                            terrain={terrain}
                            displayOrder={item.displayOrder}
                            isExpanded={false}
                            isFocused={false}
                            renderDetail={() => null}
                            onToggleExpand={() => {}}
                            onSelect={() => {}}
                            onDelete={() => {}}
                        />
                    </div>
                ))}

                {dragPhase === 'dragging' && placeholderTop !== null && placeholderHeight !== null && (
                    <div
                        data-testid="drag-target-placeholder"
                        className="pointer-events-none absolute inset-x-0 top-0 z-0 rounded border-2 border-dashed border-slate-500/50 bg-slate-900/30 transition-transform duration-150 ease-out"
                        style={{
                            height: placeholderHeight,
                            transform: `translateY(${placeholderTop}px)`,
                        }}
                    />
                )}

                {commands.length === 0 && visibleExitingItems.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-400">予約されたコマンドはありません</div>
                ) : (
                    commands.map((cmd, index) => {
                        const isDraggedRow = isReorderActive && index === draggingIndex;
                        const shiftY = rowShifts[index] ?? 0;

                        let rowClass = 'relative touch-pan-y ';
                        if (isDraggedRow) {
                            rowClass +=
                                dragPhase === 'dragging'
                                    ? 'z-20 opacity-90 shadow-xl transition-none'
                                    : 'z-20 opacity-95';
                        } else if (isReorderActive) {
                            rowClass += 'z-10 transition-transform duration-150 ease-out';
                        } else {
                            rowClass += 'z-10';
                        }

                        // ドラッグ行は ref 経由で直接 transform を制御するため、style.transform を渡さない
                        const rowStyle =
                            !isDraggedRow && isReorderActive ? { transform: `translateY(${shiftY}px)` } : undefined;

                        return (
                            <div
                                key={cmd.id}
                                ref={(el) => {
                                    setRowRef(cmd.id, el);
                                    registerRow(index, el);
                                }}
                                data-command-row-index={index}
                                onPointerDown={(e) => handlePointerDown(e, index)}
                                className={rowClass}
                                style={rowStyle}
                            >
                                <div ref={(el) => setItemRef(cmd.id, el)}>
                                    <CommandListRowItem
                                        command={cmd}
                                        terrain={terrain}
                                        displayOrder={index + 1}
                                        isExpanded={expandedIds.has(cmd.id)}
                                        isFocused={focusedId === cmd.id}
                                        islandOptions={islandOptions}
                                        onToggleExpand={onToggleExpand}
                                        onSelectCommand={handleRowSelect}
                                        onUpdateCommand={onUpdateCommand}
                                        onDeleteCommand={onDeleteCommand}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
