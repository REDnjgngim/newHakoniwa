import type { CornerCursorConfig } from '../types';

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
