import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { sectorTerrain } from './mocks/sector-terrain';
import { mockIslandStatus } from './mocks/island-status';
import { mockReservationCommands } from './mocks/command-reservation';
import { GameSessionProvider } from './features/game-session';
import { App } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('ルート要素(#root)が見つかりません');

createRoot(rootElement).render(
    <StrictMode>
        <GameSessionProvider
            initialSector={sectorTerrain}
            initialIslandStatus={mockIslandStatus}
            initialCommands={mockReservationCommands}
        >
            <App />
        </GameSessionProvider>
    </StrictMode>
);
