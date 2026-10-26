import { CORNER_CURSOR_SETTINGS } from '../settings';
import { getPulseScale } from './corner-cursor';

describe('getPulseScale', () => {
    it('パルス区間外は baseScale を返す（実測値で固定）', () => {
        expect(getPulseScale(200, CORNER_CURSOR_SETTINGS)).toBe(1);
        expect(getPulseScale(300, CORNER_CURSOR_SETTINGS)).toBe(1);
        expect(getPulseScale(1999, CORNER_CURSOR_SETTINGS)).toBe(1);
        expect(getPulseScale(2000, CORNER_CURSOR_SETTINGS)).toBe(1);
        expect(getPulseScale(2200, CORNER_CURSOR_SETTINGS)).toBe(1);
        expect(getPulseScale(4000, CORNER_CURSOR_SETTINGS)).toBe(1);
    });

    it('パルス区間内は 0→1→0 の三角波で peakScale まで膨らむ（実測値で固定）', () => {
        expect(getPulseScale(0, CORNER_CURSOR_SETTINGS)).toBe(1);
        expect(getPulseScale(100, CORNER_CURSOR_SETTINGS)).toBe(1.1);
        expect(getPulseScale(200, CORNER_CURSOR_SETTINGS)).toBe(1);
    });

    it('intervalMs の周期で位相がリセットされる', () => {
        expect(getPulseScale(2000, CORNER_CURSOR_SETTINGS)).toBe(getPulseScale(0, CORNER_CURSOR_SETTINGS));
        expect(getPulseScale(2100, CORNER_CURSOR_SETTINGS)).toBe(getPulseScale(100, CORNER_CURSOR_SETTINGS));
    });
});
