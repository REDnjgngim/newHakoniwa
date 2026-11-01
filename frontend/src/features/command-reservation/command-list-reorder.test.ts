import { describe, it, expect } from 'vitest';
import type { ReservationCommand } from './types';
import { mapReorderIndicesToIds } from './command-list-reorder';

const cmds: ReservationCommand[] = [
    { id: 'a', name: 'A', commandType: 'normal', estimatedTurn: 0, estimatedFundsDelta: 0 },
    { id: 'b', name: 'B', commandType: 'normal', estimatedTurn: 0, estimatedFundsDelta: 0 },
    { id: 'c', name: 'C', commandType: 'normal', estimatedTurn: 0, estimatedFundsDelta: 0 },
];

describe('command-list-reorder', () => {
    it('正常系', () => {
        expect(mapReorderIndicesToIds(cmds, 0, 1)).toEqual({ fromId: 'a', toId: 'c' });
    });
    it('toIndex が末尾を超える場合は null', () => {
        expect(mapReorderIndicesToIds(cmds, 0, 10)).toEqual({ fromId: 'a', toId: null });
    });
    it('不正 index は null', () => {
        expect(mapReorderIndicesToIds(cmds, 0, 0)).toBeNull();
        expect(mapReorderIndicesToIds(cmds, 5, 1)).toBeNull();
    });
});
