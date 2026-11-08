import { renderHook } from '@testing-library/react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useHoverTracking } from './use-hover-tracking';
import type { HoverCell, HoverState } from '../engine/types';

function createDummyPointerEvent(pointerType: string, clientX: number, clientY: number) {
    return {
        pointerType,
        clientX,
        clientY,
    } as unknown as ReactPointerEvent<HTMLDivElement>;
}

describe('useHoverTracking', () => {
    it('タッチ操作で1回目のタップでは onConfirm を呼ばず onTap にセルを渡し、同一マスの2回目タップで onConfirm を呼ぶ', () => {
        const hoverRef = { current: { x: null, y: null } as HoverState };
        const container = document.createElement('div');
        vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
            left: 0,
            top: 0,
            width: 100,
            height: 100,
            right: 100,
            bottom: 100,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        });
        const containerRef = { current: container };
        const resolveCell = vi.fn((): HoverCell | null => ({ x: 1, y: 1 }));
        const onHoverChange = vi.fn();
        const onCellChange = vi.fn();

        const { result } = renderHook(() =>
            useHoverTracking(hoverRef, containerRef, resolveCell, onHoverChange, onCellChange)
        );

        const onConfirm = vi.fn();
        const onTap = vi.fn();
        const touchEvent = createDummyPointerEvent('touch', 10, 10);

        // 1回目のタップ
        result.current.handleTapForHover(touchEvent, onConfirm, onTap);

        expect(onTap).toHaveBeenCalledWith({ x: 1, y: 1 });
        expect(onConfirm).not.toHaveBeenCalled();
        expect(hoverRef.current).toEqual({ x: 1, y: 1 });

        // 2回目の同一マスタップ
        result.current.handleTapForHover(touchEvent, onConfirm, onTap);

        expect(onConfirm).toHaveBeenCalledWith({ x: 1, y: 1 });
    });

    it('マップ外タップ時に onTap に null が渡されホバーが解除される', () => {
        const hoverRef = { current: { x: 1, y: 1 } as HoverState };
        const container = document.createElement('div');
        vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
            left: 0,
            top: 0,
            width: 100,
            height: 100,
            right: 100,
            bottom: 100,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        });
        const containerRef = { current: container };
        const resolveCell = vi.fn((): HoverCell | null => null);
        const onHoverChange = vi.fn();

        const { result } = renderHook(() => useHoverTracking(hoverRef, containerRef, resolveCell, onHoverChange));

        const onConfirm = vi.fn();
        const onTap = vi.fn();
        const touchEvent = createDummyPointerEvent('touch', 999, 999);

        result.current.handleTapForHover(touchEvent, onConfirm, onTap);

        expect(onTap).toHaveBeenCalledWith(null);
        expect(hoverRef.current).toEqual({ x: null, y: null });
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it('マウス操作では1回目のクリックで即座に onConfirm が呼ばれる', () => {
        const hoverRef = { current: { x: null, y: null } as HoverState };
        const container = document.createElement('div');
        vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
            left: 0,
            top: 0,
            width: 100,
            height: 100,
            right: 100,
            bottom: 100,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        });
        const containerRef = { current: container };
        const resolveCell = vi.fn((): HoverCell | null => ({ x: 2, y: 3 }));
        const onHoverChange = vi.fn();

        const { result } = renderHook(() => useHoverTracking(hoverRef, containerRef, resolveCell, onHoverChange));

        const onConfirm = vi.fn();
        const onTap = vi.fn();
        const mouseEvent = createDummyPointerEvent('mouse', 20, 30);

        result.current.handleTapForHover(mouseEvent, onConfirm, onTap);

        expect(onTap).toHaveBeenCalledWith({ x: 2, y: 3 });
        expect(onConfirm).toHaveBeenCalledWith({ x: 2, y: 3 });
    });
});
