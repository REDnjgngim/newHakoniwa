import { useCallback, useRef, useState } from 'react';
import type { ReservationCommand } from '../types';

export type UseReservationHistoryReturn = {
    /** 現在の予約コマンドリスト（= present） */
    commands: ReservationCommand[];
    /** 変更操作（履歴に積む） */
    addCommand: (command: ReservationCommand) => void;
    updateCommand: (id: string, partial: Partial<ReservationCommand>) => void;
    deleteCommand: (id: string) => void;
    reorderCommands: (fromIndex: number, toIndex: number) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    isDirty: boolean;
    markSaved: () => void;
    resetCommands: (newCommands: ReservationCommand[]) => void;
};

export function useReservationHistory(initialCommands: ReservationCommand[]): UseReservationHistoryReturn {
    // 3スタック（past, present, future）方式による履歴管理
    // 表示番号は描画時に index+1 で出す。内部に order を持たない。
    // 将来バックエンドが order を要求したら送信直前に
    // commands.map((c, i) => ({ ...c, order: i + 1 })) で付与する。
    const [past, setPast] = useState<ReservationCommand[][]>([]);
    const [present, setPresent] = useState<ReservationCommand[]>(initialCommands);
    const [future, setFuture] = useState<ReservationCommand[][]>([]);
    const [isDirty, setIsDirty] = useState<boolean>(false);

    const pastRef = useRef<ReservationCommand[][]>(past);
    const presentRef = useRef<ReservationCommand[]>(present);
    const futureRef = useRef<ReservationCommand[][]>(future);

    // 新しい状態への遷移共通関数
    const setNextState = useCallback((getNext: (current: ReservationCommand[]) => ReservationCommand[]) => {
        const current = presentRef.current;
        const next = getNext(current);
        if (next === current) return;
        pastRef.current = [...pastRef.current, current];
        futureRef.current = [];
        presentRef.current = next;
        setPast(pastRef.current);
        setFuture([]);
        setPresent(next);
        setIsDirty(true);
    }, []);

    const addCommand = useCallback(
        (command: ReservationCommand) => {
            setNextState((current) => [...current, command]);
        },
        [setNextState]
    );

    const updateCommand = useCallback(
        (id: string, partial: Partial<ReservationCommand>) => {
            setNextState((current) => {
                if (!current.some((cmd) => cmd.id === id)) return current;
                return current.map((cmd) => (cmd.id === id ? { ...cmd, ...partial } : cmd));
            });
        },
        [setNextState]
    );

    const deleteCommand = useCallback(
        (id: string) => {
            setNextState((current) => {
                const next = current.filter((cmd) => cmd.id !== id);
                if (next.length === current.length) return current;
                return next;
            });
        },
        [setNextState]
    );

    const reorderCommands = useCallback(
        (fromIndex: number, toIndex: number) => {
            setNextState((current) => {
                if (
                    fromIndex < 0 ||
                    fromIndex >= current.length ||
                    toIndex < 0 ||
                    toIndex >= current.length ||
                    fromIndex === toIndex
                ) {
                    return current;
                }
                const updated = [...current];
                const [movedItem] = updated.splice(fromIndex, 1);
                if (!movedItem) return current;
                updated.splice(toIndex, 0, movedItem);
                return updated;
            });
        },
        [setNextState]
    );

    const undo = useCallback(() => {
        const p = pastRef.current;
        if (p.length === 0) return;
        const previous = p[p.length - 1];
        if (!previous) return;
        pastRef.current = p.slice(0, -1);
        futureRef.current = [presentRef.current, ...futureRef.current];
        presentRef.current = previous;
        setPast(pastRef.current);
        setFuture(futureRef.current);
        setPresent(previous);
        setIsDirty(true);
    }, []);

    const redo = useCallback(() => {
        const f = futureRef.current;
        if (f.length === 0) return;
        const next = f[0];
        if (!next) return;
        futureRef.current = f.slice(1);
        pastRef.current = [...pastRef.current, presentRef.current];
        presentRef.current = next;
        setFuture(futureRef.current);
        setPast(pastRef.current);
        setPresent(next);
        setIsDirty(true);
    }, []);

    const markSaved = useCallback(() => {
        setIsDirty(false);
    }, []);

    const resetCommands = useCallback((newCommands: ReservationCommand[]) => {
        pastRef.current = [];
        presentRef.current = newCommands;
        futureRef.current = [];
        setPast([]);
        setPresent(newCommands);
        setFuture([]);
        setIsDirty(false);
    }, []);

    return {
        commands: present,
        addCommand,
        updateCommand,
        deleteCommand,
        reorderCommands,
        undo,
        redo,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
        isDirty,
        markSaved,
        resetCommands,
    };
}
