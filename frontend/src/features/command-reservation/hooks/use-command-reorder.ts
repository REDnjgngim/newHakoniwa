import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
    type RefObject,
} from 'react';
import { calcDragOverIndex, calcDropOffset, calcRowShifts } from '../command-list-reorder';

export type DragPhase = 'idle' | 'dragging' | 'settling';

export type UseCommandReorderOptions = {
    itemCount: number;
    viewportElementRef: RefObject<HTMLElement | null>;
    listContainerElementRef?: RefObject<HTMLElement | null>;
    onReorder: (fromIndex: number, toIndex: number) => void;
};

export type UseCommandReorderReturn = {
    draggingIndex: number | null;
    dragOverIndex: number | null;
    dragPhase: DragPhase;
    rowShifts: number[];
    placeholderTop: number | null;
    placeholderHeight: number | null;
    registerRow: (index: number, el: HTMLElement | null) => void;
    handlePointerDown: (event: ReactPointerEvent<HTMLElement>, index: number) => void;
};

type DragMetrics = {
    rowTops: number[];
    visualHeights: number[];
    stepHeights: number[];
};

type PointerDragState = {
    pointerId: number;
    startIndex: number;
    startClientY: number;
    startClientX: number;
    currentClientY: number;
    currentClientX: number;
    startScrollTop: number;
    activated: boolean;
    sourceElement: HTMLElement | null;
    metrics: DragMetrics;
};

const AUTO_SCROLL_MARGIN_PX = 56;
const AUTO_SCROLL_STEP_PX = 8;
const CLICK_SUPPRESS_MS = 400;
const CLICK_SUPPRESS_DY_PX = 8;
const DRAG_ACTIVATION_THRESHOLD_PX = 3;
const SETTLE_DURATION_MS = 120;
const SETTLE_FALLBACK_MS = 160;
const SETTLE_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

function measureDragMetrics(
    itemCount: number,
    rowElements: Map<number, HTMLElement>,
    containerEl: HTMLElement | null
): DragMetrics {
    const containerRect = containerEl?.getBoundingClientRect() ?? null;
    const rowTops: number[] = [];
    const visualHeights: number[] = [];

    for (let i = 0; i < itemCount; i += 1) {
        const el = rowElements.get(i);
        if (!el) {
            const prevTop = i > 0 ? rowTops[i - 1] + visualHeights[i - 1] : 0;
            rowTops.push(prevTop);
            visualHeights.push(0);
            continue;
        }
        const rect = el.getBoundingClientRect();
        const top = containerRect ? rect.top - containerRect.top : rect.top;
        rowTops.push(top);
        visualHeights.push(rect.height);
    }

    const stepHeights: number[] = [];
    const lastGap =
        itemCount >= 2
            ? Math.max(0, rowTops[itemCount - 1] - (rowTops[itemCount - 2] + visualHeights[itemCount - 2]))
            : 0;

    for (let i = 0; i < itemCount; i += 1) {
        if (i < itemCount - 1) {
            const diff = rowTops[i + 1] - rowTops[i];
            stepHeights.push(diff > 0 ? diff : visualHeights[i]);
        } else {
            stepHeights.push(visualHeights[i] + lastGap);
        }
    }

    return { rowTops, visualHeights, stepHeights };
}

function startSettleTransition(sourceEl: HTMLElement, dropOffset: number, onComplete: () => void): () => void {
    let completed = false;
    let fallbackTimerId = 0;

    const handleTransitionEnd = (transitionEvent: TransitionEvent) => {
        if (transitionEvent.target !== sourceEl || transitionEvent.propertyName !== 'transform') return;
        finish();
    };

    const cleanup = () => {
        if (fallbackTimerId !== 0) {
            window.clearTimeout(fallbackTimerId);
            fallbackTimerId = 0;
        }
        sourceEl.removeEventListener('transitionend', handleTransitionEnd);
    };

    const finish = () => {
        if (completed) return;
        completed = true;
        cleanup();
        onComplete();
    };

    sourceEl.addEventListener('transitionend', handleTransitionEnd);
    fallbackTimerId = window.setTimeout(finish, SETTLE_FALLBACK_MS);
    sourceEl.style.transition = `transform ${SETTLE_DURATION_MS}ms ${SETTLE_EASING}`;
    sourceEl.style.transform = `translateY(${dropOffset}px) scale(1)`;

    return cleanup;
}

/** PC・スマホ共通の Pointer Events による並び替え操作 */
export function useCommandReorder(options: UseCommandReorderOptions): UseCommandReorderReturn {
    const { itemCount, viewportElementRef: viewportRef, listContainerElementRef, onReorder } = options;
    const itemCountRef = useRef(itemCount);
    const onReorderRef = useRef(onReorder);
    useEffect(() => {
        itemCountRef.current = itemCount;
    }, [itemCount]);
    useEffect(() => {
        onReorderRef.current = onReorder;
    }, [onReorder]);

    const rowElementsRef = useRef<Map<number, HTMLElement>>(new Map());
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [dragPhase, setDragPhase] = useState<DragPhase>('idle');
    const [dragMetrics, setDragMetrics] = useState<DragMetrics | null>(null);

    const dragOverIndexRef = useRef<number | null>(null);
    const pointerStateRef = useRef<PointerDragState | null>(null);
    const activeSourceElementRef = useRef<HTMLElement | null>(null);
    const rafIdRef = useRef<number | null>(null);
    const suppressClickUntilRef = useRef(0);
    const settleCleanupRef = useRef<(() => void) | null>(null);

    // idle 遷移時の DOM コミット後（ペイント前）にインライン style を解除し、並び替え確定との 1 フレームずれによるチラつきを防ぐ
    useLayoutEffect(() => {
        if (dragPhase !== 'idle') return;
        const el = activeSourceElementRef.current;
        if (!el) return;
        el.style.transition = '';
        el.style.transform = '';
        el.style.willChange = '';
        activeSourceElementRef.current = null;
    }, [dragPhase]);

    const registerRow = useCallback((index: number, el: HTMLElement | null) => {
        if (el) {
            rowElementsRef.current.set(index, el);
        } else {
            rowElementsRef.current.delete(index);
        }
    }, []);

    const cancelPendingFrame = useCallback(() => {
        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
    }, []);

    const clearPointerState = useCallback(() => {
        cancelPendingFrame();
        pointerStateRef.current = null;
        dragOverIndexRef.current = null;
    }, [cancelPendingFrame]);

    const autoScrollViewport = useCallback(
        (clientY: number) => {
            const viewport = viewportRef.current;
            if (!viewport) return;
            const rect = viewport.getBoundingClientRect();
            if (clientY < rect.top + AUTO_SCROLL_MARGIN_PX) {
                viewport.scrollTop -= AUTO_SCROLL_STEP_PX;
            } else if (clientY > rect.bottom - AUTO_SCROLL_MARGIN_PX) {
                viewport.scrollTop += AUTO_SCROLL_STEP_PX;
            }
        },
        [viewportRef]
    );

    const handlePointerDown = useCallback(
        (event: ReactPointerEvent<HTMLElement>, index: number) => {
            if (settleCleanupRef.current) return;
            const viewport = viewportRef.current;
            if (!viewport) return;
            if (itemCountRef.current <= 1 || !rowElementsRef.current.has(index)) return;

            const target = event.target instanceof HTMLElement ? event.target : null;
            if (target?.closest('button, select, input, textarea, a')) return;
            const isHandle = target?.closest('[data-drag-handle]') !== null;
            if (!isHandle) return;

            const sourceElement = event.currentTarget;
            event.preventDefault();
            try {
                sourceElement?.setPointerCapture?.(event.pointerId);
            } catch {
                // capture不可でもwindowリスナーで継続する
            }

            const containerEl = listContainerElementRef?.current ?? viewport;
            const metrics = measureDragMetrics(itemCountRef.current, rowElementsRef.current, containerEl);
            const startScrollTop = viewport.scrollTop;

            pointerStateRef.current = {
                pointerId: event.pointerId,
                startIndex: index,
                startClientY: event.clientY,
                startClientX: event.clientX,
                currentClientY: event.clientY,
                currentClientX: event.clientX,
                startScrollTop,
                activated: false,
                sourceElement,
                metrics,
            };
        },
        [listContainerElementRef, viewportRef]
    );

    useEffect(() => {
        const applyDragFrame = () => {
            rafIdRef.current = null;
            const state = pointerStateRef.current;
            if (!state || !state.activated) return;

            autoScrollViewport(state.currentClientY);
            const currentScrollTop = viewportRef.current?.scrollTop ?? state.startScrollTop;
            const scrollDelta = currentScrollTop - state.startScrollTop;
            const pointerDeltaY = state.currentClientY - state.startClientY;
            const totalDeltaY = pointerDeltaY + scrollDelta;

            if (state.sourceElement) {
                state.sourceElement.style.transform = `translateY(${totalDeltaY}px) scale(1.03)`;
            }

            const { rowTops, visualHeights, stepHeights } = state.metrics;
            const startTop = rowTops[state.startIndex] ?? 0;
            const draggedHeight = visualHeights[state.startIndex] ?? stepHeights[state.startIndex] ?? 0;
            const draggedCenterY = startTop + totalDeltaY + draggedHeight / 2;
            const currentOver = dragOverIndexRef.current ?? state.startIndex;

            const nextOver = calcDragOverIndex({
                rowTops,
                visualHeights,
                stepHeights,
                fromIndex: state.startIndex,
                currentOverIndex: currentOver,
                draggedCenterY,
            });

            if (nextOver !== dragOverIndexRef.current) {
                dragOverIndexRef.current = nextOver;
                setDragOverIndex(nextOver);
            }
        };

        const handlePointerMove = (event: PointerEvent) => {
            const state = pointerStateRef.current;
            if (!state || event.pointerId !== state.pointerId) return;
            state.currentClientX = event.clientX;
            state.currentClientY = event.clientY;

            if (!state.activated) {
                const dx = event.clientX - state.startClientX;
                const dy = event.clientY - state.startClientY;
                if (Math.hypot(dx, dy) < DRAG_ACTIVATION_THRESHOLD_PX) return;
                state.activated = true;
                dragOverIndexRef.current = state.startIndex;
                activeSourceElementRef.current = state.sourceElement;
                if (state.sourceElement) {
                    state.sourceElement.style.willChange = 'transform';
                }
                setDragMetrics(state.metrics);
                setDraggingIndex(state.startIndex);
                setDragOverIndex(state.startIndex);
                setDragPhase('dragging');
            }

            if (rafIdRef.current === null) {
                rafIdRef.current = requestAnimationFrame(applyDragFrame);
            }
        };

        const finishPointerDrag = (event: PointerEvent, cancelled: boolean) => {
            const state = pointerStateRef.current;
            if (!state || event.pointerId !== state.pointerId) return;

            const wasActivated = state.activated;
            const fromIndex = state.startIndex;
            const movedDy = Math.abs(state.currentClientY - state.startClientY);
            const toIndex = cancelled ? fromIndex : (dragOverIndexRef.current ?? fromIndex);
            const sourceEl = state.sourceElement;
            const metrics = state.metrics;

            clearPointerState();
            if (!wasActivated) return;

            // ドラッグ直後の合成clickによる行選択の誤発火を抑止する
            if (movedDy > CLICK_SUPPRESS_DY_PX || toIndex !== fromIndex) {
                suppressClickUntilRef.current = Date.now() + CLICK_SUPPRESS_MS;
            }

            if (cancelled) {
                setDragOverIndex(fromIndex);
            }

            const dropOffset = calcDropOffset({
                heights: metrics.stepHeights,
                fromIndex,
                toIndex,
            });

            const completeSettle = () => {
                settleCleanupRef.current = null;

                if (!cancelled && toIndex !== fromIndex) {
                    onReorderRef.current(fromIndex, toIndex);
                }

                setDraggingIndex(null);
                setDragOverIndex(null);
                setDragMetrics(null);
                setDragPhase('idle');
            };

            if (!sourceEl) {
                completeSettle();
                return;
            }

            setDragPhase('settling');
            settleCleanupRef.current = startSettleTransition(sourceEl, dropOffset, completeSettle);
        };

        const handlePointerUp = (event: PointerEvent) => finishPointerDrag(event, false);
        const handlePointerCancel = (event: PointerEvent) => finishPointerDrag(event, true);

        // ドラッグ直後のclickをキャプチャ段階で抑止する（行選択の誤発火防止）
        const handleClickCapture = (event: MouseEvent) => {
            if (Date.now() < suppressClickUntilRef.current) {
                event.stopPropagation();
                event.preventDefault();
            }
        };

        // ドラッグ中はブラウザのスクロールを抑止する（非パッシブ必須）
        const handleTouchMove = (event: TouchEvent) => {
            if (pointerStateRef.current?.activated) {
                event.preventDefault();
            }
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerCancel);
        window.addEventListener('click', handleClickCapture, true);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        return () => {
            cancelPendingFrame();
            settleCleanupRef.current?.();
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerCancel);
            window.removeEventListener('click', handleClickCapture, true);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, [autoScrollViewport, cancelPendingFrame, clearPointerState, viewportRef]);

    const rowShifts = useMemo(() => {
        if (dragPhase === 'idle' || draggingIndex === null || dragOverIndex === null || !dragMetrics) {
            return [];
        }
        return calcRowShifts({
            heights: dragMetrics.stepHeights,
            fromIndex: draggingIndex,
            toIndex: dragOverIndex,
        });
    }, [dragMetrics, dragOverIndex, dragPhase, draggingIndex]);

    const { placeholderTop, placeholderHeight } = useMemo(() => {
        if (dragPhase !== 'dragging' || draggingIndex === null || dragOverIndex === null || !dragMetrics) {
            return { placeholderTop: null, placeholderHeight: null };
        }
        const startTop = dragMetrics.rowTops[draggingIndex] ?? 0;
        const offset = calcDropOffset({
            heights: dragMetrics.stepHeights,
            fromIndex: draggingIndex,
            toIndex: dragOverIndex,
        });
        const height = dragMetrics.visualHeights[draggingIndex] ?? dragMetrics.stepHeights[draggingIndex] ?? 0;
        return {
            placeholderTop: startTop + offset,
            placeholderHeight: height > 0 ? height : null,
        };
    }, [dragMetrics, dragOverIndex, dragPhase, draggingIndex]);

    return {
        draggingIndex,
        dragOverIndex,
        dragPhase,
        rowShifts,
        placeholderTop,
        placeholderHeight,
        registerRow,
        handlePointerDown,
    };
}
