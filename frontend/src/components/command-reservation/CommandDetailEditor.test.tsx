import { render, screen, fireEvent } from '@testing-library/react';
import type { ReservationCommand } from '../../types/command-reservation';
import { CommandDetailEditor } from './CommandDetailEditor';

function makeAmountCommand(overrides: Partial<ReservationCommand> = {}): ReservationCommand {
    return {
        id: 'cmd-amount',
        commandType: 'normal',
        name: '物資購入',
        estimatedTurn: 101,
        estimatedFundsDelta: -10,
        params: { amount: 28 },
        ...overrides,
    };
}

describe('CommandDetailEditor スライダー・目標の島', () => {
    it('amountはそのままスライダー値になる', () => {
        render(<CommandDetailEditor command={makeAmountCommand()} onUpdate={() => {}} />);

        expect(screen.getByText('数量: 28')).toBeInTheDocument();
        const slider = screen.getByRole('slider') as HTMLInputElement;
        expect(slider.min).toBe('1');
        expect(slider.max).toBe('99');
        expect(slider.value).toBe('28');
    });

    it('クランプ 下限(0・負数・NaN→1)', () => {
        const cases: { amount: unknown; expected: string }[] = [
            { amount: 0, expected: '1' },
            { amount: -5, expected: '1' },
            { amount: NaN, expected: '1' },
        ];
        for (const { amount, expected } of cases) {
            const { unmount } = render(
                <CommandDetailEditor
                    command={makeAmountCommand({ params: { amount: amount as number } })}
                    onUpdate={() => {}}
                />
            );
            expect((screen.getByRole('slider') as HTMLInputElement).value).toBe(expected);
            unmount();
        }
    });

    it('クランプ 上限(100・999→99)', () => {
        for (const amount of [100, 999]) {
            const { unmount } = render(
                <CommandDetailEditor command={makeAmountCommand({ params: { amount } })} onUpdate={() => {}} />
            );
            expect((screen.getByRole('slider') as HTMLInputElement).value).toBe('99');
            unmount();
        }
    });

    it('クランプ 小数切り捨て(28.9→28)', () => {
        render(<CommandDetailEditor command={makeAmountCommand({ params: { amount: 28.9 } })} onUpdate={() => {}} />);

        expect((screen.getByRole('slider') as HTMLInputElement).value).toBe('28');
    });

    it('非数値(string・boolean・Infinity)はフォールバック1', () => {
        const cases: unknown[] = ['28', true, Number.POSITIVE_INFINITY];
        for (const amount of cases) {
            const { unmount } = render(
                <CommandDetailEditor
                    command={makeAmountCommand({ params: { amount: amount as number } })}
                    onUpdate={() => {}}
                />
            );
            expect((screen.getByRole('slider') as HTMLInputElement).value).toBe('1');
            unmount();
        }
    });

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

        // react-select(目標の島)を開いてエデン島を選ぶ
        const combo = screen.getByLabelText('目標の島');
        fireEvent.focus(combo);
        fireEvent.keyDown(combo, { key: 'ArrowDown', keyCode: 40 });
        const option = await screen.findByText('エデン島');
        fireEvent.click(option);

        expect(updated).not.toBeNull();
        expect((updated as unknown as ReservationCommand).targetIsland).toBe('エデン島');
        expect((updated as unknown as ReservationCommand).params?.targetIsland).toBe('エデン島');
        // 触っていない値は維持される
        expect((updated as unknown as ReservationCommand).params?.missileCount).toBe(28);
    });
});
