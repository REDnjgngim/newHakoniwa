import { render, screen, fireEvent } from '@testing-library/react';
import { HeaderStatusBar } from './HeaderStatusBar';
import type { IslandStatus } from '../types';

const status: IslandStatus = {
    turn: 5,
    timeToNextTurn: '0:45:12',
    rank: 3,
    population: 1000,
    funds: 2000,
    food: 300,
    area: 10,
    farm: 5,
    factory: 6,
    mine: 7,
    unemployed: 2,
};

describe('HeaderStatusBar', () => {
    beforeEach(() => sessionStorage.clear());

    it('Turn/順位/人口/資金/食料を表示', () => {
        render(<HeaderStatusBar status={status} />);
        expect(screen.getByText(/Turn 5/)).toBeInTheDocument();
        expect(screen.getByText(/3位/)).toBeInTheDocument();
    });

    it('クリックで展開/折りたたみ', () => {
        render(<HeaderStatusBar status={status} />);
        const box = screen.getByRole('button');
        fireEvent.click(box);
        expect(box.getAttribute('aria-expanded')).toBe('true');
    });

    it('Enter/Space でトグル', () => {
        render(<HeaderStatusBar status={status} />);
        const box = screen.getByRole('button');
        fireEvent.keyDown(box, { key: 'Enter' });
        expect(box.getAttribute('aria-expanded')).toBe('true');
        fireEvent.keyDown(box, { key: ' ' });
        expect(box.getAttribute('aria-expanded')).toBe('false');
    });

    it('sessionStorage 復帰', () => {
        sessionStorage.setItem('header-status-bar:expanded', 'true');
        render(<HeaderStatusBar status={status} />);
        const box = screen.getByRole('button');
        expect(box.getAttribute('aria-expanded')).toBe('true');
    });
});
