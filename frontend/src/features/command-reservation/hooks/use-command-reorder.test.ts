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
});
