import { useCallback, useState } from 'react';
import type { ReservationCommand } from '../types/command-reservation';

export interface UseReservationHistoryReturn {
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
}

function normalizeOrders(cmds: ReservationCommand[]): ReservationCommand[] {
    return cmds.map((cmd, idx) => ({
        ...cmd,
        order: idx + 1,
    }));
}

export function useReservationHistory(initialCommands: ReservationCommand[]): UseReservationHistoryReturn {
    // 3スタック（past, present, future）方式による履歴管理
    const [past, setPast] = useState<ReservationCommand[][]>([]);
    const [present, setPresent] = useState<ReservationCommand[]>(() => normalizeOrders(initialCommands));
    const [future, setFuture] = useState<ReservationCommand[][]>([]);
    const [isDirty, setIsDirty] = useState<boolean>(false);

    // 新しい状態への遷移共通関数
    const setNextState = useCallback((getNext: (current: ReservationCommand[]) => ReservationCommand[]) => {
        setPresent((current) => {
            const next = normalizeOrders(getNext(current));
            setPast((prevPast) => [...prevPast, current]);
            setFuture([]);
            setIsDirty(true);
            return next;
        });
    }, []);

    const updateCommand = useCallback(
        (id: string, partial: Partial<ReservationCommand>) => {
            setNextState((current) => current.map((cmd) => (cmd.id === id ? { ...cmd, ...partial } : cmd)));
        },
        [setNextState]
    );

    const deleteCommand = useCallback(
        (id: string) => {
            setNextState((current) => current.filter((cmd) => cmd.id !== id));
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
        setPast((prevPast) => {
            if (prevPast.length === 0) return prevPast;
            const previous = prevPast[prevPast.length - 1];
            if (!previous) return prevPast;
            const newPast = prevPast.slice(0, prevPast.length - 1);

            setPresent((current) => {
                setFuture((prevFuture) => [current, ...prevFuture]);
                return previous;
            });
            setIsDirty(true);
            return newPast;
        });
    }, []);

    const redo = useCallback(() => {
        setFuture((prevFuture) => {
            if (prevFuture.length === 0) return prevFuture;
            const next = prevFuture[0];
            if (!next) return prevFuture;
            const newFuture = prevFuture.slice(1);

            setPresent((current) => {
                setPast((prevPast) => [...prevPast, current]);
                return next;
            });
            setIsDirty(true);
            return newFuture;
        });
    }, []);

    const markSaved = useCallback(() => {
        setIsDirty(false);
    }, []);

    const resetCommands = useCallback((newCommands: ReservationCommand[]) => {
        setPast([]);
        setPresent(normalizeOrders(newCommands));
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
