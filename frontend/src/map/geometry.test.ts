import { distance, getVisibleLabelRange, getVisibleRange, pixelToTile, tileToPixel, zoomAroundPoint } from './geometry';
import type { ViewState } from './types';

// 実測に使用した条件（12x12マップ・tileSize=32・canvas 800x600 を想定）
const MAP_WIDTH = 12;
const MAP_HEIGHT = 12;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const MARGIN_TILES = 2;
const TILE_SIZE = 32;

// マップ中央をcanvas中央に置いた初期表示相当のview
const initialView: ViewState = { offsetX: -192, offsetY: -92, scale: 1 };
const zoomInView: ViewState = { offsetX: -37.5, offsetY: 210.25, scale: 3 };
const zoomOutView: ViewState = { offsetX: 12.5, offsetY: -8.25, scale: 0.5 };

const views: Record<string, ViewState> = {
    初期表示: initialView,
    拡大: zoomInView,
    縮小: zoomOutView,
};

describe('tileToPixel', () => {
    it('偶数行・奇数行・マップ端のマス中心座標を返す（実測値で固定）', () => {
        expect(tileToPixel(3, 5, initialView, TILE_SIZE)).toEqual({ px: 320, py: 268 });
        expect(tileToPixel(0, 0, initialView, TILE_SIZE)).toEqual({ px: 208, py: 108 });
        expect(tileToPixel(11, 11, initialView, TILE_SIZE)).toEqual({ px: 576, py: 460 });
        expect(tileToPixel(1, 3, initialView, TILE_SIZE)).toEqual({ px: 256, py: 204 });
        expect(tileToPixel(2, 2, initialView, TILE_SIZE)).toEqual({ px: 272, py: 172 });
    });

    it('倍率とオフセットに応じた座標を返す（実測値で固定）', () => {
        expect(tileToPixel(3, 5, zoomInView, TILE_SIZE)).toEqual({ px: 421.5, py: 317.75 });
        expect(tileToPixel(0, 0, zoomInView, TILE_SIZE)).toEqual({ px: 85.5, py: -162.25 });
        expect(tileToPixel(11, 11, zoomInView, TILE_SIZE)).toEqual({ px: 1189.5, py: 893.75 });
        expect(tileToPixel(1, 3, zoomInView, TILE_SIZE)).toEqual({ px: 229.5, py: 125.75 });
        expect(tileToPixel(2, 2, zoomInView, TILE_SIZE)).toEqual({ px: 277.5, py: 29.75 });
        expect(tileToPixel(3, 5, zoomOutView, TILE_SIZE)).toEqual({ px: 51.5, py: 96.25 });
        expect(tileToPixel(0, 0, zoomOutView, TILE_SIZE)).toEqual({ px: -4.5, py: 16.25 });
        expect(tileToPixel(11, 11, zoomOutView, TILE_SIZE)).toEqual({ px: 179.5, py: 192.25 });
        expect(tileToPixel(1, 3, zoomOutView, TILE_SIZE)).toEqual({ px: 19.5, py: 64.25 });
        expect(tileToPixel(2, 2, zoomOutView, TILE_SIZE)).toEqual({ px: 27.5, py: 48.25 });
    });
});

describe('tileToPixel → pixelToTile の往復', () => {
    const coords: Array<[number, number]> = [
        [0, 0],
        [2, 0],
        [1, 3],
        [3, 5],
        [10, 10],
        [11, 11],
        [11, 0],
        [0, 11],
    ];

    for (const [viewName, view] of Object.entries(views)) {
        for (const [x, y] of coords) {
            it(`${viewName}: マス中心 (x=${x}, y=${y}) は同じマスへ戻る`, () => {
                const { px, py } = tileToPixel(x, y, view, TILE_SIZE);

                expect(pixelToTile(px, py, view, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE)).toEqual({ x, y });
            });
        }
    }
});
describe('pixelToTile', () => {
    it('マップ範囲外は null を返す', () => {
        expect(pixelToTile(-1, 100, initialView, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE)).toBeNull();
        expect(pixelToTile(100, -1, initialView, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE)).toBeNull();
        expect(pixelToTile(100000, 100000, initialView, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE)).toBeNull();
        expect(pixelToTile(100, 1000, initialView, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE)).toBeNull();
    });
});

describe('getVisibleRange', () => {
    it('可視範囲に marginTiles 分の余剰を加えた範囲を返す（実測値で固定）', () => {
        expect(
            getVisibleRange(initialView, CANVAS_WIDTH, CANVAS_HEIGHT, MAP_WIDTH, MAP_HEIGHT, {
                tileSize: TILE_SIZE,
                marginTiles: MARGIN_TILES,
            })
        ).toEqual({
            colStart: 0,
            colEnd: 11,
            rowStart: 0,
            rowEnd: 11,
            tileSize: 32,
        });
        expect(
            getVisibleRange(zoomInView, CANVAS_WIDTH, CANVAS_HEIGHT, MAP_WIDTH, MAP_HEIGHT, {
                tileSize: TILE_SIZE,
                marginTiles: MARGIN_TILES,
            })
        ).toEqual({
            colStart: 0,
            colEnd: 10,
            rowStart: 0,
            rowEnd: 11,
            tileSize: 96,
        });
        expect(
            getVisibleRange(zoomOutView, CANVAS_WIDTH, CANVAS_HEIGHT, MAP_WIDTH, MAP_HEIGHT, {
                tileSize: TILE_SIZE,
                marginTiles: MARGIN_TILES,
            })
        ).toEqual({
            colStart: 0,
            colEnd: 11,
            rowStart: 0,
            rowEnd: 11,
            tileSize: 16,
        });
    });

    it('余剰はマップ端でクランプされる', () => {
        const range = getVisibleRange(zoomInView, CANVAS_WIDTH, CANVAS_HEIGHT, MAP_WIDTH, MAP_HEIGHT, {
            tileSize: TILE_SIZE,
            marginTiles: MARGIN_TILES,
        });
        const labelRange = getVisibleLabelRange(
            zoomInView,
            CANVAS_WIDTH,
            CANVAS_HEIGHT,
            MAP_WIDTH,
            MAP_HEIGHT,
            TILE_SIZE
        );

        expect(range.colEnd).toBe(labelRange.colEnd + MARGIN_TILES);
        expect(range.rowStart).toBe(labelRange.rowStart - MARGIN_TILES);
    });
});

describe('getVisibleLabelRange', () => {
    it('余剰マスを付けない可視範囲を返す（実測値で固定）', () => {
        expect(
            getVisibleLabelRange(initialView, CANVAS_WIDTH, CANVAS_HEIGHT, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE)
        ).toEqual({
            colStart: 0,
            colEnd: 11,
            rowStart: 0,
            rowEnd: 11,
        });
        expect(getVisibleLabelRange(zoomInView, CANVAS_WIDTH, CANVAS_HEIGHT, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE)).toEqual(
            {
                colStart: 0,
                colEnd: 8,
                rowStart: 2,
                rowEnd: 9,
            }
        );
        expect(
            getVisibleLabelRange(zoomOutView, CANVAS_WIDTH, CANVAS_HEIGHT, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE)
        ).toEqual({
            colStart: 0,
            colEnd: 11,
            rowStart: 0,
            rowEnd: 11,
        });
    });
});
describe('zoomAroundPoint', () => {
    it('指定した画面座標を中心に倍率を変更した表示状態を返す（実測値で固定）', () => {
        expect(zoomAroundPoint(initialView, { x: 400, y: 300 }, 0.5)).toEqual({
            offsetX: -296,
            offsetY: -196,
            scale: 0.5,
        });
        expect(zoomAroundPoint(initialView, { x: 0, y: 0 }, 0.5)).toEqual({ offsetX: -96, offsetY: -46, scale: 0.5 });
        expect(zoomAroundPoint(initialView, { x: 799, y: 599 }, 0.5)).toEqual({
            offsetX: -495.5,
            offsetY: -345.5,
            scale: 0.5,
        });
        expect(zoomAroundPoint(initialView, { x: 100, y: 50 }, 0.5)).toEqual({
            offsetX: -146,
            offsetY: -71,
            scale: 0.5,
        });

        expect(zoomAroundPoint(initialView, { x: 400, y: 300 }, 1)).toEqual({ offsetX: -192, offsetY: -92, scale: 1 });
        expect(zoomAroundPoint(initialView, { x: 0, y: 0 }, 1)).toEqual({ offsetX: -192, offsetY: -92, scale: 1 });

        expect(zoomAroundPoint(initialView, { x: 400, y: 300 }, 3)).toEqual({ offsetX: 224, offsetY: 324, scale: 3 });
        expect(zoomAroundPoint(initialView, { x: 0, y: 0 }, 3)).toEqual({ offsetX: -576, offsetY: -276, scale: 3 });
        expect(zoomAroundPoint(initialView, { x: 799, y: 599 }, 3)).toEqual({ offsetX: 1022, offsetY: 922, scale: 3 });
        expect(zoomAroundPoint(initialView, { x: 100, y: 50 }, 3)).toEqual({ offsetX: -376, offsetY: -176, scale: 3 });
    });

    it('指定点のマップ座標がズーム前後で変わらない', () => {
        const points = [
            { x: 400, y: 300 },
            { x: 0, y: 0 },
            { x: 799, y: 599 },
            { x: 100, y: 50 },
        ];

        for (const scale of [0.5, 1, 3]) {
            for (const point of points) {
                const zoomed = zoomAroundPoint(initialView, point, scale);
                const before = {
                    x: (point.x + initialView.offsetX) / initialView.scale,
                    y: (point.y + initialView.offsetY) / initialView.scale,
                };
                const after = {
                    x: (point.x + zoomed.offsetX) / zoomed.scale,
                    y: (point.y + zoomed.offsetY) / zoomed.scale,
                };

                expect(after).toEqual(before);
            }
        }
    });
});

describe('distance', () => {
    it('2点間の距離を返す', () => {
        expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    });
});
