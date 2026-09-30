import type { MapRenderOptions } from './types';

// Canvas描画オプションの適用処理
export function applyCanvasRenderOptions(ctx: CanvasRenderingContext2D, options: MapRenderOptions) {
    ctx.imageSmoothingEnabled = options.imageSmoothing;
}

// サブピクセルの隙間防止オーバーラップを考慮したタイル描画サイズの算出
export function calcTileRenderSize(tileSize: number, options: MapRenderOptions): number {
    return tileSize + options.overlapPx;
}

// Canvasの内部解像度をDPRに合わせ、CSSサイズと描画座標系(CSS px)を設定する
export function setupCanvasForDpr(canvas: HTMLCanvasElement, w: number, h: number): void {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
}
