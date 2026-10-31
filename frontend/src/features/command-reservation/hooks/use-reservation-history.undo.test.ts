import { act, renderHook } from '@testing-library/react';
import type { ReservationCommand } from '../types';
import { useReservationHistory } from './use-reservation-history';

function makeCommands(): ReservationCommand[] {
    return [
        { id: 'a', commandType: 'normal', name: 'A', estimatedTurn: 1, estimatedFundsDelta: 0 },
        { id: 'b', commandType: 'normal', name: 'B', estimatedTurn: 2, estimatedFundsDelta: 0 },
    ];
}

describe('useReservationHistory undo/redo', () => {
    it('update→undoで元に戻り canRedo=true', () => {
        const { result } = renderHook(() => useReservationHistory(makeCommands()));

        act(() => {
            result.current.updateCommand('a', { name: 'A2' });
        });
        expect(result.current.commands[0]?.name).toBe('A2');

        act(() => {
            result.current.undo();
        });
        expect(result.current.commands[0]?.name).toBe('A');
        expect(result.current.canUndo).toBe(false);
        expect(result.current.canRedo).toBe(true);
    });

    it('undo→redoで進む', () => {
        const { result } = renderHook(() => useReservationHistory(makeCommands()));

        act(() => {
            result.current.updateCommand('a', { name: 'A2' });
        });
        act(() => {
            result.current.undo();
        });
        act(() => {
            result.current.redo();
        });

        expect(result.current.commands[0]?.name).toBe('A2');
        expect(result.current.canUndo).toBe(true);
        expect(result.current.canRedo).toBe(false);
    });

    it('空履歴のundo/redoは何も起きない・落ちない', () => {
        const { result } = renderHook(() => useReservationHistory(makeCommands()));
        const before = result.current.commands;

        act(() => {
            result.current.undo();
        });
        act(() => {
            result.current.redo();
        });

        expect(result.current.commands).toBe(before);
        expect(result.current.canUndo).toBe(false);
        expect(result.current.canRedo).toBe(false);
        expect(result.current.isDirty).toBe(false);
    });

    it('update→undo→別updateでcanRedo=false', () => {
        const { result } = renderHook(() => useReservationHistory(makeCommands()));

        act(() => {
            result.current.updateCommand('a', { name: 'A2' });
        });
        act(() => {
            result.current.undo();
        });
        expect(result.current.canRedo).toBe(true);

        act(() => {
            result.current.updateCommand('b', { name: 'B2' });
        });
        expect(result.current.commands[1]?.name).toBe('B2');
        expect(result.current.canRedo).toBe(false);
    });
});
