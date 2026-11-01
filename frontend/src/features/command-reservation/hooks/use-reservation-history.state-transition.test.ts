import { act, renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { ReservationCommand } from '../types';
import { useReservationHistory } from './use-reservation-history';

function makeExtraCommands(): ReservationCommand[] {
    return [
        { id: 'a', name: 'A', commandType: 'normal', estimatedTurn: 0, estimatedFundsDelta: 0 },
        { id: 'b', name: 'B', commandType: 'normal', estimatedTurn: 0, estimatedFundsDelta: 0 },
    ];
}

describe('use-reservation-history 状態遷移', () => {
    it('addCommand: 末尾追加・dirty・canUndo', () => {
        const { result } = renderHook(() => useReservationHistory(makeExtraCommands()));
        act(() =>
            result.current.addCommand({
                id: 'c',
                name: 'C',
                commandType: 'normal',
                estimatedTurn: 0,
                estimatedFundsDelta: 0,
            })
        );
        expect(result.current.commands.map((c) => c.id)).toEqual(['a', 'b', 'c']);
        expect(result.current.isDirty).toBe(true);
        expect(result.current.canUndo).toBe(true);
    });
    it('updateCommand: 部分マージ', () => {
        const { result } = renderHook(() => useReservationHistory(makeExtraCommands()));
        act(() => result.current.updateCommand('a', { name: 'A2' }));
        expect(result.current.commands[0].name).toBe('A2');
    });
    it('reorderCommandsById: toId=null で末尾移動', () => {
        const { result } = renderHook(() => useReservationHistory(makeExtraCommands()));
        act(() => result.current.reorderCommandsById('a', null));
        expect(result.current.commands.map((c) => c.id)).toEqual(['b', 'a']);
    });
    it('reorderCommandsById: 中間挿入', () => {
        const three: ReservationCommand[] = [
            ...makeExtraCommands(),
            { id: 'c', name: 'C', commandType: 'normal', estimatedTurn: 0, estimatedFundsDelta: 0 },
        ];
        const { result } = renderHook(() => useReservationHistory(three));
        act(() => result.current.reorderCommandsById('c', 'a'));
        expect(result.current.commands.map((c) => c.id)).toEqual(['c', 'a', 'b']);
    });
    it('reorderCommandsById: 不正idでno-op', () => {
        const { result } = renderHook(() => useReservationHistory(makeExtraCommands()));
        act(() => result.current.reorderCommandsById('zzz', 'a'));
        expect(result.current.commands.map((c) => c.id)).toEqual(['a', 'b']);
    });
    it('markSaved: isDirty解除', () => {
        const { result } = renderHook(() => useReservationHistory(makeExtraCommands()));
        act(() =>
            result.current.addCommand({
                id: 'c',
                name: 'C',
                commandType: 'normal',
                estimatedTurn: 0,
                estimatedFundsDelta: 0,
            })
        );
        act(() => result.current.markSaved());
        expect(result.current.isDirty).toBe(false);
        expect(result.current.canUndo).toBe(true);
    });
    it('resetCommands: 履歴クリア・置換・dirty解除', () => {
        const { result } = renderHook(() => useReservationHistory(makeExtraCommands()));
        act(() =>
            result.current.addCommand({
                id: 'c',
                name: 'C',
                commandType: 'normal',
                estimatedTurn: 0,
                estimatedFundsDelta: 0,
            })
        );
        const nw = [
            {
                id: 'x',
                name: 'X',
                commandType: 'normal',
                estimatedTurn: 0,
                estimatedFundsDelta: 0,
            } as ReservationCommand,
        ];
        act(() => result.current.resetCommands(nw));
        expect(result.current.commands).toEqual(nw);
        expect(result.current.canUndo).toBe(false);
        expect(result.current.isDirty).toBe(false);
    });
    it('undo/redo: isDirty維持', () => {
        const { result } = renderHook(() => useReservationHistory(makeExtraCommands()));
        act(() =>
            result.current.addCommand({
                id: 'c',
                name: 'C',
                commandType: 'normal',
                estimatedTurn: 0,
                estimatedFundsDelta: 0,
            })
        );
        act(() => result.current.undo());
        expect(result.current.isDirty).toBe(true);
        act(() => result.current.redo());
        expect(result.current.isDirty).toBe(true);
    });
});
