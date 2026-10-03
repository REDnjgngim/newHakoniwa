import { useEffect, useRef, type RefObject } from 'react';
import { clamp, zoomAroundPoint } from '../geometry';
import type { ViewState } from '../types';

// ============================================================================
// マウスホイールによるズーム操作を提供するフック。
// コンテナへ wheel リスナーを登録し、カーソル位置を中心に倍率を変更する。
// ============================================================================

export interface WheelZoomSettings {
    wheelZoomFactor: number;
    minScale: number;
    maxScale: number;
}

export function useWheelZoom<E extends HTMLElement>(
    containerRef: RefObject<E | null>,
    viewRef: RefObject<ViewState>,
    onChange: () => void,
    settings: WheelZoomSettings
): void {
    // 設定は再レンダリングごとに新しいオブジェクトで渡されうるため、refで最新値を参照する
    const settingsRef = useRef(settings);
    useEffect(() => {
        settingsRef.current = settings;
    });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleWheel = (event: WheelEvent) => {
            event.preventDefault();
            const rect = el.getBoundingClientRect();
            const cursorX = event.clientX - rect.left;
            const cursorY = event.clientY - rect.top;
            const { scale } = viewRef.current;
            const { wheelZoomFactor, minScale, maxScale } = settingsRef.current;

            // 上回転(奥)で拡大、下回転(手前)で縮小
            const zoomFactor = event.deltaY < 0 ? wheelZoomFactor : 1 / wheelZoomFactor;
            const newScale = clamp(scale * zoomFactor, minScale, maxScale);
            // 限界に達しているときは再描画しない
            if (newScale === scale) return;

            // カーソル位置を中心にズーム
            viewRef.current = zoomAroundPoint(viewRef.current, { x: cursorX, y: cursorY }, newScale);
            onChange();
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            el.removeEventListener('wheel', handleWheel);
        };
    }, [containerRef, viewRef, onChange]);
}
