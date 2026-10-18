import { act, renderHook } from '@testing-library/react';
import type { ReservationCommand } from '../types/command-reservation';
import { useReservationHistory } from './useReservationHistory';

function makeCommands(): ReservationCommand[] {
    return [
        { id: 'a', commandType: 'normal', name: '埋め立て', estimatedTurn: 1, estimatedFundsDelta: 0 },
        { id: 'b', commandType: 'normal', name: '食料輸出', estimatedTurn: 2, estimatedFundsDelta: 0 },
        { id: 'c', commandType: 'fast', name: '通常ミサイル', estimatedTurn: 3, estimatedFundsDelta: 0 },
    ];
}

describe('useReservationHistory 基本操作', () => {
    it('空配列で初期化でき、undo/redo不可・dirty=false', () => {
        const { result } = renderHook(() => useReservationHistory([]));

        expect(result.current.commands).toEqual([]);
        expect(result.current.canUndo).toBe(false);
        expect(result.current.canRedo).toBe(false);
        expect(result.current.isDirty).toBe(false);
    });

    it('deleteで指定idのみ削除される', () => {
        const { result } = renderHook(() => useReservationHistory(makeCommands()));

        act(() => {
            result.current.deleteCommand('b');
        });

        expect(result.current.commands.map((c) => c.id)).toEqual(['a', 'c']);
        expect(result.current.canUndo).toBe(true);
        expect(result.current.isDirty).toBe(true);
    });

    it('reorder 先頭→末尾', () => {
        const { result } = renderHook(() => useReservationHistory(makeCommands()));

        act(() => {
            result.current.reorderCommands(0, 2);
        });

        expect(result.current.commands.map((c) => c.id)).toEqual(['b', 'c', 'a']);
    });

    it('reorder 末尾→先頭', () => {
        const { result } = renderHook(() => useReservationHistory(makeCommands()));

        act(() => {
            result.current.reorderCommands(2, 0);
        });

        expect(result.current.commands.map((c) => c.id)).toEqual(['c', 'a', 'b']);
    });

    it('reorder 隣接入れ替え', () => {
        const { result } = renderHook(() => useReservationHistory(makeCommands()));

        act(() => {
            result.current.reorderCommands(1, 2);
        });

        expect(result.current.commands.map((c) => c.id)).toEqual(['a', 'c', 'b']);
    });

    it('変更後は isDirty=true・canUndo=true・futureクリア', () => {
        const { result } = renderHook(() => useReservationHistory(makeCommands()));

        act(() => {
            result.current.updateCommand('a', { name: 'A2' });
        });
        expect(result.current.isDirty).toBe(true);
        expect(result.current.canUndo).toBe(true);
        expect(result.current.canRedo).toBe(false);

        act(() => {
            result.current.undo();
        });
        expect(result.current.canRedo).toBe(true);

        // 新規変更で redo が消える
        act(() => {
            result.current.updateCommand('b', { name: 'B2' });
        });
        expect(result.current.canRedo).toBe(false);
        expect(result.current.commands[1]?.name).toBe('B2');
    });
});
