import { act, renderHook } from '@testing-library/react';
import { usePresence } from './use-presence';

type Item = {
    id: string;
    label: string;
};

describe('usePresence', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('初期値が null のときは null を返す', () => {
        const { result } = renderHook(() =>
            usePresence<Item>(null, { getKey: (item) => item.id, exitDurationMs: 150 })
        );
        expect(result.current).toBeNull();
    });

    it('null → 値で visible=false になり、次フレームで visible=true になる', () => {
        const { result, rerender } = renderHook(
            ({ value }: { value: Item | null }) =>
                usePresence(value, { getKey: (item) => item.id, exitDurationMs: 150 }),
            { initialProps: { value: null as Item | null } }
        );

        rerender({ value: { id: 'a', label: 'A' } });
        expect(result.current).toEqual({ item: { id: 'a', label: 'A' }, key: 'a', visible: false });

        act(() => {
            vi.advanceTimersByTime(16);
        });
        expect(result.current).toEqual({ item: { id: 'a', label: 'A' }, key: 'a', visible: true });
    });

    it('同じ key の更新では表示状態を維持しつつ最新 item を返す', () => {
        const { result, rerender } = renderHook(
            ({ value }: { value: Item | null }) =>
                usePresence(value, { getKey: (item) => item.id, exitDurationMs: 150 }),
            { initialProps: { value: { id: 'a', label: 'A1' } as Item | null } }
        );

        act(() => {
            vi.advanceTimersByTime(16);
        });
        expect(result.current?.visible).toBe(true);

        rerender({ value: { id: 'a', label: 'A2' } });
        expect(result.current).toEqual({ item: { id: 'a', label: 'A2' }, key: 'a', visible: true });
    });

    it('別 key に切り替わると visible=false に戻り、次フレームで visible=true になる', () => {
        const { result, rerender } = renderHook(
            ({ value }: { value: Item | null }) =>
                usePresence(value, { getKey: (item) => item.id, exitDurationMs: 150 }),
            { initialProps: { value: { id: 'a', label: 'A' } as Item | null } }
        );

        act(() => {
            vi.advanceTimersByTime(16);
        });
        expect(result.current?.visible).toBe(true);

        rerender({ value: { id: 'b', label: 'B' } });
        expect(result.current).toEqual({ item: { id: 'b', label: 'B' }, key: 'b', visible: false });

        act(() => {
            vi.advanceTimersByTime(16);
        });
        expect(result.current).toEqual({ item: { id: 'b', label: 'B' }, key: 'b', visible: true });
    });

    it('値 → null で即座に visible=false になり、exitDurationMs 経過後に null になる', () => {
        const { result, rerender } = renderHook(
            ({ value }: { value: Item | null }) =>
                usePresence(value, { getKey: (item) => item.id, exitDurationMs: 150 }),
            { initialProps: { value: { id: 'a', label: 'A' } as Item | null } }
        );

        act(() => {
            vi.advanceTimersByTime(16);
        });
        expect(result.current?.visible).toBe(true);

        rerender({ value: null });
        expect(result.current).toEqual({ item: { id: 'a', label: 'A' }, key: 'a', visible: false });

        act(() => {
            vi.advanceTimersByTime(149);
        });
        expect(result.current).not.toBeNull();

        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(result.current).toBeNull();
    });

    it('退場完了前に新しい値が来たらアンマウントタイマーがキャンセルされる', () => {
        const { result, rerender } = renderHook(
            ({ value }: { value: Item | null }) =>
                usePresence(value, { getKey: (item) => item.id, exitDurationMs: 150 }),
            { initialProps: { value: { id: 'a', label: 'A' } as Item | null } }
        );

        act(() => {
            vi.advanceTimersByTime(16);
        });
        rerender({ value: null });

        act(() => {
            vi.advanceTimersByTime(100);
        });
        rerender({ value: { id: 'b', label: 'B' } });

        act(() => {
            vi.advanceTimersByTime(100);
        });
        expect(result.current).toEqual({ item: { id: 'b', label: 'B' }, key: 'b', visible: true });
    });
});
