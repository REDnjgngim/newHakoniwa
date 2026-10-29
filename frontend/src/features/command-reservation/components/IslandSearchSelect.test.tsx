import { render } from '@testing-library/react';
import { IslandSearchSelect } from './IslandSearchSelect';

describe('IslandSearchSelect', () => {
    it('render できる', () => {
        render(
            <IslandSearchSelect
                value={null}
                onChange={() => {}}
                options={[]}
                label="目標"
                labelSuffix="目標"
                commandId="x"
            />
        );
        expect(true).toBe(true);
    });
});
