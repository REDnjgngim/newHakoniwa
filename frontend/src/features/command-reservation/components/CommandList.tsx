import { useRef, useEffect, useState, useLayoutEffect } from 'react';
import type { ReservationCommand } from '../types';
import type { SectorTerrainData } from '@/shared/terrain-types';
import type { IslandSearchOption } from './IslandSearchSelect';
import type { ReactNode } from 'react';
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
    const handleReorder = (fromIndex: number, toIndex: number) => {
        const result = mapReorderIndicesToIds(commands, fromIndex, toIndex);
        if (!result) return;
        onReorderCommands(result.fromId, result.toId);
    };

    const viewportRef = useRef<HTMLDivElement | null>(null);
    const listContainerRef = useRef<HTMLDivElement | null>(null);
    const { visibleExitingItems, minContainerHeight, setRowRef, setItemRef, setExitingRef } = useCommandListAnimation({
        commands,
        listContainerRef,
    });
    const {
        draggingIndex,
        dragOverIndex,
        isPointerDragging,
        draggingItemTop,
        isSettling,
        handlePointerDown,
        settleComplete,
    } = useCommandReorder({
        itemCount: commands.length,
        viewportElementRef: viewportRef,
        onReorder: handleReorder,
    });

    const [settlingTargetTop, setSettlingTargetTop] = useState<number | null>(null);
    const [settlingCommand, setSettlingCommand] = useState<ReservationCommand | null>(null);

    useLayoutEffect(() => {
        if (!isSettling) return;
        const placeholder = viewportRef.current?.querySelector('[data-testid="drag-target-placeholder"]');
        if (!(placeholder instanceof HTMLElement)) {
            const frame = requestAnimationFrame(() => setSettlingTargetTop(draggingItemTop ?? floatingTop));
            // fallback: if no target, complete
            if (draggingItemTop === null && floatingTop === null) settleComplete();
            return () => cancelAnimationFrame(frame);
        }
        const container = listContainerRef.current;
        if (!(container instanceof HTMLElement)) {
            settleComplete();
            return;
        }
        const containerRect = container.getBoundingClientRect();
        const placeholderRect = placeholder.getBoundingClientRect();
        const targetTop = placeholderRect.top - containerRect.top;
        if (draggingItemTop !== null && Math.abs(targetTop - draggingItemTop) < 0.5) {
            const frame = requestAnimationFrame(() => {
                settleComplete();
                setSettlingTargetTop(null);
            });
            return () => cancelAnimationFrame(frame);
        }
        const frame = requestAnimationFrame(() => setSettlingTargetTop(targetTop));
        const fallbackTimer = window.setTimeout(() => {
            settleComplete();
            setSettlingTargetTop(null);
        }, 140);
        return () => {
            cancelAnimationFrame(frame);
            window.clearTimeout(fallbackTimer);
        };
        // eslint-disable-next-line @eslint-react/exhaustive-deps
    }, [isSettling, settleComplete, draggingItemTop]);

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
            onSelectCommand(null);
        } else {
            onSelectCommand(command);
        }
    };

    const draggedCommand = draggingIndex !== null ? commands[draggingIndex] : null;

    const lastDraggedCommandRef = useRef<ReservationCommand | null>(null);
    if (isPointerDragging && draggedCommand !== null) {
        lastDraggedCommandRef.current = draggedCommand;
    }
    const floatingCommand = isSettling
        ? (settlingCommand ?? lastDraggedCommandRef.current ?? draggedCommand)
        : draggedCommand;

    useEffect(() => {
        if (isSettling && settlingCommand === null && draggedCommand !== null) {
            setSettlingCommand(draggedCommand);
        }
        if (!isSettling) {
            setSettlingCommand(null);
        }
    }, [isSettling, draggedCommand, settlingCommand]);

    const [isGrabEnlarged, setIsGrabEnlarged] = useState(false);

    const currentFloatingTop = draggingItemTop;

    useEffect(() => {
        if (!isPointerDragging) {
            setIsGrabEnlarged(false);
            return;
        }
        const frame = requestAnimationFrame(() => setIsGrabEnlarged(true));
        return () => cancelAnimationFrame(frame);
    }, [isPointerDragging]);

    const showTargetPlaceholder = (isPointerDragging || isSettling) && draggingIndex !== null && dragOverIndex !== null;

    const renderRows = () => {
        const rows: ReactNode[] = [];
        let nonDraggedSeen = 0;

        commands.forEach((cmd, index) => {
            const settlingCmd = settlingCommand ?? draggedCommand;
            if (isSettling && settlingCmd !== null && cmd.id === settlingCmd.id) return;
            if (!isSettling && index === draggingIndex) return;
            const isExpanded = expandedIds.has(cmd.id);
            const isFocused = focusedId === cmd.id;

            if (showTargetPlaceholder && nonDraggedSeen === dragOverIndex) {
                rows.push(
                    <div
                        key={`drag-target-placeholder-${dragOverIndex}`}
                        data-testid="drag-target-placeholder"
                        className="mb-2 rounded border-2 border-dashed border-slate-500/50 bg-slate-900/30"
                        style={{ height: 52 }}
                    />
                );
            }

            rows.push(
                <div
                    key={cmd.id}
                    ref={(el) => setRowRef(cmd.id, el)}
                    data-command-row-index={index}
                    onPointerDown={(e) => handlePointerDown(e, index)}
                    className="relative z-10 touch-pan-y"
                >
                    <div ref={(el) => setItemRef(cmd.id, el)}>
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
                                    islandOptions={islandOptions}
                                />
                            )}
                            onToggleExpand={() => onToggleExpand(cmd.id)}
                            onSelect={() => handleRowSelect(cmd)}
                            onDelete={() => onDeleteCommand(cmd.id)}
                        />
                    </div>
                </div>
            );

            nonDraggedSeen += 1;
        });
        if (showTargetPlaceholder && dragOverIndex === nonDraggedSeen) {
            rows.push(
                <div
                    key={`drag-target-placeholder-${dragOverIndex}`}
                    data-testid="drag-target-placeholder"
                    className="mb-2 rounded border-2 border-dashed border-slate-500/50 bg-slate-900/30"
                    style={{ height: 52 }}
                />
            );
        }

        return rows;
    };

    const floatingTop = currentFloatingTop;

    let floatingElement: ReactNode = null;
    if ((isPointerDragging || isSettling) && floatingCommand !== null && floatingTop !== null) {
        floatingElement = (
            <div
                className="pointer-events-none absolute inset-x-0 z-20 opacity-90"
                style={{
                    top: isSettling && settlingTargetTop !== null ? settlingTargetTop : floatingTop,
                    transition: isSettling ? 'top 100ms ease-out' : undefined,
                    opacity: 0.9,
                }}
                onTransitionEnd={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (isSettling) {
                        settleComplete();
                        setSettlingTargetTop(null);
                    }
                }}
            >
                <div
                    className={`${isGrabEnlarged ? 'scale-[1.03]' : 'scale-100'} shadow-xl transition-transform duration-100 ease-out`}
                >
                    <CommandListItem
                        command={floatingCommand}
                        terrain={terrain}
                        displayOrder={draggingIndex === null ? 1 : draggingIndex + 1}
                        isExpanded={false}
                        isFocused={focusedId === floatingCommand.id}
                        renderDetail={() => null}
                        onToggleExpand={() => {}}
                        onSelect={() => {}}
                        onDelete={() => {}}
                    />
                </div>
            </div>
        );
    }
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
                {commands.length === 0 && visibleExitingItems.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-400">予約されたコマンドはありません</div>
                ) : (
                    renderRows()
                )}
                {floatingElement}
            </div>
        </div>
    );
}
