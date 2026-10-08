import { useEffect, useEffectEvent, type RefObject } from 'react';
import { clamp, clampPanOffset, zoomAroundPoint } from '../geometry';
import type { PanLimitMode, ViewState } from '../types';

// ============================================================================
// マウスホイールによるズーム操作を提供するフック。
// コンテナへ wheel リスナーを登録し、カーソル位置を中心に倍率を変更する。
// ============================================================================

export interface WheelZoomSettings {
    wheelZoomFactor: number;
    minScale: number;
    maxScale: number;
    mapWidth: number;
    mapHeight: number;
    tileSize: number;
    panLimitMode: PanLimitMode;
    canvasSize: RefObject<{ width: number; height: number }>;
}

export function useWheelZoom<E extends HTMLElement>(
    containerRef: RefObject<E | null>,
    viewRef: RefObject<ViewState>,
    onChange: () => void,
    settings: WheelZoomSettings
): void {
    // リスナー登録は1回だけ行い、設定・viewの最新値はイベント関数から参照する
    const handleWheel = useEffectEvent((event: WheelEvent) => {
        event.preventDefault();

        const el = containerRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const cursorX = event.clientX - rect.left;
        const cursorY = event.clientY - rect.top;
        const { scale } = viewRef.current;
        const { wheelZoomFactor, minScale, maxScale } = settings;

        // 上回転(奥)で拡大、下回転(手前)で縮小
        const zoomFactor = event.deltaY < 0 ? wheelZoomFactor : 1 / wheelZoomFactor;
        const newScale = clamp(scale * zoomFactor, minScale, maxScale);
        // 限界に達しているときは再描画しない
        if (newScale === scale) return;

        // カーソル位置を中心にズーム
        const zoomed = zoomAroundPoint(viewRef.current, { x: cursorX, y: cursorY }, newScale);
        // マップが完全に画面外へ消えないよう、ズーム後の offset を制限する
        if (settings.panLimitMode !== 'none') {
            const { width, height } = settings.canvasSize.current;
            if (width > 0 && height > 0) {
                viewRef.current = clampPanOffset(
                    zoomed,
                    width,
                    height,
                    settings.mapWidth,
                    settings.mapHeight,
                    settings.tileSize
                );
            } else {
                viewRef.current = zoomed;
            }
        } else {
            viewRef.current = zoomed;
        }
        onChange();
    });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            el.removeEventListener('wheel', handleWheel);
        };
    }, [containerRef]);
}
