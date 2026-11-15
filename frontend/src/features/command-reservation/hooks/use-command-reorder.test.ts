import { act, renderHook } from '@testing-library/react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCommandReorder } from './use-command-reorder';

function createMockRect(top: number, height: number): DOMRect {
    return {
        top,
        bottom: top + height,
        height,
        left: 0,
        right: 100,
        width: 100,
        x: 0,
        y: top,
        toJSON: () => ({}),
    };
}

function createReactPointerDownEvent(
    target: HTMLElement,
    currentTarget: HTMLElement,
    init: { clientX?: number; clientY?: number; pointerId?: number } = {}
): ReactPointerEvent<HTMLElement> {
    const nativeEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        clientX: init.clientX ?? 0,
        clientY: init.clientY ?? 0,
        pointerId: init.pointerId ?? 1,
    });
    return {
        nativeEvent,
        target,
        currentTarget,
        clientX: nativeEvent.clientX,
        clientY: nativeEvent.clientY,
        pointerId: nativeEvent.pointerId,
        preventDefault: () => nativeEvent.preventDefault(),
        stopPropagation: () => nativeEvent.stopPropagation(),
    } as unknown as ReactPointerEvent<HTMLElement>;
}

describe('useCommandReorder 基本動作', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('ハンドルを pointerdown しただけではドラッグ開始せず、移動しきい値を超えてドラッグ開始する', () => {
        const viewport = document.createElement('div');
        viewport.getBoundingClientRect = () => createMockRect(0, 200);
        const ref = { current: viewport };
        const onReorder = vi.fn();
        const { result } = renderHook(() => useCommandReorder({ itemCount: 3, viewportElementRef: ref, onReorder }));

        const row = document.createElement('div');
        row.setAttribute('data-command-row-index', '0');
        const handle = document.createElement('span');
        handle.setAttribute('data-drag-handle', '');
        row.appendChild(handle);
        viewport.appendChild(row);
        row.getBoundingClientRect = () => createMockRect(0, 52);

        act(() => {
            result.current.registerRow(0, row);
            result.current.handlePointerDown(
                createReactPointerDownEvent(handle, row, { clientX: 10, clientY: 5, pointerId: 1 }),
                0
            );
        });

        expect(result.current.dragPhase).toBe('idle');
        expect(result.current.draggingIndex).toBeNull();

        act(() => {
            window.dispatchEvent(
                new PointerEvent('pointermove', { bubbles: true, clientX: 10, clientY: 15, pointerId: 1 })
            );
        });

        expect(result.current.dragPhase).toBe('dragging');
        expect(result.current.draggingIndex).toBe(0);
    });

    it('viewport が null の場合は handlePointerDown してもクラッシュしない', () => {
        const ref = { current: null };
        const onReorder = vi.fn();
        const { result } = renderHook(() => useCommandReorder({ itemCount: 3, viewportElementRef: ref, onReorder }));
        const row = document.createElement('div');
        const handle = document.createElement('span');
        handle.setAttribute('data-drag-handle', '');
        row.appendChild(handle);

        expect(() => {
            act(() => {
                result.current.handlePointerDown(
                    createReactPointerDownEvent(handle, row, { clientY: 5, pointerId: 1 }),
                    0
                );
            });
        }).not.toThrow();
    });

    describe('確定時のコールバック制御・幾何計算エッジケース', () => {
        function setupTwoRowsViewport() {
            const viewport = document.createElement('div');
            const row0 = document.createElement('div');
            row0.setAttribute('data-command-row-index', '0');
            const handle0 = document.createElement('span');
            handle0.setAttribute('data-drag-handle', '');
            row0.appendChild(handle0);

            const row1 = document.createElement('div');
            row1.setAttribute('data-command-row-index', '1');
            const handle1 = document.createElement('span');
            handle1.setAttribute('data-drag-handle', '');
            row1.appendChild(handle1);

            viewport.appendChild(row0);
            viewport.appendChild(row1);

            viewport.getBoundingClientRect = () => createMockRect(0, 200);
            row0.getBoundingClientRect = () => createMockRect(0, 52);
            row1.getBoundingClientRect = () => createMockRect(60, 52);

            return { viewport, row0, handle0, row1, handle1 };
        }

        it('確定時：transitionend で onReorder が呼ばれ、idle に戻り style がクリアされる', () => {
            const { viewport, row0, handle0, row1 } = setupTwoRowsViewport();
            const ref = { current: viewport };
            const onReorder = vi.fn();
            const { result } = renderHook(() =>
                useCommandReorder({ itemCount: 2, viewportElementRef: ref, onReorder })
            );

            act(() => {
                result.current.registerRow(0, row0);
                result.current.registerRow(1, row1);
                result.current.handlePointerDown(
                    createReactPointerDownEvent(handle0, row0, { clientY: 30, pointerId: 1 }),
                    0
                );
            });

            act(() => {
                window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientY: 100, pointerId: 1 }));
                vi.runOnlyPendingTimers();
            });

            expect(result.current.dragPhase).toBe('dragging');
            expect(result.current.dragOverIndex).toBe(1);
            expect(result.current.rowShifts).toEqual([0, -60]);
            expect(result.current.placeholderTop).toBe(60);
            expect(result.current.placeholderHeight).toBe(52);
            expect(row0.style.transform).toContain('translateY(70px)');

            act(() => {
                window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientY: 100, pointerId: 1 }));
            });
            expect(result.current.dragPhase).toBe('settling');

            act(() => {
                const transitionEnd = new Event('transitionend');
                Object.defineProperty(transitionEnd, 'propertyName', { value: 'transform' });
                row0.dispatchEvent(transitionEnd);
            });

            expect(onReorder).toHaveBeenCalledTimes(1);
            expect(onReorder).toHaveBeenCalledWith(0, 1);
            expect(result.current.dragPhase).toBe('idle');
            expect(result.current.draggingIndex).toBeNull();
            expect(row0.style.transform).toBe('');
            expect(row0.style.transition).toBe('');
        });

        it('確定時：transitionend が無くてもフォールバックタイマーで onReorder が呼ばれる', () => {
            const { viewport, row0, handle0, row1 } = setupTwoRowsViewport();
            const ref = { current: viewport };
            const onReorder = vi.fn();
            const { result } = renderHook(() =>
                useCommandReorder({ itemCount: 2, viewportElementRef: ref, onReorder })
            );

            act(() => {
                result.current.registerRow(0, row0);
                result.current.registerRow(1, row1);
                result.current.handlePointerDown(
                    createReactPointerDownEvent(handle0, row0, { clientY: 30, pointerId: 1 }),
                    0
                );
            });

            act(() => {
                window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientY: 100, pointerId: 1 }));
                vi.runOnlyPendingTimers();
            });

            act(() => {
                window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientY: 100, pointerId: 1 }));
            });
            expect(result.current.dragPhase).toBe('settling');

            act(() => {
                vi.advanceTimersByTime(200);
            });

            expect(onReorder).toHaveBeenCalledTimes(1);
            expect(onReorder).toHaveBeenCalledWith(0, 1);
            expect(result.current.dragPhase).toBe('idle');
        });

        it('確定時：移動せず pointerup した場合はドラッグにならず onReorder は呼ばれない', () => {
            const { viewport, row0, handle0, row1 } = setupTwoRowsViewport();
            const ref = { current: viewport };
            const onReorder = vi.fn();
            const { result } = renderHook(() =>
                useCommandReorder({ itemCount: 2, viewportElementRef: ref, onReorder })
            );

            act(() => {
                result.current.registerRow(0, row0);
                result.current.registerRow(1, row1);
                result.current.handlePointerDown(
                    createReactPointerDownEvent(handle0, row0, { clientY: 30, pointerId: 1 }),
                    0
                );
            });

            act(() => {
                window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientY: 30, pointerId: 1 }));
            });
            expect(result.current.dragPhase).toBe('idle');
            expect(onReorder).not.toHaveBeenCalled();
        });

        it('pointercancel 時は onReorder を呼ばず idle に戻る', () => {
            const { viewport, row0, handle0, row1 } = setupTwoRowsViewport();
            const ref = { current: viewport };
            const onReorder = vi.fn();
            const { result } = renderHook(() =>
                useCommandReorder({ itemCount: 2, viewportElementRef: ref, onReorder })
            );

            act(() => {
                result.current.registerRow(0, row0);
                result.current.registerRow(1, row1);
                result.current.handlePointerDown(
                    createReactPointerDownEvent(handle0, row0, { clientY: 30, pointerId: 1 }),
                    0
                );
            });

            act(() => {
                window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientY: 100, pointerId: 1 }));
                vi.runOnlyPendingTimers();
            });

            act(() => {
                window.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, clientY: 100, pointerId: 1 }));
                vi.advanceTimersByTime(200);
            });

            expect(onReorder).not.toHaveBeenCalled();
            expect(result.current.dragPhase).toBe('idle');
        });

        it('幾何計算：viewport が null の場合クラッシュせず onReorder も呼ばれない', () => {
            const ref = { current: null };
            const onReorder = vi.fn();
            const { result } = renderHook(() =>
                useCommandReorder({ itemCount: 2, viewportElementRef: ref, onReorder })
            );

            const row = document.createElement('div');
            const handle = document.createElement('span');
            handle.setAttribute('data-drag-handle', '');
            row.appendChild(handle);

            act(() => {
                result.current.handlePointerDown(
                    createReactPointerDownEvent(handle, row, { clientY: 30, pointerId: 1 }),
                    0
                );
            });

            act(() => {
                window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientY: 100, pointerId: 1 }));
                vi.runOnlyPendingTimers();
            });

            act(() => {
                window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientY: 100, pointerId: 1 }));
                vi.advanceTimersByTime(200);
            });

            expect(onReorder).not.toHaveBeenCalled();
        });

        it('幾何計算：itemCount が 0 の場合クラッシュせず onReorder も呼ばれない', () => {
            const viewport = document.createElement('div');
            viewport.getBoundingClientRect = () => createMockRect(0, 200);
            const ref = { current: viewport };
            const onReorder = vi.fn();
            const { result } = renderHook(() =>
                useCommandReorder({ itemCount: 0, viewportElementRef: ref, onReorder })
            );

            const row = document.createElement('div');
            const handle = document.createElement('span');
            handle.setAttribute('data-drag-handle', '');
            row.appendChild(handle);
            viewport.appendChild(row);

            act(() => {
                result.current.handlePointerDown(
                    createReactPointerDownEvent(handle, row, { clientY: 30, pointerId: 1 }),
                    0
                );
            });

            act(() => {
                window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientY: 100, pointerId: 1 }));
                vi.runOnlyPendingTimers();
            });

            act(() => {
                window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientY: 100, pointerId: 1 }));
                vi.advanceTimersByTime(200);
            });

            expect(onReorder).not.toHaveBeenCalled();
        });

        it('幾何計算：行要素が未登録の場合クラッシュせず onReorder も呼ばれない', () => {
            const viewport = document.createElement('div');
            viewport.getBoundingClientRect = () => createMockRect(0, 200);
            const ref = { current: viewport };
            const onReorder = vi.fn();
            const { result } = renderHook(() =>
                useCommandReorder({ itemCount: 2, viewportElementRef: ref, onReorder })
            );

            const row = document.createElement('div');
            const handle = document.createElement('span');
            handle.setAttribute('data-drag-handle', '');
            row.appendChild(handle);

            act(() => {
                result.current.handlePointerDown(
                    createReactPointerDownEvent(handle, row, { clientY: 30, pointerId: 1 }),
                    0
                );
            });

            act(() => {
                window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientY: 100, pointerId: 1 }));
                vi.runOnlyPendingTimers();
            });

            act(() => {
                window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientY: 100, pointerId: 1 }));
                vi.advanceTimersByTime(200);
            });

            expect(onReorder).not.toHaveBeenCalled();
        });
    });
});
