import type { BoundaryLineConfig, ViewState } from '../types';
import { tileToPixel } from '../geometry';

// ============================================================================
// 12×12 グリッドの外枠を囲む境界ラインを描画する。
// Canvas 2D の shadowBlur でうっすら光って見えるグロー効果を付ける。
// ============================================================================

export function drawBoundaryLine(
    ctx: CanvasRenderingContext2D,
    view: ViewState,
    mapW: number,
    mapH: number,
    tileSize: number,
    config: BoundaryLineConfig
): void {
    const scaledTileSize = tileSize * view.scale;

    // 左上角: タイル (0, 0) の中心から半マス分左上へ
    const topLeft = tileToPixel(0, 0, view, tileSize);
    // 右下角: タイル (mapW - 1, mapH - 1) の中心から半マス分右下へ
    // （mapH - 1 が奇数行の場合は右端が半マス右にずれるため、右辺はその分だけ広がる）
    const bottomRight = tileToPixel(mapW - 1, mapH - 1, view, tileSize);

    const x = topLeft.px - scaledTileSize / 2;
    const y = topLeft.py - scaledTileSize / 2;
    const w = bottomRight.px + scaledTileSize / 2 - x;
    const h = bottomRight.py + scaledTileSize / 2 - y;

    ctx.save();
    ctx.strokeStyle = config.color;
    ctx.lineWidth = config.lineWidth;
    ctx.shadowBlur = config.glowBlur;
    ctx.shadowColor = config.glowColor;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
}
