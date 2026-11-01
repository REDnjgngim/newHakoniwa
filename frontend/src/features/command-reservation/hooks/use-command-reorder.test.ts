import { act, renderHook } from '@testing-library/react';
import { useCommandReorder } from './use-command-reorder';

describe('useCommandReorder 基本動作', () => {
    it('Pointer down on drag handle でドラッグ開始', () => {
        const viewport = document.createElement('div');
        const ref = { current: viewport } as { current: HTMLElement | null };
        const onReorder = vi.fn();
        const { result } = renderHook(() => useCommandReorder({ itemCount: 3, viewportElementRef: ref, onReorder }));

        const row = document.createElement('div');
        row.setAttribute('data-command-row-index', '0');
        const handle = document.createElement('span');
        handle.setAttribute('data-drag-handle', '');
        row.appendChild(handle);
        viewport.appendChild(row);

        row.getBoundingClientRect = () =>
            ({
                top: 0,
                height: 20,
                left: 0,
                width: 100,
                right: 100,
                bottom: 20,
                x: 0,
                y: 0,
                toJSON: () => ({}),
            }) as DOMRect;

        const event = new PointerEvent('pointerdown', {
            bubbles: true,
            clientY: 5,
            pointerId: 1,
        }) as unknown as Parameters<typeof result.current.handlePointerDown>[0];
        Object.defineProperty(event, 'target', { value: handle });
        Object.defineProperty(event, 'currentTarget', { value: row });

        act(() => {
            result.current.handlePointerDown(event, 0);
        });

        expect(result.current.isPointerDragging).toBe(true);
        expect(result.current.draggingIndex).toBe(0);
    });

    it('viewport が null の場合は handlePointerDown してもクラッシュしない', () => {
        const ref = { current: null } as { current: HTMLElement | null };
        const onReorder = vi.fn();
        const { result } = renderHook(() => useCommandReorder({ itemCount: 3, viewportElementRef: ref, onReorder }));
        const row = document.createElement('div');
        const handle = document.createElement('span');
        handle.setAttribute('data-drag-handle', '');
        row.appendChild(handle);
        const event = new PointerEvent('pointerdown', {
            bubbles: true,
            clientY: 5,
            pointerId: 1,
        }) as unknown as Parameters<typeof result.current.handlePointerDown>[0];
        Object.defineProperty(event, 'target', { value: handle });
        Object.defineProperty(event, 'currentTarget', { value: row });
        expect(() => {
            act(() => result.current.handlePointerDown(event, 0));
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

            viewport.getBoundingClientRect = () =>
                ({
                    top: 0,
                    bottom: 200,
                    height: 200,
                    left: 0,
                    right: 100,
                    width: 100,
                    x: 0,
                    y: 0,
                    toJSON: () => ({}),
                }) as DOMRect;

            row0.getBoundingClientRect = () =>
                ({
                    top: 0,
                    bottom: 60,
                    height: 60,
                    left: 0,
                    right: 100,
                    width: 100,
                    x: 0,
                    y: 0,
                    toJSON: () => ({}),
                }) as DOMRect;

            row1.getBoundingClientRect = () =>
                ({
                    top: 60,
                    bottom: 120,
                    height: 60,
                    left: 0,
                    right: 100,
                    width: 100,
                    x: 0,
                    y: 60,
                    toJSON: () => ({}),
                }) as DOMRect;

            return { viewport, row0, handle0, row1, handle1 };
        }

        it('確定時：pending reorder があれば onReorder が呼ばれる', () => {
            const { viewport, row0, handle0 } = setupTwoRowsViewport();
            const ref = { current: viewport } as { current: HTMLElement | null };
            const onReorder = vi.fn();
            const { result } = renderHook(() =>
                useCommandReorder({ itemCount: 2, viewportElementRef: ref, onReorder })
            );

            const downEvent = new PointerEvent('pointerdown', {
                bubbles: true,
                clientY: 30,
                pointerId: 1,
            }) as unknown as Parameters<typeof result.current.handlePointerDown>[0];
            Object.defineProperty(downEvent, 'target', { value: handle0 });
            Object.defineProperty(downEvent, 'currentTarget', { value: row0 });

            act(() => {
                result.current.handlePointerDown(downEvent, 0);
            });

            // row 1 (mid: 90) を超える位置へ移動
            const moveEvent = new PointerEvent('pointermove', { bubbles: true, clientY: 100, pointerId: 1 });
            act(() => {
                window.dispatchEvent(moveEvent);
            });
            expect(result.current.dragOverIndex).toBe(1);

            // pointerup で確定待機（settling）状態へ
            const upEvent = new PointerEvent('pointerup', { bubbles: true, clientY: 100, pointerId: 1 });
            act(() => {
                window.dispatchEvent(upEvent);
            });
            expect(result.current.isSettling).toBe(true);

            // settleComplete 呼び出しで onReorder が実行される
            act(() => {
                result.current.settleComplete();
            });
            expect(onReorder).toHaveBeenCalledTimes(1);
            expect(onReorder).toHaveBeenCalledWith(0, 1);
            expect(result.current.isSettling).toBe(false);
            expect(result.current.draggingIndex).toBeNull();
        });

        it('確定時：pending reorder がなければ onReorder は呼ばれない', () => {
            const { viewport, row0, handle0 } = setupTwoRowsViewport();
            const ref = { current: viewport } as { current: HTMLElement | null };
            const onReorder = vi.fn();
            const { result } = renderHook(() =>
                useCommandReorder({ itemCount: 2, viewportElementRef: ref, onReorder })
            );

            const downEvent = new PointerEvent('pointerdown', {
                bubbles: true,
                clientY: 30,
                pointerId: 1,
            }) as unknown as Parameters<typeof result.current.handlePointerDown>[0];
            Object.defineProperty(downEvent, 'target', { value: handle0 });
            Object.defineProperty(downEvent, 'currentTarget', { value: row0 });

            act(() => {
                result.current.handlePointerDown(downEvent, 0);
            });

            // 移動せずにそのまま pointerup（fromIndex === toIndex === 0）
            const upEvent = new PointerEvent('pointerup', { bubbles: true, clientY: 30, pointerId: 1 });
            act(() => {
                window.dispatchEvent(upEvent);
            });
            expect(result.current.isSettling).toBe(true);

            act(() => {
                result.current.settleComplete();
            });
            expect(onReorder).not.toHaveBeenCalled();
            expect(result.current.isSettling).toBe(false);
        });

        it('幾何計算：viewport が null の場合クラッシュせず onReorder も呼ばれない', () => {
            const ref = { current: null } as { current: HTMLElement | null };
            const onReorder = vi.fn();
            const { result } = renderHook(() =>
                useCommandReorder({ itemCount: 2, viewportElementRef: ref, onReorder })
            );

            const row = document.createElement('div');
            const handle = document.createElement('span');
            handle.setAttribute('data-drag-handle', '');
            row.appendChild(handle);

            const downEvent = new PointerEvent('pointerdown', {
                bubbles: true,
                clientY: 30,
                pointerId: 1,
            }) as unknown as Parameters<typeof result.current.handlePointerDown>[0];
            Object.defineProperty(downEvent, 'target', { value: handle });
            Object.defineProperty(downEvent, 'currentTarget', { value: row });

            act(() => {
                result.current.handlePointerDown(downEvent, 0);
            });

            const moveEvent = new PointerEvent('pointermove', { bubbles: true, clientY: 100, pointerId: 1 });
            act(() => {
                window.dispatchEvent(moveEvent);
            });

            const upEvent = new PointerEvent('pointerup', { bubbles: true, clientY: 100, pointerId: 1 });
            act(() => {
                window.dispatchEvent(upEvent);
            });

            act(() => {
                result.current.settleComplete();
            });
            expect(onReorder).not.toHaveBeenCalled();
        });

        it('幾何計算：itemCount が 0 の場合クラッシュせず onReorder も呼ばれない', () => {
            const viewport = document.createElement('div');
            const ref = { current: viewport } as { current: HTMLElement | null };
            const onReorder = vi.fn();
            const { result } = renderHook(() =>
                useCommandReorder({ itemCount: 0, viewportElementRef: ref, onReorder })
            );

            const row = document.createElement('div');
            const handle = document.createElement('span');
            handle.setAttribute('data-drag-handle', '');
            row.appendChild(handle);
            viewport.appendChild(row);

            const downEvent = new PointerEvent('pointerdown', {
                bubbles: true,
                clientY: 30,
                pointerId: 1,
            }) as unknown as Parameters<typeof result.current.handlePointerDown>[0];
            Object.defineProperty(downEvent, 'target', { value: handle });
            Object.defineProperty(downEvent, 'currentTarget', { value: row });

            act(() => {
                result.current.handlePointerDown(downEvent, 0);
            });

            const moveEvent = new PointerEvent('pointermove', { bubbles: true, clientY: 100, pointerId: 1 });
            act(() => {
                window.dispatchEvent(moveEvent);
            });

            const upEvent = new PointerEvent('pointerup', { bubbles: true, clientY: 100, pointerId: 1 });
            act(() => {
                window.dispatchEvent(upEvent);
            });

            act(() => {
                result.current.settleComplete();
            });
            expect(onReorder).not.toHaveBeenCalled();
        });

        it('幾何計算：行要素が 0 件の場合クラッシュせず onReorder も呼ばれない', () => {
            const viewport = document.createElement('div');
            const ref = { current: viewport } as { current: HTMLElement | null };
            const onReorder = vi.fn();
            const { result } = renderHook(() =>
                useCommandReorder({ itemCount: 2, viewportElementRef: ref, onReorder })
            );

            const row = document.createElement('div');
            const handle = document.createElement('span');
            handle.setAttribute('data-drag-handle', '');
            row.appendChild(handle);
            // viewport には追加しない（行要素0）

            const downEvent = new PointerEvent('pointerdown', {
                bubbles: true,
                clientY: 30,
                pointerId: 1,
            }) as unknown as Parameters<typeof result.current.handlePointerDown>[0];
            Object.defineProperty(downEvent, 'target', { value: handle });
            Object.defineProperty(downEvent, 'currentTarget', { value: row });

            act(() => {
                result.current.handlePointerDown(downEvent, 0);
            });

            const moveEvent = new PointerEvent('pointermove', { bubbles: true, clientY: 100, pointerId: 1 });
            act(() => {
                window.dispatchEvent(moveEvent);
            });

            const upEvent = new PointerEvent('pointerup', { bubbles: true, clientY: 100, pointerId: 1 });
            act(() => {
                window.dispatchEvent(upEvent);
            });

            act(() => {
                result.current.settleComplete();
            });
            expect(onReorder).not.toHaveBeenCalled();
        });
    });
});
