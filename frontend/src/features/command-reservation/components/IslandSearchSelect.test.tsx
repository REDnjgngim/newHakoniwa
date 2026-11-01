import { vi } from 'vitest';
import { IslandSearchSelect } from './IslandSearchSelect';
import { render, screen, fireEvent } from '@testing-library/react';

describe('IslandSearchSelect extra', () => {
    it('value が select に反映される（null は空文字）', () => {
        render(
            <IslandSearchSelect
                value="b"
                onChange={() => {}}
                options={[
                    { value: 'a', label: '島A' },
                    { value: 'b', label: '島B' },
                ]}
                commandId="x"
            />
        );
        expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('b');
    });
    it('選択時に onChange が呼ばれる', () => {
        const onChange = vi.fn();
        render(
            <IslandSearchSelect
                value={null}
                onChange={onChange}
                options={[{ value: 'a', label: '島A' }]}
                commandId="x"
            />
        );
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'a' } });
        expect(onChange).toHaveBeenCalledWith('a');
    });
});
