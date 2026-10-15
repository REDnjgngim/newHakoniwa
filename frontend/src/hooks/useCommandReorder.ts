import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseCommandReorderOptions {
    itemCount: number;
    viewportElementRef: React.RefObject<HTMLElement | null>;
    onReorder: (fromIndex: number, toIndex: number) => void;
}

export interface UseCommandReorderReturn {
    draggingIndex: number | null;
    dragOverIndex: number | null;
    dragOffsetY: number;
    isPointerDragging: boolean;
    handleHtml5DragStart: (index: number) => void;
    handleHtml5DragOver: (event: React.DragEvent, index: number) => void;
    handleHtml5DragEnd: () => void;
    handlePointerDown: (event: React.PointerEvent, index: number) => void;
}

interface PointerDragState {
    pointerId: number;
    startIndex: number;
    startClientY: number;
    startClientX: number;
    currentClientY: number;
    currentClientX: number;
    activated: boolean;
    grabOffsetY: number; // 追加: PointerDown時の行先頭からの相対Y
    sourceElement: HTMLElement | null;
}

const AUTO_SCROLL_MARGIN_PX = 56;
const AUTO_SCROLL_STEP_PX = 8;
const CLICK_SUPPRESS_MS = 400;
const CLICK_SUPPRESS_DY_PX = 8;
/** PCのHTML5 DnDとスマホのPointerドラッグを両対応する並び替え操作 */
export function useCommandReorder(options: UseCommandReorderOptions): UseCommandReorderReturn {
    const { itemCount, viewportElementRef: viewportRef, onReorder } = options;
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [dragOffsetY, setDragOffsetY] = useState(0);
    const [isPointerDragging, setIsPointerDragging] = useState(false);
    const pointerStateRef = useRef<PointerDragState | null>(null);
    const pointerActiveRef = useRef(false);
    const suppressClickUntilRef = useRef(0);

    const clearPointerState = useCallback(() => {
        pointerStateRef.current = null;
        pointerActiveRef.current = false;
    }, []);

    /**
     * 指位置から挿入先インデックスを幾何計算する。
     * ドラッグ中の行を除外し、残り行の中点を上から数えて挿入位置を求める。
     * elementFromPoint と違い、追従中の行自身を拾って from === to に張り付く問題がない。
     */
    const indexFromGeometry = useCallback(
        (clientY: number, excludeIndex: number | null): number | null => {
            const viewport = viewportRef.current;
            if (!viewport || itemCount <= 0) return null;
            const rows = viewport.querySelectorAll('[data-command-row-index]');
            if (rows.length === 0) return null;
            let insertAt = 0;
            let seen = 0;
            rows.forEach((row) => {
                const raw = row.getAttribute('data-command-row-index');
                const parsed = raw === null ? Number.NaN : Number(raw);
                if (!Number.isInteger(parsed) || parsed < 0 || parsed >= itemCount) return;
                if (excludeIndex !== null && parsed === excludeIndex) return;
                seen += 1;
                const rect = (row as HTMLElement).getBoundingClientRect();
                const mid = rect.top + rect.height / 2;
                if (clientY >= mid) insertAt += 1;
            });
            if (seen === 0) return excludeIndex;
            return Math.max(0, Math.min(insertAt, itemCount - 1));
        },
        [itemCount, viewportRef]
    );

    const handleHtml5DragStart = useCallback((index: number) => {
        // スマホのポインタードラッグ中はHTML5 DnDを発火させない
        if (pointerActiveRef.current) return;
        setDraggingIndex(index);
        setDragOverIndex(index);
        setDragOffsetY(0);
        setIsPointerDragging(false);
    }, []);

    const handleHtml5DragOver = useCallback((event: React.DragEvent, index: number) => {
        event.preventDefault();
        setDragOverIndex(index);
    }, []);

    const handleHtml5DragEnd = useCallback(() => {
        if (draggingIndex !== null && dragOverIndex !== null && draggingIndex !== dragOverIndex) {
            onReorder(draggingIndex, dragOverIndex);
        }
        setDraggingIndex(null);
        setDragOverIndex(null);
        setDragOffsetY(0);
        setIsPointerDragging(false);
        clearPointerState();
    }, [draggingIndex, dragOverIndex, onReorder, clearPointerState]);

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
    const handlePointerDown = useCallback((event: React.PointerEvent, index: number) => {
        if (event.pointerType === 'mouse') return;
        const target = event.target as HTMLElement | null;
        if (target?.closest('button, select, input, textarea, a')) return;
        const isHandle = target?.closest('[data-drag-handle]') !== null;
        const sourceElement = (event.currentTarget as HTMLElement | null) ?? null;
        // ハンドル起点のみドラッグ開始。行本体の長押し開始は廃止。
        if (!isHandle) {
            return; // ハンドル以外の操作は無視
        }
        {
            event.preventDefault();
            try {
                sourceElement?.setPointerCapture?.(event.pointerId);
            } catch {
                // capture不可でもwindowリスナーで継続する
            }
            const rowRect = sourceElement?.getBoundingClientRect();
            const grabOffsetY = rowRect ? event.clientY - rowRect.top : 0;
            pointerStateRef.current = {
                pointerId: event.pointerId,
                startIndex: index,
                startClientY: event.clientY,
                startClientX: event.clientX,
                currentClientY: event.clientY,
                currentClientX: event.clientX,
                activated: true,
                grabOffsetY,
                sourceElement,
            };
            pointerActiveRef.current = true;
            setDraggingIndex(index);
            setDragOverIndex(index);
            setDragOffsetY(0);
            setIsPointerDragging(true);
            return;
        }
    }, []);

    useEffect(() => {
        const handlePointerMove = (event: PointerEvent) => {
            const state = pointerStateRef.current;
            if (!state || event.pointerId !== state.pointerId) return;
            state.currentClientX = event.clientX;
            state.currentClientY = event.clientY;
            setDragOffsetY(event.clientY - state.startClientY);
            autoScrollViewport(event.clientY);
            const adjustedY = event.clientY - state.grabOffsetY;
            const hitIndex = indexFromGeometry(adjustedY, state.startIndex);
            if (hitIndex !== null) setDragOverIndex(hitIndex);
        };

        const finishPointerDrag = (event: PointerEvent, cancelled: boolean) => {
            const state = pointerStateRef.current;
            if (!state || event.pointerId !== state.pointerId) return;
            const wasActivated = state.activated;
            const fromIndex = state.startIndex;
            const movedDy = Math.abs(state.currentClientY - state.startClientY);
            const hitIndex = cancelled ? null : indexFromGeometry(state.currentClientY - state.grabOffsetY, fromIndex);
            clearPointerState();
            if (!wasActivated) return;
            // ドラッグ直後の合成clickによる行選択の誤発火を抑止する
            if (movedDy > CLICK_SUPPRESS_DY_PX || (hitIndex !== null && hitIndex !== fromIndex)) {
                suppressClickUntilRef.current = Date.now() + CLICK_SUPPRESS_MS;
            }
            setDraggingIndex(null);
            setDragOffsetY(0);
            setIsPointerDragging(false);
            setDragOverIndex((currentOver) => {
                const toIndex = hitIndex ?? currentOver;
                if (toIndex !== null && toIndex !== fromIndex) onReorder(fromIndex, toIndex);
                return null;
            });
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
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerCancel);
            window.removeEventListener('click', handleClickCapture, true);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, [autoScrollViewport, clearPointerState, indexFromGeometry, onReorder]);

    return {
        draggingIndex,
        dragOverIndex,
        dragOffsetY,
        isPointerDragging,
        handleHtml5DragStart,
        handleHtml5DragOver,
        handleHtml5DragEnd,
        handlePointerDown,
    };
}
