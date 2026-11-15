import { act, fireEvent, render, screen } from '@testing-library/react';
import { CommandInputPopup } from './CommandInputPopup';

describe('CommandInputPopup 表示・非表示アニメーション', () => {
    const baseProps = {
        coord: { x: 2, y: 3 },
        cell: { type: 'plain' },
        terrainName: '平地',
        islandName: 'テスト島',
        anchorPosition: { x: 100, y: 120 },
        onClose: vi.fn(),
        onSelectCommand: vi.fn(),
    };

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('visible=true のとき次フレームでフェードインし、visible=false でフェードアウト状態になる', () => {
        const { container, rerender } = render(<CommandInputPopup {...baseProps} visible={true} />);
        const popup = container.firstElementChild;
        expect(popup).not.toBeNull();
        expect(popup).toHaveClass('opacity-0', 'pointer-events-none');

        act(() => {
            vi.runAllTimers();
        });

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
});
