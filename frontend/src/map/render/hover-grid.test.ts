import { calcHoverFadeAlpha, calcHoverLineWidth } from './hover-grid';

describe('calcHoverLineWidth', () => {
    it('表示倍率に応じた線幅を返す（実測値で固定）', () => {
        expect(calcHoverLineWidth(0.25)).toBe(0.5);
        expect(calcHoverLineWidth(0.5)).toBe(0.5743491774985174);
        expect(calcHoverLineWidth(1)).toBe(1);
        expect(calcHoverLineWidth(2)).toBe(1.7411011265922482);
        expect(calcHoverLineWidth(10)).toBe(2);
    });

    it('上下限（0.5 / 2）でクランプされる', () => {
        expect(calcHoverLineWidth(0.25)).toBe(0.5);
        expect(calcHoverLineWidth(10)).toBe(2);
    });
});

describe('calcHoverFadeAlpha', () => {
    it('経過時間に応じて 1 から 0 へ減衰する（実測値で固定）', () => {
        expect(calcHoverFadeAlpha(1000, 1000, 1000)).toBe(1);
        expect(calcHoverFadeAlpha(1000, 1500, 1000)).toBe(0.5);
        expect(calcHoverFadeAlpha(1000, 1999, 1000)).toBe(0.0010000000000000009);
        expect(calcHoverFadeAlpha(1000, 2000, 1000)).toBe(0);
        expect(calcHoverFadeAlpha(1000, 2001, 1000)).toBe(0);
    });

    it('durationMs が 0 のときは 0 を返す', () => {
        expect(calcHoverFadeAlpha(1000, 1200, 0)).toBe(0);
    });
});
