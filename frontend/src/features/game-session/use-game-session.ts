import { use } from 'react';
import { GameSessionContext } from './context';
import type { GameSessionContextValue } from './types';

export function useGameSession(): GameSessionContextValue {
    const context = use(GameSessionContext);
    if (!context) {
        throw new Error('useGameSession は GameSessionProvider の内側で使用してください');
    }
    return context;
}
