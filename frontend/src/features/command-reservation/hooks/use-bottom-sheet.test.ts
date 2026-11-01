import { act, renderHook } from '@testing-library/react';
import { useBottomSheet } from './use-bottom-sheet';

describe('useBottomSheet 基本動作', () => {
    it('初期高さは 50vh', () => {
        const { result } = renderHook(() => useBottomSheet());
        expect(result.current.sheetHeightVh).toBe(50);
    });

    it('Pointer down でドラッグ開始', () => {
        const { result } = renderHook(() => useBottomSheet());
        const el = document.createElement('div');
        const event = new PointerEvent('pointerdown', {
            bubbles: true,
            clientY: 100,
            pointerId: 1,
        }) as unknown as Parameters<typeof result.current.handleDragHandlePointerDown>[0];
        Object.defineProperty(event, 'target', { value: el });
        Object.defineProperty(event, 'currentTarget', { value: el });
        act(() => {
            result.current.handleDragHandlePointerDown(event);
        });
        expect(result.current.isDraggingSheet).toBe(true);
    });

    it('Pointer move で高さがクランプされる（MAX）', () => {
        const { result } = renderHook(() => useBottomSheet());
        const el = document.createElement('div');
        const event = new PointerEvent('pointerdown', {
            bubbles: true,
            clientY: 100,
            pointerId: 1,
        }) as unknown as Parameters<typeof result.current.handleDragHandlePointerDown>[0];
        Object.defineProperty(event, 'target', { value: el });
        Object.defineProperty(event, 'currentTarget', { value: el });
        act(() => result.current.handleDragHandlePointerDown(event));
        // 上方向に大きくドラッグ
        const move = new PointerEvent('pointermove', { bubbles: true, clientY: 0, pointerId: 1 });
        act(() => window.dispatchEvent(move));
        expect(result.current.sheetHeightVh).toBeLessThanOrEqual(96);
        expect(result.current.sheetHeightVh).toBeGreaterThanOrEqual(2.5);
    });

    it('キャンセルで復帰（pointer cancel）', () => {
        const { result } = renderHook(() => useBottomSheet());
        const el = document.createElement('div');
        const event = new PointerEvent('pointerdown', {
            bubbles: true,
            clientY: 100,
            pointerId: 1,
        }) as unknown as Parameters<typeof result.current.handleDragHandlePointerDown>[0];
        Object.defineProperty(event, 'target', { value: el });
        Object.defineProperty(event, 'currentTarget', { value: el });
        act(() => result.current.handleDragHandlePointerDown(event));
        const cancel = new PointerEvent('pointercancel', { bubbles: true, clientY: 100, pointerId: 1 });
        act(() => window.dispatchEvent(cancel));
        expect(result.current.isDraggingSheet).toBe(false);
    });
});
