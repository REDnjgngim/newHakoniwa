import { HOVER_GRID_SETTINGS } from '../settings';

// 表示倍率に応じたガイドラインの線幅（文字サイズと同じ指数カーブで伸ばし、上下限で頭打ちにする）
export function calcHoverLineWidth(scale: number): number {
    const cfg = HOVER_GRID_SETTINGS;
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
