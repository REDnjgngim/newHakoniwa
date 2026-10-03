import type { CornerCursorConfig } from '../types';

// 選択タイルの4隅にL字ブラケットを描く。scaleでサイズを拡縮する（中心基準）
export function drawCornerCursor(
    ctx: CanvasRenderingContext2D,
    drawX: number,
    drawY: number,
    size: number,
    scale: number,
    settings: CornerCursorConfig
): void {
    const cfg = settings;
    const bracketLen = size * cfg.bracketLenRatio;

    // scale分だけ中心から拡縮させる
    const cx = drawX + size / 2;
    const cy = drawY + size / 2;
    const half = (size * scale) / 2;
    const x0 = cx - half;
    const y0 = cy - half;
    const x1 = cx + half;
    const y1 = cy + half;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 4隅のブラケットを1本のパスとして組み立て、縁取りと本体で使い回す
    ctx.beginPath();
    // 左上
    ctx.moveTo(x0, y0 + bracketLen);
    ctx.lineTo(x0, y0);
    ctx.lineTo(x0 + bracketLen, y0);
    // 右上
    ctx.moveTo(x1 - bracketLen, y0);
    ctx.lineTo(x1, y0);
    ctx.lineTo(x1, y0 + bracketLen);
    // 右下
    ctx.moveTo(x1, y1 - bracketLen);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x1 - bracketLen, y1);
    // 左下
    ctx.moveTo(x0 + bracketLen, y1);
    ctx.lineTo(x0, y1);
    ctx.lineTo(x0, y1 - bracketLen);

    // 太めの水色を下地に描き、その上へ本体色を重ねて細い縁取りを出す
    ctx.lineWidth = cfg.outlineWidth;
    ctx.strokeStyle = cfg.outlineColor;
    ctx.stroke();

    ctx.lineWidth = cfg.lineWidth;
    ctx.strokeStyle = cfg.color;
    ctx.stroke();

    ctx.restore();
}

// 経過時間からパルスのスケール係数を算出。パルス区間外は常にbaseScaleを返す
export function getPulseScale(elapsedMs: number, cfg: CornerCursorConfig): number {
    const phase = elapsedMs % cfg.intervalMs;
    if (phase >= cfg.pulseDurationMs) return cfg.baseScale;

    // 0→1→0の三角波にeaseをかけて、膨らんで戻る動きにする
    const t = phase / cfg.pulseDurationMs;
    const triangle = t < 0.5 ? t * 2 : (1 - t) * 2; // 0→1→0
    const eased = Math.sin((triangle * Math.PI) / 2); // 滑らかさ付与
    return cfg.baseScale + (cfg.peakScale - cfg.baseScale) * eased;
}
