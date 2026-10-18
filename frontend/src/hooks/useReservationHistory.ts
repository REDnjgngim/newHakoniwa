import { useCallback, useState } from 'react';
import type { ReservationCommand } from '../types/command-reservation';

export type UseReservationHistoryReturn = {
    commands: ReservationCommand[];
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

    // 新しい状態への遷移共通関数
    // 中身が変わらない操作（getNext が current をそのまま返した場合）は
    // past/future/isDirty を一切触らない（no-opガード）。
    // updater の中で別の setState を呼ばない素直な形にするため、
    // 現在値を直接読んで3つを順に更新する。StrictMode の二重実行でも
    // 副作用が updater 内にないため冪等になる。
    const setNextState = useCallback(
        (getNext: (current: ReservationCommand[]) => ReservationCommand[]) => {
            const next = getNext(present);
            if (next === present) return;
            setPast([...past, present]);
            setFuture([]);
            setPresent(next);
            setIsDirty(true);
        },
        [past, present]
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
        if (past.length === 0) return;
        const previous = past[past.length - 1];
        if (!previous) return;
        setPast(past.slice(0, -1));
        setFuture([present, ...future]);
        setPresent(previous);
        setIsDirty(true);
    }, [past, present, future]);

    const redo = useCallback(() => {
        if (future.length === 0) return;
        const next = future[0];
        if (!next) return;
        setFuture(future.slice(1));
        setPast([...past, present]);
        setPresent(next);
        setIsDirty(true);
    }, [past, present, future]);

    const markSaved = useCallback(() => {
        setIsDirty(false);
    }, []);

    const resetCommands = useCallback((newCommands: ReservationCommand[]) => {
        setPast([]);
        setPresent(newCommands);
        setFuture([]);
        setIsDirty(false);
    }, []);

    return {
        commands: present,
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
