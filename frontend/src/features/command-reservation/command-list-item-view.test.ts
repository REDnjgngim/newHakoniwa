import { describe, it, expect } from 'vitest';
import type { ReservationCommand } from './types';
import {
    isFastCommand,
    resolveDetailLine,
    resolveTargetIslandLine,
    resolveStackCount,
    isThreeLines,
    formatOrder,
} from './command-list-item-view';

const cmd: ReservationCommand = {
    id: '1',
    commandCode: 'MISSILE_NORMAL',
    name: 'X',
    commandType: 'fast',
    summaryText: '  hello  ',
    params: {
        targetIsland: '島A',
        stackCount: 3,
    },
    estimatedTurn: 0,
    estimatedFundsDelta: 0,
};

describe('command-list-item-view', () => {
    it('fast', () => expect(isFastCommand(cmd)).toBe(true));
    it('detail line', () => expect(resolveDetailLine(cmd)).toBe('  hello  '));
    it('detail line empty→null', () => expect(resolveDetailLine({ ...cmd, summaryText: '  ' })).toBeNull());
    it('detail line undefined→null', () => expect(resolveDetailLine({ ...cmd, summaryText: undefined })).toBeNull());
    it('target island line', () => expect(resolveTargetIslandLine(cmd)).toBe('島A'));
    it('target island empty→null', () =>
        expect(resolveTargetIslandLine({ ...cmd, params: { targetIsland: ' ' } })).toBeNull());
    it('stack count', () => expect(resolveStackCount(cmd)).toBe(3));
    it('isThreeLines', () => expect(isThreeLines(cmd)).toBe(true));
    it('formatOrder', () => expect(formatOrder(5)).toBe('05'));
});
