import { fireEvent, render, screen } from '@testing-library/react';
import { CommandInputPopup } from './CommandInputPopup';

describe('CommandInputPopup', () => {
    const baseProps = {
        coord: { x: 2, y: 3 },
        terrain: { name: '平地' },
        islandName: 'テスト島',
        onClose: vi.fn(),
        onSelectCommand: vi.fn(),
    };

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('visible=true で表示状態、visible=false で非表示状態になる', () => {
        const { container, rerender } = render(<CommandInputPopup {...baseProps} visible={true} />);
        const popup = container.firstElementChild;
        expect(popup).not.toBeNull();
        expect(popup).toHaveClass('opacity-100', 'pointer-events-auto');

        rerender(<CommandInputPopup {...baseProps} visible={false} />);
        expect(popup).toHaveClass('opacity-0', 'pointer-events-none');
    });

    it('閉じるボタンクリックで onClose が呼ばれる', () => {
        const onClose = vi.fn();
        render(<CommandInputPopup {...baseProps} visible={true} onClose={onClose} />);

        fireEvent.click(screen.getByRole('button', { name: '閉じる' }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('コマンドカードクリックで onSelectCommand が呼ばれ、詳細ボタンでは呼ばれない', () => {
        const onSelectCommand = vi.fn();
        render(<CommandInputPopup {...baseProps} visible={true} onSelectCommand={onSelectCommand} />);

        const detailButtons = screen.getAllByRole('button', { name: '詳細' });
        fireEvent.click(detailButtons[0]);
        expect(onSelectCommand).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: /整地/ }));
        expect(onSelectCommand).toHaveBeenCalledTimes(1);
    });
});
