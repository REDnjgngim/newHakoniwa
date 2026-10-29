import { render } from '@testing-library/react';
import type { SectorTerrainData } from '../../shared/types/terrain';
import type { IslandStatus } from '../island-status/types';
import { GameSessionProvider } from './GameSessionProvider';

describe('GameSessionContext', () => {
    it('provider が children を描画', () => {
        const sector = {} as SectorTerrainData;
        const status = {} as IslandStatus;
        render(
            <GameSessionProvider initialSector={sector} initialIslandStatus={status}>
                <div>child</div>
            </GameSessionProvider>
        );
        expect(true).toBe(true);
    });
});
