import { useEffect, useEffectEvent, useRef, type RefObject } from 'react';
import { clamp } from '../geometry';

// ============================================================================
// 要素サイズを ResizeObserver で追従するフック。
// 計測結果は丸めて上限を適用し、初回計測かどうかを合わせて通知する。
// ============================================================================

export interface ElementSize {
    width: number;
    height: number;
    isFirst: boolean;
}

export interface ElementSizeLimits {
    maxWidth: number;
    maxHeight: number;
}

export function useElementSize<E extends HTMLElement>(
    ref: RefObject<E | null>,
    limits: ElementSizeLimits,
    onResize: (size: ElementSize) => void
): void {
    const isFirstRef = useRef(true);

    // 計測結果はイベントとして通知する（依存配列に含めず最新のコールバックを呼ぶ）
    const handleResize = useEffectEvent((size: ElementSize) => {
        onResize(size);
    });

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const updateSize = () => {
            const rect = el.getBoundingClientRect();
            const width = clamp(Math.round(rect.width), 1, limits.maxWidth);
            const height = clamp(Math.round(rect.height), 1, limits.maxHeight);
            handleResize({ width, height, isFirst: isFirstRef.current });
            isFirstRef.current = false;
        };

        updateSize();

        const observer = new ResizeObserver(updateSize);
        observer.observe(el);
        return () => {
            observer.disconnect();
        };
    }, [ref, limits.maxWidth, limits.maxHeight]);
}
