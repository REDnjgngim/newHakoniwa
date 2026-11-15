import { COMMAND_REGISTRY } from '@/features/command-reservation';
import { clampQuantity, filterCommandsByMode, QUANTITY_MAX, QUANTITY_MIN } from './command-input-logic';

describe('command-input-logic', () => {
    describe('clampQuantity', () => {
        it('範囲外の値・小数・NaNを仕様どおり丸める', () => {
            expect(clampQuantity(0)).toBe(QUANTITY_MIN);
            expect(clampQuantity(-5)).toBe(QUANTITY_MIN);
            expect(clampQuantity(100)).toBe(QUANTITY_MAX);
            expect(clampQuantity(2.9)).toBe(2);
            expect(clampQuantity(Number.NaN)).toBe(QUANTITY_MIN);
        });
    });

    describe('filterCommandsByMode', () => {
        it('classic モードは座標ありコマンドのみ、manage モードは座標なしコマンドのみを返す', () => {
            const classic = filterCommandsByMode(COMMAND_REGISTRY, 'classic');
            const manage = filterCommandsByMode(COMMAND_REGISTRY, 'manage');

            expect(classic.length).toBeGreaterThan(0);
            expect(manage.length).toBeGreaterThan(0);
            expect(classic.every((c) => c.hasCoordinate)).toBe(true);
            expect(manage.every((c) => !c.hasCoordinate)).toBe(true);
        });
    });
});
