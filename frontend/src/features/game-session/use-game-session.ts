import { use } from 'react';
import { GameSessionContext, GameSessionStateContext, GameSessionActionsContext } from './context';
import type { GameSessionContextValue, GameSessionStateContextValue, GameSessionActionsContextValue } from './types';

export function useGameSession(): GameSessionContextValue {
    const context = use(GameSessionContext);
    if (!context) {
        throw new Error('useGameSession は GameSessionProvider の内側で使用してください');
    }
    return context;
}

export function useGameSessionState(): GameSessionStateContextValue {
    const context = use(GameSessionStateContext);
    if (!context) {
        throw new Error('useGameSessionState は GameSessionProvider の内側で使用してください');
    }
    return context;
}

export function useGameSessionActions(): GameSessionActionsContextValue {
    const context = use(GameSessionActionsContext);
    if (!context) {
        throw new Error('useGameSessionActions は GameSessionProvider の内側で使用してください');
    }
    return context;
}
