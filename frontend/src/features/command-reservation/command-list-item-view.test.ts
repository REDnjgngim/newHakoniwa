import { describe, it, expect } from 'vitest';
import type { ReservationCommand } from './types';
import {
    isFastCommand,
    resolveDetailLine,
    resolveTargetIslandLine,
    isThreeLines,
    formatOrder,
} from './command-list-item-view';

const cmd: ReservationCommand = {
    id: '1',
    name: 'X',
    commandType: 'fast',
    summaryText: '  hello  ',
    targetIsland: '島A',
    estimatedTurn: 0,
    estimatedFundsDelta: 0,
};

describe('command-list-item-view', () => {
    it('fast', () => expect(isFastCommand(cmd)).toBe(true));
    it('detail line', () => expect(resolveDetailLine(cmd)).toBe('  hello  '));
    it('detail line empty→null', () => expect(resolveDetailLine({ ...cmd, summaryText: '  ' })).toBeNull());
    it('detail line undefined→null', () => expect(resolveDetailLine({ ...cmd, summaryText: undefined })).toBeNull());
    it('target island line', () => expect(resolveTargetIslandLine(cmd)).toBe('島A'));
    it('target island empty→null', () => expect(resolveTargetIslandLine({ ...cmd, targetIsland: ' ' })).toBeNull());
    it('isThreeLines', () => expect(isThreeLines(cmd)).toBe(true));
    it('formatOrder', () => expect(formatOrder(5)).toBe('05'));
});
