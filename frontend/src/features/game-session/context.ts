import { createContext } from 'react';
import type { GameSessionContextValue } from './types';

export const GameSessionContext = createContext<GameSessionContextValue | null>(null);
