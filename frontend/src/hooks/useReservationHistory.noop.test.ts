import { act, renderHook } from '@testing-library/react';
import type { ReservationCommand } from '../types/command-reservation';
import { useReservationHistory } from './useReservationHistory';

function makeCommands(): ReservationCommand[] {
    return [
        { id: 'a', commandType: 'normal', name: 'A', estimatedTurn: 1, estimatedFundsDelta: 0 },
        { id: 'b', commandType: 'normal', name: 'B', estimatedTurn: 2, estimatedFundsDelta: 0 },
        { id: 'c', commandType: 'fast', name: 'C', estimatedTurn: 3, estimatedFundsDelta: 0 },
    ];
}

describe('useReservationHistory no-opガード (P0-10,11)', () => {
    it('reorder(1,1) は履歴・dirtyを触らない', () => {
        const { result } = renderHook(() => useReservationHistory(makeCommands()));
        const before = result.current.commands;

        act(() => {
            result.current.reorderCommands(1, 1);
        });

        expect(result.current.commands).toBe(before);
        expect(result.current.canUndo).toBe(false);
        expect(result.current.isDirty).toBe(false);
    });

    it('reorder(-1,0) / reorder(0,99) は履歴・dirtyを触らない', () => {
        const { result } = renderHook(() => useReservationHistory(makeCommands()));
        const before = result.current.commands;

        act(() => {
            result.current.reorderCommands(-1, 0);
        });
        expect(result.current.commands).toBe(before);
        expect(result.current.canUndo).toBe(false);
        expect(result.current.isDirty).toBe(false);

        act(() => {
            result.current.reorderCommands(0, 99);
        });
        expect(result.current.commands).toBe(before);
        expect(result.current.canUndo).toBe(false);
        expect(result.current.isDirty).toBe(false);
    });

    it('update(存在しないid) は履歴・dirtyを触らない', () => {
        const { result } = renderHook(() => useReservationHistory(makeCommands()));
        const before = result.current.commands;

        act(() => {
            result.current.updateCommand('not-exist', { name: 'X' });
        });

        expect(result.current.commands).toBe(before);
        expect(result.current.canUndo).toBe(false);
        expect(result.current.isDirty).toBe(false);
    });

    it('delete(存在しないid) は履歴・dirtyを触らない', () => {
        const { result } = renderHook(() => useReservationHistory(makeCommands()));
        const before = result.current.commands;

        act(() => {
            result.current.deleteCommand('not-exist');
        });

        expect(result.current.commands).toBe(before);
        expect(result.current.canUndo).toBe(false);
        expect(result.current.isDirty).toBe(false);
    });

    it('有効な更新は履歴に積まれる（ガードの対照ケース）', () => {
        const { result } = renderHook(() => useReservationHistory(makeCommands()));

        act(() => {
            result.current.updateCommand('a', { name: 'A2' });
        });

        expect(result.current.commands[0]?.name).toBe('A2');
        expect(result.current.canUndo).toBe(true);
        expect(result.current.isDirty).toBe(true);
    });
});
