import type { LabelRange, TileCoord, TileRange, ViewState } from './types';

// 値を最小値・最大値の範囲内へ収める
export function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

// 奇数行を右に半マスずらすoffset座標系でマップ座標→スクリーン座標へ変換
export function tileToPixel(x: number, y: number, view: ViewState, tileSize: number) {
    const { offsetX, offsetY, scale } = view;
    const rowOffset = y % 2 === 1 ? tileSize / 2 : 0;
    const mapPx = x * tileSize + rowOffset + tileSize * 0.5;
    const mapPy = y * tileSize + tileSize * 0.5;
    return { px: mapPx * scale - offsetX, py: mapPy * scale - offsetY };
}

// スクリーンピクセル座標からタイルグリッド座標(x, y)を逆算（範囲外ならnull）
export function pixelToTile(
    px: number,
    py: number,
    view: ViewState,
    mapW: number,
    mapH: number,
    tileSize: number
): TileCoord | null {
    const { offsetX, offsetY, scale } = view;
    const mapPx = (px + offsetX) / scale;
    const mapPy = (py + offsetY) / scale;

    const y = Math.floor(mapPy / tileSize);
    if (y < 0 || y >= mapH) return null;

    const rowOffset = y % 2 === 1 ? tileSize / 2 : 0;
    const x = Math.floor((mapPx - rowOffset) / tileSize);
    if (x < 0 || x >= mapW) return null;

    return { x, y };
}

// ビューポートカリング: 現在表示範囲に含まれるマス番号の範囲を算出
export function getVisibleRange(
    view: ViewState,
    width: number,
    height: number,
    mapW: number,
    mapH: number,
    options: { tileSize: number; marginTiles: number }
): TileRange {
    const { offsetX, offsetY, scale } = view;
    const { tileSize, marginTiles } = options;
    const scaledTileSize = tileSize * scale;
    return {
        colStart: Math.max(0, Math.floor(offsetX / scaledTileSize) - marginTiles),
        colEnd: Math.min(mapW - 1, Math.ceil((offsetX + width) / scaledTileSize) + marginTiles),
        rowStart: Math.max(0, Math.floor(offsetY / scaledTileSize) - marginTiles),
        rowEnd: Math.min(mapH - 1, Math.ceil((offsetY + height) / scaledTileSize) + marginTiles),
        tileSize: scaledTileSize,
    };
}

// 画面に映っている列(x)・行(y)の範囲を算出（描画用の余剰マスは付けない）
export function getVisibleLabelRange(
    view: ViewState,
    width: number,
    height: number,
    mapW: number,
    mapH: number,
    tileSize: number
): LabelRange {
    const { offsetX, offsetY, scale } = view;
    const scaledTileSize = tileSize * scale;
    return {
        colStart: Math.max(0, Math.floor(offsetX / scaledTileSize)),
        colEnd: Math.min(mapW - 1, Math.ceil((offsetX + width) / scaledTileSize)),
        rowStart: Math.max(0, Math.floor(offsetY / scaledTileSize)),
        rowEnd: Math.min(mapH - 1, Math.ceil((offsetY + height) / scaledTileSize)),
    };
}

// 2点間の距離
export function distance(p1: { x: number; y: number }, p2: { x: number; y: number }) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

// 指定した画面座標を中心に表示倍率を変更した表示状態を返す（倍率の制限は呼び出し側で行う）
export function zoomAroundPoint(view: ViewState, point: { x: number; y: number }, newScale: number): ViewState {
    const mapAtX = (point.x + view.offsetX) / view.scale;
    const mapAtY = (point.y + view.offsetY) / view.scale;
    return {
        offsetX: mapAtX * newScale - point.x,
        offsetY: mapAtY * newScale - point.y,
        scale: newScale,
    };
}

// パン後の offset をクランプして、マップが完全に画面外へ消えないようにする。
// 「12×12 グリッドの最外周タイルの中心が canvas 中央を跨いで外へ出ない」点が境界。
// 具体的には以下の4条件を満たすよう offset を制限する。
//   - 左端基準 (0, 0): タイル中心 px が canvasW / 2 を超えて右へ行き過ぎない
//   - 右端基準 (mapW - 1, 1): 奇数行オフセットが適用される行を基準とし、
//     タイル中心 px が canvasW / 2 より左へ行き過ぎない
//   - 上端基準 (y = 0): タイル中心 py が canvasH / 2 を超えない
//   - 下端基準 (y = mapH - 1): タイル中心 py が canvasH / 2 より上へ行き過ぎない
export function clampPanOffset(
    view: ViewState,
    canvasW: number,
    canvasH: number,
    mapW: number,
    mapH: number,
    tileSize: number
): ViewState {
    const { offsetX, offsetY, scale } = view;

    // offset = 0 基準での基準タイルの中心座標を求める（offsetX / offsetY は線形に引かれるだけなので、
    // タイル中心の map 座標に scale を掛けたものが基準になる）
    const zeroOffsetView: ViewState = { offsetX: 0, offsetY: 0, scale };
    const leftPx = tileToPixel(0, 0, zeroOffsetView, tileSize).px;
    const rightPx = tileToPixel(mapW - 1, 1, zeroOffsetView, tileSize).px;
    const topPy = tileToPixel(0, 0, zeroOffsetView, tileSize).py;
    const bottomPy = tileToPixel(0, mapH - 1, zeroOffsetView, tileSize).py;

    // tileToPixel は px = 基準座標 - offsetX の形なので、条件式から offset の上下限を解く
    const minOffsetX = leftPx - canvasW / 2;
    const maxOffsetX = rightPx - canvasW / 2;
    const minOffsetY = topPy - canvasH / 2;
    const maxOffsetY = bottomPy - canvasH / 2;

    return {
        offsetX: clamp(offsetX, minOffsetX, maxOffsetX),
        offsetY: clamp(offsetY, minOffsetY, maxOffsetY),
        scale,
    };
}
