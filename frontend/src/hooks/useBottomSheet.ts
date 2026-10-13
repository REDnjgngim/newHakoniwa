import { useState, useCallback, useRef } from 'react';

export interface UseBottomSheetReturn {
    sheetHeightVh: number;
    isSheetHidden: boolean;
    isDraggingSheet: boolean;
    snapHeightStyle: React.CSSProperties;
    handleDragHandlePointerDown: (event: React.PointerEvent) => void;
}

const MIN_SHEET_VH = 2.5;
const MAX_SHEET_VH = 96;
const HIDDEN_THRESHOLD_VH = 8;
const INITIAL_SHEET_VH = 50;

export function useBottomSheet(): UseBottomSheetReturn {
    const [sheetHeightVh, setSheetHeightVh] = useState(INITIAL_SHEET_VH);
    const [isDraggingSheet, setIsDraggingSheet] = useState(false);
    const dragStateRef = useRef<{
        pointerId: number;
        startClientY: number;
        startHeightVh: number;
    } | null>(null);

    const finishSheetDrag = useCallback((cancelled: boolean) => {
        const state = dragStateRef.current;
        dragStateRef.current = null;
        setIsDraggingSheet(false);
        if (!state || cancelled) return;
        // 指を離した位置で確定する。下端まで下げ切ったら取っ手のみ残す高さに吸着。
        setSheetHeightVh((prev) => (prev <= HIDDEN_THRESHOLD_VH ? MIN_SHEET_VH : prev));
    }, []);

    const handleDragHandlePointerDown = useCallback(
        (event: React.PointerEvent) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            const sourceElement = (event.currentTarget as HTMLElement | null) ?? null;
            try {
                sourceElement?.setPointerCapture?.(event.pointerId);
            } catch {
                // capture不可でも継続する
            }
            dragStateRef.current = {
                pointerId: event.pointerId,
                startClientY: event.clientY,
                startHeightVh: sheetHeightVh,
            };
            setIsDraggingSheet(true);

            const handlePointerMove = (moveEvent: PointerEvent) => {
                const state = dragStateRef.current;
                if (!state || moveEvent.pointerId !== state.pointerId) return;
                const dyPx = moveEvent.clientY - state.startClientY;
                const viewportH = window.innerHeight || 1;
                const nextVh = state.startHeightVh - (dyPx / viewportH) * 100;
                setSheetHeightVh(Math.max(MIN_SHEET_VH, Math.min(MAX_SHEET_VH, nextVh)));
            };
            const handlePointerUp = (upEvent: PointerEvent) => {
                if (dragStateRef.current?.pointerId !== upEvent.pointerId) return;
                window.removeEventListener('pointermove', handlePointerMove);
                window.removeEventListener('pointerup', handlePointerUp);
                window.removeEventListener('pointercancel', handlePointerCancel);
                finishSheetDrag(false);
            };
            const handlePointerCancel = (cancelEvent: PointerEvent) => {
                if (dragStateRef.current?.pointerId !== cancelEvent.pointerId) return;
                window.removeEventListener('pointermove', handlePointerMove);
                window.removeEventListener('pointerup', handlePointerUp);
                window.removeEventListener('pointercancel', handlePointerCancel);
                finishSheetDrag(true);
            };
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
            window.addEventListener('pointercancel', handlePointerCancel);
        },
        [finishSheetDrag, sheetHeightVh]
    );

    const isSheetHidden = sheetHeightVh <= HIDDEN_THRESHOLD_VH;

    const snapHeightStyle: React.CSSProperties = {
        height: `${sheetHeightVh}dvh`,
        maxHeight: `${MAX_SHEET_VH}dvh`,
        transition: isDraggingSheet ? 'none' : 'height 0.15s ease-out',
    };

    return {
        sheetHeightVh,
        isSheetHidden,
        snapHeightStyle,
        handleDragHandlePointerDown,
        isDraggingSheet,
    };
}
