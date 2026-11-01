import { createContext } from 'react';
import type { GameSessionContextValue, GameSessionStateContextValue, GameSessionActionsContextValue } from './types';

export const GameSessionContext = createContext<GameSessionContextValue | null>(null);
export const GameSessionStateContext = createContext<GameSessionStateContextValue | null>(null);
export const GameSessionActionsContext = createContext<GameSessionActionsContextValue | null>(null);
