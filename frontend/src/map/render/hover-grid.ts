import { getVisibleLabelRange, tileToPixel } from '../geometry';
import type { HoverGridConfig, ViewState } from '../types';

// 表示倍率に応じたガイドラインの線幅（文字サイズと同じ指数カーブで伸ばし、上下限で頭打ちにする）
export function calcHoverLineWidth(scale: number, settings: HoverGridConfig): number {
    const cfg = settings;
    return Math.min(
        cfg.maxLineWidth,
        Math.max(cfg.minLineWidth, cfg.baseLineWidth * Math.pow(scale, cfg.lineWidthScaleExponent))
    );
}

// ホバー位置が変わってからの経過時間に応じたガイドラインの不透明度（durationMsかけて1→0へ減衰）
export function calcHoverFadeAlpha(startMs: number, nowMs: number, durationMs: number): number {
    if (durationMs <= 0) return 0;
    return Math.max(0, 1 - (nowMs - startMs) / durationMs);
}

// ホバー中のマスの行の上辺・下辺を、可視列の範囲（マップの左右端まで）に描画
// 行の上下端はその行のどのマスでも同じy（半マスずれは横方向のみ）なので、常に一直線の2本になる
export function drawHoverHorizontalLines(
    ctx: CanvasRenderingContext2D,
    hoverY: number,
    view: ViewState,
    colStart: number,
    colEnd: number,
    tileSize: number
): void {
    const { py } = tileToPixel(0, hoverY, view, tileSize);
    const halfTile = (tileSize * view.scale) / 2;
    // 可視列の左端・右端のマス辺（奇数行は半マス右へずれるため、行ごとの中心xから求める）
    const leftX = tileToPixel(colStart, hoverY, view, tileSize).px - halfTile;
    const rightX = tileToPixel(colEnd, hoverY, view, tileSize).px + halfTile;

    ctx.beginPath();
    ctx.moveTo(leftX, py - halfTile);
    ctx.lineTo(rightX, py - halfTile);
    ctx.moveTo(leftX, py + halfTile);
    ctx.lineTo(rightX, py + halfTile);
    ctx.stroke();
}

// ホバー中のマスの左辺・右辺（縦線2本）を描画
// 奇数行は半マス右へずれるため、行ごとに「タイル中心±半マス」へ縦線分を描き、
// 行の境界ではずれ幅（半マス）を横線でつないで階段状の連続した輪郭にする
export function drawHoverVerticalLines(
    ctx: CanvasRenderingContext2D,
    hoverX: number,
    view: ViewState,
    rowStart: number,
    rowEnd: number,
    tileSize: number
): void {
    const halfTile = (tileSize * view.scale) / 2;

    ctx.beginPath();
    for (let y = rowStart; y <= rowEnd; y++) {
        const { px, py } = tileToPixel(hoverX, y, view, tileSize);

        // 左辺・右辺（この行の高さいっぱい）
        ctx.moveTo(px - halfTile, py - halfTile);
        ctx.lineTo(px - halfTile, py + halfTile);
        ctx.moveTo(px + halfTile, py - halfTile);
        ctx.lineTo(px + halfTile, py + halfTile);

        // 次の行との境界（y = py + halfTile）に、半マスずれた分をつなぐ横線を引く
        if (y < rowEnd) {
            const next = tileToPixel(hoverX, y + 1, view, tileSize);
            const boundaryY = py + halfTile;
            ctx.moveTo(px - halfTile, boundaryY);
            ctx.lineTo(next.px - halfTile, boundaryY);
            ctx.moveTo(px + halfTile, boundaryY);
            ctx.lineTo(next.px + halfTile, boundaryY);
        }
    }
    ctx.stroke();
}

// ホバー中のマスの上下・左右の辺をガイドラインとして描画
// ホバーしていないとき・フェードアウトしきったとき（alpha <= 0）は何も描かない
export function drawHoverGuideLines(
    ctx: CanvasRenderingContext2D,
    hover: { x: number | null; y: number | null },
    view: ViewState,
    width: number,
    height: number,
    mapW: number,
    mapH: number,
    alpha: number,
    settings: HoverGridConfig,
    tileSize: number
): void {
    const hoverX = hover.x;
    const hoverY = hover.y;
    if (hoverX === null || hoverY === null || alpha <= 0) return;

    // 描画範囲は可視範囲に絞る（縦線は行、横線は列。マップ全体を舐めないようにする）
    const { colStart, colEnd, rowStart, rowEnd } = getVisibleLabelRange(view, width, height, mapW, mapH, tileSize);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = settings.lineColor;
    ctx.lineWidth = calcHoverLineWidth(view.scale, settings);
    drawHoverHorizontalLines(ctx, hoverY, view, colStart, colEnd, tileSize);
    drawHoverVerticalLines(ctx, hoverX, view, rowStart, rowEnd, tileSize);
    ctx.restore();
}
