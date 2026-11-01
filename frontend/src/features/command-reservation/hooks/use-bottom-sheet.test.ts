import { act, renderHook } from '@testing-library/react';
import { useBottomSheet } from './use-bottom-sheet';

describe('useBottomSheet 基本動作', () => {
    const originalInnerHeight = window.innerHeight;

    beforeEach(() => {
        Object.defineProperty(window, 'innerHeight', {
            configurable: true,
            writable: true,
            value: 1000,
        });
    });

    afterEach(() => {
        Object.defineProperty(window, 'innerHeight', {
            configurable: true,
            writable: true,
            value: originalInnerHeight,
        });
    });

    it('初期高さは 50vh', () => {
        const { result } = renderHook(() => useBottomSheet());
        expect(result.current.sheetHeightVh).toBe(50);
        expect(result.current.isSheetHidden).toBe(false);
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

    describe('吸着・非表示・アニメーション', () => {
        it('閾値以下（8vh以下）まで下げると最小高さ（2.5vh）に吸着する', () => {
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

            // innerHeight=1000px のため 10px = 1vh。
            // 初期高さ 50vh から 6vh（<= 8vh）にするには 44vh (440px) 下げる。clientY: 100 + 440 = 540
            const move = new PointerEvent('pointermove', { bubbles: true, clientY: 540, pointerId: 1 });
            act(() => window.dispatchEvent(move));

            expect(result.current.sheetHeightVh).toBe(6);
            expect(result.current.isSheetHidden).toBe(true);

            // 指を離して吸着（finishSheetDrag）
            const up = new PointerEvent('pointerup', { bubbles: true, clientY: 540, pointerId: 1 });
            act(() => window.dispatchEvent(up));

            expect(result.current.isDraggingSheet).toBe(false);
            expect(result.current.sheetHeightVh).toBe(2.5);
            expect(result.current.isSheetHidden).toBe(true);
        });

        it('閾値より上で離した場合は吸着せずその時の高さを維持する', () => {
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

            // 50vh から 20vh (200px) 下げて 30vh にする。clientY: 100 + 200 = 300
            const move = new PointerEvent('pointermove', { bubbles: true, clientY: 300, pointerId: 1 });
            act(() => window.dispatchEvent(move));

            expect(result.current.sheetHeightVh).toBe(30);
            expect(result.current.isSheetHidden).toBe(false);

            const up = new PointerEvent('pointerup', { bubbles: true, clientY: 300, pointerId: 1 });
            act(() => window.dispatchEvent(up));

            expect(result.current.isDraggingSheet).toBe(false);
            expect(result.current.sheetHeightVh).toBe(30);
            expect(result.current.isSheetHidden).toBe(false);
        });

        it('非表示判定の境界値（8vh以下でtrue、8vh超でfalse）', () => {
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

            // 8vh になるように移動 (50vh - 42vh = 8vh -> clientY: 100 + 420 = 520)
            const moveAt8 = new PointerEvent('pointermove', { bubbles: true, clientY: 520, pointerId: 1 });
            act(() => window.dispatchEvent(moveAt8));
            expect(result.current.sheetHeightVh).toBe(8);
            expect(result.current.isSheetHidden).toBe(true);

            // 8.1vh になるように移動 (50vh - 41.9vh = 8.1vh -> clientY: 100 + 419 = 519)
            const moveAbove8 = new PointerEvent('pointermove', { bubbles: true, clientY: 519, pointerId: 1 });
            act(() => window.dispatchEvent(moveAbove8));
            expect(result.current.sheetHeightVh).toBeCloseTo(8.1);
            expect(result.current.isSheetHidden).toBe(false);
        });

        it('ドラッグ中は遷移アニメーションが無効（none）、非ドラッグ時は有効', () => {
            const { result } = renderHook(() => useBottomSheet());
            // CSS カスタムプロパティは CSSProperties の静的型に存在しないため Record 経由で参照
            const cssVars = () => result.current.sheetCssVars as Record<string, string>;
            expect(cssVars()['--sheet-transition']).toBe('height 0.15s ease-out');

            const el = document.createElement('div');
            const event = new PointerEvent('pointerdown', {
                bubbles: true,
                clientY: 100,
                pointerId: 1,
            }) as unknown as Parameters<typeof result.current.handleDragHandlePointerDown>[0];
            Object.defineProperty(event, 'target', { value: el });
            Object.defineProperty(event, 'currentTarget', { value: el });

            act(() => result.current.handleDragHandlePointerDown(event));
            expect(cssVars()['--sheet-transition']).toBe('none');

            const up = new PointerEvent('pointerup', { bubbles: true, clientY: 100, pointerId: 1 });
            act(() => window.dispatchEvent(up));
            expect(cssVars()['--sheet-transition']).toBe('height 0.15s ease-out');
        });
    });
});
