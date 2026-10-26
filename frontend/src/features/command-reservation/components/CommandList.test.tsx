import { render, screen, fireEvent, within } from '@testing-library/react';
import type { ReservationCommand } from '../types';
import { CommandList } from './CommandList';

vi.mock('./CommandDetailEditor', () => ({
    CommandDetailEditor: () => <div data-testid="mock-detail-editor" />,
}));

function makeCommands(): ReservationCommand[] {
    return [
        { id: 'a', commandType: 'normal', name: '埋め立て', estimatedTurn: 1, estimatedFundsDelta: 0 },
        { id: 'b', commandType: 'normal', name: '食料輸出', estimatedTurn: 2, estimatedFundsDelta: 0 },
        { id: 'c', commandType: 'fast', name: '通常ミサイル', estimatedTurn: 3, estimatedFundsDelta: 0 },
    ];
}

const baseProps = {
    expandedIds: new Set<string>(),
    focusedId: null as string | null,
    onToggleExpand: () => {},
    onSelectCommand: () => {},
    onUpdateCommand: () => {},
    onDeleteCommand: () => {},
    onReorderCommands: () => {},
};

describe('CommandList 空表示・行番号・id基準操作', () => {
    it('0件で空メッセージ表示', () => {
        render(<CommandList commands={[]} {...baseProps} />);

        expect(screen.getByText('予約されたコマンドはありません')).toBeInTheDocument();
    });

    it('件数分行が data-command-row-index=0..n-1 で並ぶ', () => {
        const { container } = render(<CommandList commands={makeCommands()} {...baseProps} />);

        const rows = container.querySelectorAll('[data-command-row-index]');
        expect(rows).toHaveLength(3);
        expect(rows[0]?.getAttribute('data-command-row-index')).toBe('0');
        expect(rows[1]?.getAttribute('data-command-row-index')).toBe('1');
        expect(rows[2]?.getAttribute('data-command-row-index')).toBe('2');
    });

    it('表示番号は index+1 (01,02,03)', () => {
        render(<CommandList commands={makeCommands()} {...baseProps} />);

        expect(screen.getByText('01')).toBeInTheDocument();
        expect(screen.getByText('02')).toBeInTheDocument();
        expect(screen.getByText('03')).toBeInTheDocument();
    });

    it('削除は正しいidで呼ばれる', () => {
        const onDeleteCommand = vi.fn();
        render(<CommandList commands={makeCommands()} {...baseProps} onDeleteCommand={onDeleteCommand} />);

        const rowB = screen.getByTestId('command-item-b');
        fireEvent.click(within(rowB).getByRole('button', { name: 'コマンド削除' }));

        expect(onDeleteCommand).toHaveBeenCalledTimes(1);
        expect(onDeleteCommand).toHaveBeenCalledWith('b');
    });

    it('行選択はコマンドオブジェクトで呼ばれる', () => {
        const onSelectCommand = vi.fn();
        render(<CommandList commands={makeCommands()} {...baseProps} onSelectCommand={onSelectCommand} />);

        fireEvent.click(screen.getByTestId('command-item-c'));

        expect(onSelectCommand).toHaveBeenCalledTimes(1);
        expect(onSelectCommand).toHaveBeenCalledWith(expect.objectContaining({ id: 'c' }));
    });
});
