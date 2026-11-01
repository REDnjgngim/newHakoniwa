import { useRef, useEffect, useState, useLayoutEffect } from 'react';
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
    onReorderCommands: (fromId: string, toId: string | null) => void;
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
    const handleReorder = (fromIndex: number, toIndex: number) => {
        const fromId = commands[fromIndex]?.id;
        if (!fromId) return;
        const nonDragged = commands.filter((_, i) => i !== fromIndex);
        const toId = toIndex >= nonDragged.length ? null : (nonDragged[toIndex]?.id ?? null);
        onReorderCommands(fromId, toId);
    };

    const viewportRef = useRef<HTMLDivElement | null>(null);
    const {
        draggingIndex,
        dragOverIndex,
        isPointerDragging,
        draggingItemHeight,
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
        const container = viewportRef.current?.querySelector('.relative');
        if (!(container instanceof HTMLElement)) {
            settleComplete();
            return;
        }
        const containerRect = container.getBoundingClientRect();
        const placeholderRect = placeholder.getBoundingClientRect();
        const targetTop = placeholderRect.top - containerRect.top;
        const frame = requestAnimationFrame(() => setSettlingTargetTop(targetTop));
        return () => cancelAnimationFrame(frame);
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
                        style={{ height: draggingItemHeight ?? undefined }}
                    />
                );
            }

            rows.push(
                <div
                    key={cmd.id}
                    data-command-row-index={index}
                    onPointerDown={(e) => handlePointerDown(e, index)}
                    className="touch-pan-y transition-all duration-150"
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
            );

            nonDraggedSeen += 1;
        });
        if (showTargetPlaceholder && dragOverIndex === nonDraggedSeen) {
            rows.push(
                <div
                    key={`drag-target-placeholder-${dragOverIndex}`}
                    data-testid="drag-target-placeholder"
                    className="mb-2 rounded border-2 border-dashed border-slate-500/50 bg-slate-900/30"
                    style={{ height: draggingItemHeight ?? undefined }}
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
                onTransitionEnd={() => {
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
                        isExpanded={expandedIds.has(floatingCommand.id)}
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
        <div ref={viewportRef} data-testid="command-list-container" className="flex-1 overflow-y-auto p-2 select-none">
            <div className="relative">
                {commands.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-400">予約されたコマンドはありません</div>
                ) : (
                    renderRows()
                )}
                {floatingElement}
            </div>
        </div>
    );
}
