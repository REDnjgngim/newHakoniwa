import { useRef, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { clamp, distance, zoomAroundPoint } from '../geometry';
import type { PinchState, PointerPanZoomResult, ViewState } from '../types';

// ============================================================================
// ドラッグ（パン）・ピンチ（ズーム）操作を提供するフック。
// view は呼び出し側が保持する ref を直接書き換え、変化のたびに onChange（再描画）を呼ぶ。
// ============================================================================

export interface PointerPanZoomSettings {
    dragThresholdPx: number;
    minScale: number;
    maxScale: number;
}

export function usePointerPanZoom<E extends HTMLElement>(
    containerRef: RefObject<E | null>,
    viewRef: RefObject<ViewState>,
    onChange: () => void,
    settings: PointerPanZoomSettings
): PointerPanZoomResult<E> {
    const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const isDraggingRef = useRef(false);
    const pinchRef = useRef<PinchState | null>(null);

    const handlePointerDown = (event: ReactPointerEvent<E>) => {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const pos = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        pointersRef.current.set(event.pointerId, pos);

        if (pointersRef.current.size === 1) {
            dragStartRef.current = pos;
            isDraggingRef.current = false;
        } else if (pointersRef.current.size === 2) {
            isDraggingRef.current = true;
            const [p1, p2] = Array.from(pointersRef.current.values());
            pinchRef.current = {
                view: { ...viewRef.current },
                startDist: distance(p1, p2),
                centerX: (p1.x + p2.x) / 2,
                centerY: (p1.y + p2.y) / 2,
            };
        }
    };

    const handlePointerMove = (event: ReactPointerEvent<E>) => {
        const prev = pointersRef.current.get(event.pointerId);
        if (!prev) return;

        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const next = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        pointersRef.current.set(event.pointerId, next);

        const pinch = pinchRef.current;

        if (pointersRef.current.size === 2 && pinch) {
            isDraggingRef.current = true;
            const [p1, p2] = Array.from(pointersRef.current.values());
            const newScale = clamp(
                pinch.view.scale * (distance(p1, p2) / pinch.startDist),
                settings.minScale,
                settings.maxScale
            );

            // ピンチ開始時の中心が指し示すマップ座標を固定したまま倍率だけを変える
            viewRef.current = zoomAroundPoint(pinch.view, { x: pinch.centerX, y: pinch.centerY }, newScale);
            onChange();
        } else if (pointersRef.current.size === 1) {
            const dragStart = dragStartRef.current;
            if (dragStart && distance(next, dragStart) > settings.dragThresholdPx) {
                isDraggingRef.current = true;
            }
            viewRef.current = {
                ...viewRef.current,
                offsetX: viewRef.current.offsetX - (next.x - prev.x),
                offsetY: viewRef.current.offsetY - (next.y - prev.y),
            };
            onChange();
        }
    };

    const handlePointerUp = (event: ReactPointerEvent<E>) => {
        pointersRef.current.delete(event.pointerId);
        if (pointersRef.current.size === 0) {
            dragStartRef.current = null;
        }
        if (pointersRef.current.size < 2) pinchRef.current = null;
    };

    return { handlePointerDown, handlePointerMove, handlePointerUp, isDraggingRef };
}
