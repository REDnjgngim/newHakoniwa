import { useCallback, useMemo, useState } from 'react';
import { COMMAND_REGISTRY } from '@/features/command-reservation';
import { clampQuantity, filterCommandsByMode, QUANTITY_MIN } from '../command-input-logic';
import type { CommandInputMode, UseCommandInputResult } from '../types';

export function useCommandInput(): UseCommandInputResult {
    const [activeMode, setActiveMode] = useState<CommandInputMode>('classic');
    const [quantity, setQuantity] = useState<number>(QUANTITY_MIN);

    const setQuantityClamped = useCallback((q: number) => {
        setQuantity(clampQuantity(q));
    }, []);

    const visibleCommands = useMemo(() => filterCommandsByMode(COMMAND_REGISTRY, activeMode), [activeMode]);

    return {
        activeMode,
        setActiveMode,
        quantity,
        setQuantity: setQuantityClamped,
        visibleCommands,
    };
}
