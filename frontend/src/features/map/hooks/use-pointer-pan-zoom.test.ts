import { clampPanOffset } from '../geometry';

describe('clampPanOffset', () => {
    it('存在する', () => {
        expect(typeof clampPanOffset).toBe('function');
    });
});
