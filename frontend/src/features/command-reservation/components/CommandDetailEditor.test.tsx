import { render, screen, fireEvent } from '@testing-library/react';
import type { ReservationCommand } from '../types';
import { CommandDetailEditor } from './CommandDetailEditor';

describe('CommandDetailEditor 目標の島', () => {
    it('目標の島を選択すると command.targetIsland と params.targetIsland が両方更新される', async () => {
        const command: ReservationCommand = {
            id: 'cmd-missile',
            commandType: 'normal',
            name: '通常ミサイル',
            coordinate: { x: 5, y: 6 },
            targetIsland: 'Neptune島',
            estimatedTurn: 103,
            estimatedFundsDelta: -30,
            params: { missileCount: 28, targetIsland: 'Neptune島' },
        };
        let updated: ReservationCommand | null = null;
        render(<CommandDetailEditor command={command} onUpdate={(next) => (updated = next)} />);

        const combo = screen.getByLabelText('目標の島');
        fireEvent.focus(combo);
        fireEvent.keyDown(combo, { key: 'ArrowDown', keyCode: 40 });
        const option = await screen.findByText('エデン島');
        fireEvent.click(option);

        expect(updated).not.toBeNull();
        expect((updated as unknown as ReservationCommand).targetIsland).toBe('エデン島');
        expect((updated as unknown as ReservationCommand).params?.targetIsland).toBe('エデン島');
        expect((updated as unknown as ReservationCommand).params?.missileCount).toBe(28);
    });
});
