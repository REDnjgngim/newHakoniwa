import { applyCanvasRenderOptions, calcTileRenderSize } from './canvas';
import { MAP_VIEW_SETTINGS } from './settings';

describe('calcTileRenderSize', () => {
    it('タイルサイズに overlapPx を加えた描画サイズを返す（実測値で固定）', () => {
        expect(calcTileRenderSize(32, MAP_VIEW_SETTINGS.renderOptions)).toBe(32.5);
        expect(calcTileRenderSize(24, { imageSmoothing: false, overlapPx: 0 })).toBe(24);
        expect(calcTileRenderSize(16, { imageSmoothing: true, overlapPx: 0.5 })).toBe(16.5);
    });
});

describe('applyCanvasRenderOptions', () => {
    it('imageSmoothing の設定をコンテキストへ反映する', () => {
        const ctx = document.createElement('canvas').getContext('2d');
        if (!ctx) throw new Error('Canvas 2D コンテキストのスタブが設定されていない');

        applyCanvasRenderOptions(ctx, { imageSmoothing: false, overlapPx: 0 });
        expect(ctx.imageSmoothingEnabled).toBe(false);

        applyCanvasRenderOptions(ctx, { imageSmoothing: true, overlapPx: 0 });
        expect(ctx.imageSmoothingEnabled).toBe(true);
    });
});
