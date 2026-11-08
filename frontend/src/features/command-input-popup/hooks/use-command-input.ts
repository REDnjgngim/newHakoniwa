import { useMemo, useState } from 'react';
import { COMMAND_REGISTRY } from '@/features/command-reservation/command-registry';
import type { CommandInputMode, UseCommandInputResult } from '../types';

export function useCommandInput(): UseCommandInputResult {
    const [activeMode, setActiveMode] = useState<CommandInputMode>('classic');
    const [quantity, setQuantity] = useState<number>(1);

    const setQuantityClamped = (q: number) => {
        setQuantity(Math.max(1, Math.min(99, q)));
    };

    const visibleCommands = useMemo(() => {
        if (activeMode === 'classic') {
            return COMMAND_REGISTRY.filter((def) => def.hasCoordinate);
        }
        return COMMAND_REGISTRY.filter((def) => !def.hasCoordinate);
    }, [activeMode]);

    return {
        activeMode,
        setActiveMode,
        quantity,
        setQuantity: setQuantityClamped,
        visibleCommands,
    };
}
