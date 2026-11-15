import { act, fireEvent, render, screen } from '@testing-library/react';
import type { SectorData } from '@/shared';
import { GameSessionProvider, useGameSessionActions, useGameSessionState } from '@/features/game-session';
import { mockIslandStatus } from '@/features/island-status/mocks/island-status';
import { getClassicTerrain } from '@/rules/classic';
import { COMMAND_POPUP_EXIT_MS } from '../command-input-logic';
import { CommandInputPopupContainer } from './CommandInputPopupContainer';

function SessionHarness() {
    const { selectedCoordinate, commands } = useGameSessionState();
    const { selectTile } = useGameSessionActions();

    return (
        <div>
            <button type="button" onClick={() => selectTile({ x: 0, y: 0 })}>
                select-0-0
            </button>
            <button type="button" onClick={() => selectTile({ x: 1, y: 0 })}>
                select-1-0
            </button>
            <div data-testid="selected-coord">
                {selectedCoordinate ? `${selectedCoordinate.x},${selectedCoordinate.y}` : 'none'}
            </div>
            <div data-testid="command-count">{commands.length}</div>
        </div>
    );
}

const testSector: SectorData = {
    sector_id: 1,
    map_width: 2,
    map_height: 1,
    terrain_grid: [[{ type: 'sea' }, { type: 'plains' }]],
    objects: [],
    units: [],
};

describe('CommandInputPopupContainer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    function renderWithSession() {
        return render(
            <GameSessionProvider initialSector={testSector} initialIslandStatus={mockIslandStatus}>
                <SessionHarness />
                <CommandInputPopupContainer resolveTerrain={getClassicTerrain} />
            </GameSessionProvider>
        );
    }

    it('未選択時は非表示、選択時にフェードインし、×ボタンで選択解除＋フェードアウト後に消える', () => {
        renderWithSession();
        expect(screen.queryByRole('button', { name: '閉じる' })).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: 'select-1-0' }));
        expect(screen.getByText('(1,0) 平地')).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(16);
        });

        fireEvent.click(screen.getByRole('button', { name: '閉じる' }));
        expect(screen.getByTestId('selected-coord')).toHaveTextContent('none');
        expect(screen.getByRole('button', { name: '閉じる' })).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(COMMAND_POPUP_EXIT_MS);
        });
        expect(screen.queryByRole('button', { name: '閉じる' })).toBeNull();
    });

    it('コマンドカードを押すと予約リストに追加され、ポップアップは開いたまま維持される', () => {
        renderWithSession();
        fireEvent.click(screen.getByRole('button', { name: 'select-1-0' }));
        act(() => {
            vi.advanceTimersByTime(16);
        });

        fireEvent.click(screen.getByRole('button', { name: /整地/ }));

        expect(screen.getByTestId('command-count')).toHaveTextContent('1');
        expect(screen.getByRole('button', { name: '閉じる' })).toBeInTheDocument();
    });

    it('開いている状態で別マスを選んだとき、外枠は表示状態のまま中身だけ切り替わる', () => {
        const { container } = renderWithSession();
        fireEvent.click(screen.getByRole('button', { name: 'select-1-0' }));
        act(() => {
            vi.advanceTimersByTime(16);
        });

        const popup = container.querySelector('.z-40');
        expect(popup).toHaveClass('opacity-100', 'pointer-events-auto');
        expect(screen.getByText('(1,0) 平地')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'select-0-0' }));
        // 外枠は非表示に戻らず即座に表示状態を維持したまま中身が切り替わる
        expect(popup).toHaveClass('opacity-100', 'pointer-events-auto');
        expect(screen.getByText('(0,0) 海')).toBeInTheDocument();
    });
});
