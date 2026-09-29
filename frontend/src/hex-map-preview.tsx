import { useEffect, useRef, useCallback, type RefObject, type PointerEvent } from 'react';
import type { SectorTerrainData } from './types/terrain';
import { TERRAIN_IMAGE_MAP } from './constants/terrain';
import terrainDataJson from './mocks/sector_terrain.json';
import { useHoverTracking, type HoverState } from './hooks/use-hover-tracking';

// マップ表示・描画設定の型定義
interface MapRenderOptions {
    /** 画像のスムージング（falseでドット絵をくっきり表示） */
    imageSmoothing: boolean;
    /** サブピクセル描画によるタイルの隙間を防ぐ微小オーバーラップ（px） */
    overlapPx: number;
}

interface MapConfig {
    tileSize: number;
    initialScale: number;
    minScale: number;
    maxScale: number;
    wheelZoomFactor: number;
    marginTiles: number;
    maxViewportWidth: number;
    maxViewportHeight: number;
    colors: {
        fallbackBg: string;
        fallbackBorder: string;
    };
    renderOptions: MapRenderOptions;
}

// マップ表示の基本設定値
const MAP_CONFIG: MapConfig = {
    tileSize: 32, // 地形画像サイズ(px)
    initialScale: 1.0, // 初期表示倍率
    minScale: 0.5, // 最小表示倍率
    maxScale: 10, // 最大表示倍率
    wheelZoomFactor: 1.15, // マウスホイールでのズーム倍率
    marginTiles: 2, // 表示領域端から読み込むマスの余剰数
    maxViewportWidth: 3940, // 最大ビューポート幅
    maxViewportHeight: 2160, // 最大ビューポート高さ
    colors: {
        fallbackBg: '#18324f', // 背景色
        fallbackBorder: '#2e5b88', // ボーダー色
    },
    renderOptions: {
        imageSmoothing: false, // 画像の平滑化（falseでドット絵をくっきり表示）
        overlapPx: 0.5, // タイルの隙間を防ぐ微小オーバーラップ（px）
    },
};

// 座標ラベルの描画設定
interface OverlayLabelConfig {
    fontFamily: string;
    baseFontSize: number;
    minFontSize: number;
    maxFontSize: number;
    fontScaleExponent: number;
    color: string;
    highlightColor: string;
    haloColor: string;
    haloWidth: number;
    shadowColor: string;
    shadowOffsetRatio: number;
    glyphScaleY: number;
    edgeInsetPx: number;
}

const OVERLAY_LABEL_CONFIG: OverlayLabelConfig = {
    fontFamily: 'monospace',
    baseFontSize: 12, // scale=1.0時の基準サイズ
    minFontSize: 6,
    maxFontSize: 36, // 基準サイズの3倍。達したら以降は一定
    fontScaleExponent: 0.8, // scaleに対する伸び。1.0で比例、小さいほど緩やかに拡大する
    color: '#ffd27a',
    highlightColor: '#ffffff', // 選択中（クリックで確定）の列・行番号。通常色より明るくして強調する
    haloColor: 'rgba(14, 26, 43, 0.9)', // 縁取り。地形画像の上でも読めるようにする
    haloWidth: 2, // 縁取りの太さ(px)
    shadowColor: '#a0520a', // 影の色。文字色(#ffd27a)より暗いオレンジ
    shadowOffsetRatio: 0.07, // 影を右下へずらす量。文字サイズに対する比率（最大36pxで約2px）
    glyphScaleY: 0.8, // 文字の縦を縮める倍率。モノスペース文字は縦長なので正方形に近づける
    edgeInsetPx: 4, // マップ端からのマージン（マップ端が画面外に出たときは画面端からのマージン）
};

// ホバー中のマスを示すガイドラインの描画設定
interface HoverGridConfig {
    lineColor: string;
    baseLineWidth: number;
    minLineWidth: number;
    maxLineWidth: number;
    lineWidthScaleExponent: number;
    fadeDurationMs: number;
}

const HOVER_GRID_CONFIG: HoverGridConfig = {
    lineColor: 'rgba(255, 255, 255, 0.5)', // ガイドラインは白。地形画像を隠さないよう少し透過させる
    baseLineWidth: 1, // scale=1.0時の線幅(px)
    minLineWidth: 0.5,
    maxLineWidth: 2, // 基準の2倍。達したら以降は一定
    lineWidthScaleExponent: 0.8, // 拡大に対する伸び。座標ラベルの文字サイズと同じカーブにする
    fadeDurationMs: 1000, // ホバー位置が変わってからラインが消えるまでの時間(ms)
};

// 選択中タイルを示す角ブラケットカーソルの描画設定
interface CornerCursorConfig {
    intervalMs: number;
    pulseDurationMs: number;
    bracketLenRatio: number;
    lineWidth: number;
    outlineWidth: number; // 縁取りを含めた外側の線幅(px)
    color: string;
    outlineColor: string;
    baseScale: number;
    peakScale: number;
}

const CORNER_CURSOR_CONFIG: CornerCursorConfig = {
    intervalMs: 2000, // パルスの周期(ms)
    pulseDurationMs: 200, // 1回のパルスにかける時間(ms)
    bracketLenRatio: 0.15, // タイル1辺に対するブラケットの長さの割合
    lineWidth: 2, // 線の太さ(px)
    outlineWidth: 4, // 縁取り込みの外側線幅(px)。(5-3)/2 = 各辺1pxが水色の縁取りになる
    color: '#00a48d', // ブラケット本体の色（エメラルドグリーン）
    outlineColor: '#7fe9ff', // 縁取りの色（水色）
    baseScale: 1.0, // 通常時のサイズ倍率
    peakScale: 1.1, // パルス時のピークサイズ倍率
};

// 表示倍率に応じたガイドラインの線幅（文字サイズと同じ指数カーブで伸ばし、上下限で頭打ちにする）
function calcHoverLineWidth(scale: number): number {
    const cfg = HOVER_GRID_CONFIG;
    return Math.min(
        cfg.maxLineWidth,
        Math.max(cfg.minLineWidth, cfg.baseLineWidth * Math.pow(scale, cfg.lineWidthScaleExponent))
    );
}

// ホバー位置が変わってからの経過時間に応じたガイドラインの不透明度（durationMsかけて1→0へ減衰）
function calcHoverFadeAlpha(startMs: number, nowMs: number, durationMs: number): number {
    if (durationMs <= 0) return 0;
    return Math.max(0, 1 - (nowMs - startMs) / durationMs);
}

// Canvas描画オプションの適用処理
function applyCanvasRenderOptions(ctx: CanvasRenderingContext2D, options: MapRenderOptions) {
    ctx.imageSmoothingEnabled = options.imageSmoothing;
}

// サブピクセルの隙間防止オーバーラップを考慮したタイル描画サイズの算出
function calcTileRenderSize(tileSize: number, options: MapRenderOptions): number {
    return tileSize + options.overlapPx;
}

// Canvasの内部解像度をDPRに合わせ、CSSサイズと描画座標系(CSS px)を設定する
function setupCanvasForDpr(canvas: HTMLCanvasElement, w: number, h: number): void {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// JSON型をSectorTerrainDataとして扱う
const sectorData = terrainDataJson as SectorTerrainData;

interface ViewState {
    offsetX: number;
    offsetY: number;
    scale: number;
}

interface TileRange {
    colStart: number;
    colEnd: number;
    rowStart: number;
    rowEnd: number;
    tileSize: number;
}

// ラベル描画用の表示範囲（描画用の余剰マスは含めない）
interface LabelRange {
    colStart: number;
    colEnd: number;
    rowStart: number;
    rowEnd: number;
}

export default function HexMapPreview() {
    return (
        <div className="w-full h-screen bg-[#0e1a2b] flex flex-col items-center p-3 box-border font-sans overflow-hidden">
            <CanvasMap />
        </div>
    );
}

// 奇数行を右に半マスずらすoffset座標系でマップ座標→スクリーン座標へ変換
function tileToPixel(x: number, y: number, view: ViewState) {
    const { offsetX, offsetY, scale } = view;
    const rowOffset = y % 2 === 1 ? MAP_CONFIG.tileSize / 2 : 0;
    const mapPx = x * MAP_CONFIG.tileSize + rowOffset + MAP_CONFIG.tileSize * 0.5;
    const mapPy = y * MAP_CONFIG.tileSize + MAP_CONFIG.tileSize * 0.5;
    return { px: mapPx * scale - offsetX, py: mapPy * scale - offsetY };
}

// スクリーンピクセル座標からタイルグリッド座標(x, y)を逆算（範囲外ならnull）
function pixelToTile(
    px: number,
    py: number,
    view: ViewState,
    mapW: number,
    mapH: number
): { x: number; y: number } | null {
    const { offsetX, offsetY, scale } = view;
    const mapPx = (px + offsetX) / scale;
    const mapPy = (py + offsetY) / scale;

    const y = Math.floor(mapPy / MAP_CONFIG.tileSize);
    if (y < 0 || y >= mapH) return null;

    const rowOffset = y % 2 === 1 ? MAP_CONFIG.tileSize / 2 : 0;
    const x = Math.floor((mapPx - rowOffset) / MAP_CONFIG.tileSize);
    if (x < 0 || x >= mapW) return null;

    return { x, y };
}

// 経過時間からパルスのスケール係数を算出。パルス区間外は常にbaseScaleを返す
function getPulseScale(elapsedMs: number, cfg: CornerCursorConfig): number {
    const phase = elapsedMs % cfg.intervalMs;
    if (phase >= cfg.pulseDurationMs) return cfg.baseScale;

    // 0→1→0の三角波にeaseをかけて、膨らんで戻る動きにする
    const t = phase / cfg.pulseDurationMs;
    const triangle = t < 0.5 ? t * 2 : (1 - t) * 2; // 0→1→0
    const eased = Math.sin((triangle * Math.PI) / 2); // 滑らかさ付与
    return cfg.baseScale + (cfg.peakScale - cfg.baseScale) * eased;
}

// 選択タイルの4隅にL字ブラケットを描く。scaleでサイズを拡縮する（中心基準）
function drawCornerCursor(
    ctx: CanvasRenderingContext2D,
    drawX: number,
    drawY: number,
    size: number,
    scale: number
): void {
    const cfg = CORNER_CURSOR_CONFIG;
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

// ビューポートカリング: 現在表示範囲に含まれるマス番号の範囲を算出
function getVisibleRange(view: ViewState, width: number, height: number, mapW: number, mapH: number): TileRange {
    const { offsetX, offsetY, scale } = view;
    const tileSize = MAP_CONFIG.tileSize * scale;
    return {
        colStart: Math.max(0, Math.floor(offsetX / tileSize) - MAP_CONFIG.marginTiles),
        colEnd: Math.min(mapW - 1, Math.ceil((offsetX + width) / tileSize) + MAP_CONFIG.marginTiles),
        rowStart: Math.max(0, Math.floor(offsetY / tileSize) - MAP_CONFIG.marginTiles),
        rowEnd: Math.min(mapH - 1, Math.ceil((offsetY + height) / tileSize) + MAP_CONFIG.marginTiles),
        tileSize,
    };
}

// 画面に映っている列(x)・行(y)の範囲を算出（描画用の余剰マスは付けない）
function getVisibleLabelRange(view: ViewState, width: number, height: number, mapW: number, mapH: number): LabelRange {
    const { offsetX, offsetY, scale } = view;
    const tileSize = MAP_CONFIG.tileSize * scale;
    return {
        colStart: Math.max(0, Math.floor(offsetX / tileSize)),
        colEnd: Math.min(mapW - 1, Math.ceil((offsetX + width) / tileSize)),
        rowStart: Math.max(0, Math.floor(offsetY / tileSize)),
        rowEnd: Math.min(mapH - 1, Math.ceil((offsetY + height) / tileSize)),
    };
}

// 影→縁取り→本体の順に重ねて文字を描く（影は同じ字形を右下へずらして暗い色で描く）
function drawLabelText(
    ctx: CanvasRenderingContext2D,
    label: string,
    x: number,
    y: number,
    shadowOffset: number,
    cfg: OverlayLabelConfig
): void {
    // 影：ずらし量が潰しの影響を受けないよう画面座標側で移動する
    ctx.save();
    ctx.translate(x + shadowOffset, y + shadowOffset);
    ctx.scale(1, cfg.glyphScaleY);
    ctx.fillStyle = cfg.shadowColor;
    ctx.fillText(label, 0, 0);
    ctx.restore();

    // 本体：アンカー位置で文字の高さのみ縮めて縁取りと本体を重ねる
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, cfg.glyphScaleY);
    ctx.strokeText(label, 0, 0); // 縁取り
    ctx.fillText(label, 0, 0); // 本体
    ctx.restore();
}

// マップの上端・左端に座標ラベルを描画（マップ端が画面外に出た軸は画面端に留める）
// selectedTile に指定された列・行のラベルは強調色で描画する（ホバーでは変えない）
function drawCoordLabels(
    ctx: CanvasRenderingContext2D,
    view: ViewState,
    width: number,
    height: number,
    mapW: number,
    mapH: number,
    selectedTile: { x: number; y: number } | null
): void {
    const cfg = OVERLAY_LABEL_CONFIG;
    // 拡大に対しては指数カーブで緩やかに伸ばし、上下限で頭打ちにする
    const fontSize = Math.min(
        cfg.maxFontSize,
        Math.max(cfg.minFontSize, cfg.baseFontSize * Math.pow(view.scale, cfg.fontScaleExponent))
    );
    // 影のずらし量は文字サイズに比例させ、縮小時に影だけ離れて見えないようにする
    const shadowOffset = fontSize * cfg.shadowOffsetRatio;
    const { colStart, colEnd, rowStart, rowEnd } = getVisibleLabelRange(view, width, height, mapW, mapH);

    // tileToPixelはマス中心を返すため、半マス分戻してマップ端のスクリーン座標を得る
    const tileSize = MAP_CONFIG.tileSize * view.scale;
    const origin = tileToPixel(0, 0, view);
    const mapTopY = origin.py - tileSize / 2;
    const mapLeftX = origin.px - tileSize / 2;
    // クランプ時も文字が画面外へ出ないよう、縦を縮めた後の文字高で余白を取る
    const columnLabelY = Math.max(cfg.edgeInsetPx + fontSize * cfg.glyphScaleY, mapTopY - cfg.edgeInsetPx);
    // 列は奇数行が半マス右へずれてジグザグに並ぶため、偶数行と奇数行の中心の中間（右へ1/4マス）に置く
    const columnLabelOffsetX = tileSize / 4;

    ctx.save();
    ctx.font = `${fontSize}px ${cfg.fontFamily}`;
    ctx.fillStyle = cfg.color;
    ctx.lineWidth = cfg.haloWidth;
    ctx.strokeStyle = cfg.haloColor;

    // 上端：列ラベル（y=0行の中心基準。奇数行の半マスずれの影響を受けないようにする）
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let x = colStart; x <= colEnd; x++) {
        const { px } = tileToPixel(x, 0, view);
        // 選択中の列番号だけ強調色にする
        ctx.fillStyle = selectedTile?.x === x ? cfg.highlightColor : cfg.color;
        drawLabelText(ctx, String(x), px + columnLabelOffsetX, columnLabelY, shadowOffset, cfg);
    }

    // 左端：行ラベル（x=0列の中心基準。縦は常に直線なのでズレない）
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = rowStart; y <= rowEnd; y++) {
        const { py } = tileToPixel(0, y, view);
        const label = String(y);
        const labelWidth = ctx.measureText(label).width;
        const rowLabelX = Math.max(cfg.edgeInsetPx + labelWidth, mapLeftX - cfg.edgeInsetPx);
        // 選択中の行番号だけ強調色にする
        ctx.fillStyle = selectedTile?.y === y ? cfg.highlightColor : cfg.color;
        drawLabelText(ctx, label, rowLabelX, py, shadowOffset, cfg);
    }

    ctx.restore();
}

// ホバー中のマスの行の上辺・下辺を、可視列の範囲（マップの左右端まで）に描画
// 行の上下端はその行のどのマスでも同じy（半マスずれは横方向のみ）なので、常に一直線の2本になる
function drawHoverHorizontalLines(
    ctx: CanvasRenderingContext2D,
    hoverY: number,
    view: ViewState,
    colStart: number,
    colEnd: number
): void {
    const { py } = tileToPixel(0, hoverY, view);
    const halfTile = (MAP_CONFIG.tileSize * view.scale) / 2;
    // 可視列の左端・右端のマス辺（奇数行は半マス右へずれるため、行ごとの中心xから求める）
    const leftX = tileToPixel(colStart, hoverY, view).px - halfTile;
    const rightX = tileToPixel(colEnd, hoverY, view).px + halfTile;

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
function drawHoverVerticalLines(
    ctx: CanvasRenderingContext2D,
    hoverX: number,
    view: ViewState,
    rowStart: number,
    rowEnd: number
): void {
    const halfTile = (MAP_CONFIG.tileSize * view.scale) / 2;

    ctx.beginPath();
    for (let y = rowStart; y <= rowEnd; y++) {
        const { px, py } = tileToPixel(hoverX, y, view);

        // 左辺・右辺（この行の高さいっぱい）
        ctx.moveTo(px - halfTile, py - halfTile);
        ctx.lineTo(px - halfTile, py + halfTile);
        ctx.moveTo(px + halfTile, py - halfTile);
        ctx.lineTo(px + halfTile, py + halfTile);

        // 次の行との境界（y = py + halfTile）に、半マスずれた分をつなぐ横線を引く
        if (y < rowEnd) {
            const next = tileToPixel(hoverX, y + 1, view);
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
function drawHoverGuideLines(
    ctx: CanvasRenderingContext2D,
    hover: HoverState,
    view: ViewState,
    width: number,
    height: number,
    mapW: number,
    mapH: number,
    alpha: number
): void {
    const hoverX = hover.x;
    const hoverY = hover.y;
    if (hoverX === null || hoverY === null || alpha <= 0) return;

    // 描画範囲は可視範囲に絞る（縦線は行、横線は列。マップ全体を舐めないようにする）
    const { colStart, colEnd, rowStart, rowEnd } = getVisibleLabelRange(view, width, height, mapW, mapH);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = HOVER_GRID_CONFIG.lineColor;
    ctx.lineWidth = calcHoverLineWidth(view.scale);
    drawHoverHorizontalLines(ctx, hoverY, view, colStart, colEnd);
    drawHoverVerticalLines(ctx, hoverX, view, rowStart, rowEnd);
    ctx.restore();
}

// ドラッグ・ピンチ・ホイールによるパン/ズーム操作フック
function usePointerPanZoom(
    containerRef: RefObject<HTMLDivElement | null>,
    viewRef: RefObject<ViewState>,
    onChange: () => void
) {
    const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const isDraggingRef = useRef(false);
    const pinchRef = useRef({
        active: false,
        startDist: 0,
        startScale: 1,
        startOffsetX: 0,
        startOffsetY: 0,
        centerX: 0,
        centerY: 0,
    });

    function dist(p1: { x: number; y: number }, p2: { x: number; y: number }) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }

    const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        pointersRef.current.set(e.pointerId, pos);

        if (pointersRef.current.size === 1) {
            dragStartRef.current = pos;
            isDraggingRef.current = false;
        } else if (pointersRef.current.size === 2) {
            isDraggingRef.current = true;
            const [p1, p2] = Array.from(pointersRef.current.values());
            pinchRef.current = {
                active: true,
                startDist: dist(p1, p2),
                startScale: viewRef.current.scale,
                startOffsetX: viewRef.current.offsetX,
                startOffsetY: viewRef.current.offsetY,
                centerX: (p1.x + p2.x) / 2,
                centerY: (p1.y + p2.y) / 2,
            };
        }
    };

    const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (!pointersRef.current.has(e.pointerId)) return;
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const prev = pointersRef.current.get(e.pointerId)!;
        const next = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        pointersRef.current.set(e.pointerId, next);

        if (pointersRef.current.size === 2 && pinchRef.current.active) {
            isDraggingRef.current = true;
            const [p1, p2] = Array.from(pointersRef.current.values());
            const pinch = pinchRef.current;
            let newScale = pinch.startScale * (dist(p1, p2) / pinch.startDist);
            newScale = Math.min(MAP_CONFIG.maxScale, Math.max(MAP_CONFIG.minScale, newScale));
            const mapAtCenterX = (pinch.centerX + pinch.startOffsetX) / pinch.startScale;
            const mapAtCenterY = (pinch.centerY + pinch.startOffsetY) / pinch.startScale;
            viewRef.current = {
                offsetX: mapAtCenterX * newScale - pinch.centerX,
                offsetY: mapAtCenterY * newScale - pinch.centerY,
                scale: newScale,
            };
            onChange();
        } else if (pointersRef.current.size === 1) {
            if (dragStartRef.current) {
                const moved = Math.hypot(next.x - dragStartRef.current.x, next.y - dragStartRef.current.y);
                if (moved > 4) {
                    isDraggingRef.current = true;
                }
            }
            viewRef.current = {
                ...viewRef.current,
                offsetX: viewRef.current.offsetX - (next.x - prev.x),
                offsetY: viewRef.current.offsetY - (next.y - prev.y),
            };
            onChange();
        }
    };

    const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
        pointersRef.current.delete(e.pointerId);
        if (pointersRef.current.size === 0) {
            dragStartRef.current = null;
        }
        if (pointersRef.current.size < 2) pinchRef.current.active = false;
    };

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const rect = el.getBoundingClientRect();
            const cursorX = e.clientX - rect.left;
            const cursorY = e.clientY - rect.top;
            const { offsetX, offsetY, scale } = viewRef.current;

            // 上回転(奥)で拡大、下回転(手前)で縮小
            const zoomFactor = e.deltaY < 0 ? MAP_CONFIG.wheelZoomFactor : 1 / MAP_CONFIG.wheelZoomFactor;
            const newScale = Math.min(MAP_CONFIG.maxScale, Math.max(MAP_CONFIG.minScale, scale * zoomFactor));
            if (newScale === scale) return;

            // カーソル位置を中心にズーム
            const mapAtCursorX = (cursorX + offsetX) / scale;
            const mapAtCursorY = (cursorY + offsetY) / scale;
            viewRef.current = {
                offsetX: mapAtCursorX * newScale - cursorX,
                offsetY: mapAtCursorY * newScale - cursorY,
                scale: newScale,
            };
            onChange();
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            el.removeEventListener('wheel', handleWheel);
        };
    }, [containerRef, viewRef, onChange]);

    return { handlePointerDown, handlePointerMove, handlePointerUp, isDraggingRef };
}

function CanvasMap() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
    const statsRef = useRef<HTMLDivElement | null>(null);
    const sizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
    const initializedRef = useRef(false);
    const selectedTileRef = useRef<{ x: number; y: number } | null>(null);
    const selectedHudRef = useRef<HTMLDivElement | null>(null);
    const hoverStateRef = useRef<HoverState>({ x: null, y: null });
    const hoverFadeStartRef = useRef<number>(0); // ホバー位置が変わった時刻(ms)。ここからフェードアウトを始める
    const hoverFadeFrameRef = useRef<number>(0); // フェードアウト中のrAF ID
    const animationFrameRef = useRef<number>(0); // カーソルアニメーション中のrAF ID
    const cursorAnimStartRef = useRef<number>(0); // カーソルアニメーション開始時刻(ms)。パルスの位相計算に使う

    const { map_width, map_height, terrain_grid } = sectorData;

    // 初期スケールでマップ中央がcanvas中央に来るようoffsetを設定
    const initView = useCallback(
        (canvasW: number, canvasH: number) => {
            const centerMapX = (map_width / 2) * MAP_CONFIG.tileSize + MAP_CONFIG.tileSize * 0.5;
            const centerMapY = (map_height / 2) * MAP_CONFIG.tileSize + MAP_CONFIG.tileSize * 0.5;
            viewRef.current = {
                offsetX: centerMapX * MAP_CONFIG.initialScale - canvasW / 2,
                offsetY: centerMapY * MAP_CONFIG.initialScale - canvasH / 2,
                scale: MAP_CONFIG.initialScale,
            };
        },
        [map_width, map_height]
    );

    const viewRef = useRef<ViewState>({ offsetX: 0, offsetY: 0, scale: MAP_CONFIG.initialScale });

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const { width, height } = sizeRef.current;
        if (width <= 0 || height <= 0) return;

        ctx.clearRect(0, 0, width, height);
        applyCanvasRenderOptions(ctx, MAP_CONFIG.renderOptions);
        const view = viewRef.current;
        const { colStart, colEnd, rowStart, rowEnd, tileSize } = getVisibleRange(
            view,
            width,
            height,
            map_width,
            map_height
        );

        let count = 0;
        const start = performance.now();

        // オプションに応じたタイル描画サイズを計算
        const renderSize = calcTileRenderSize(tileSize, MAP_CONFIG.renderOptions);

        for (let y = rowStart; y <= rowEnd; y++) {
            for (let x = colStart; x <= colEnd; x++) {
                const cell = terrain_grid[y]?.[x];
                if (!cell) continue;

                const { px, py } = tileToPixel(x, y, view);
                const drawX = px - tileSize / 2;
                const drawY = py - tileSize / 2;

                const imgSrc = TERRAIN_IMAGE_MAP[cell.type];
                const img = imagesRef.current.get(imgSrc);

                if (img && img.complete && img.naturalWidth > 0) {
                    ctx.drawImage(img, drawX, drawY, renderSize, renderSize);
                } else {
                    ctx.fillStyle = MAP_CONFIG.colors.fallbackBg;
                    ctx.fillRect(drawX, drawY, renderSize, renderSize);
                    ctx.strokeStyle = MAP_CONFIG.colors.fallbackBorder;
                    ctx.strokeRect(drawX, drawY, renderSize, renderSize);
                }
                count++;
            }
        }

        const elapsed = performance.now() - start;
        if (statsRef.current) {
            statsRef.current.textContent = `描画: ${elapsed.toFixed(2)}ms / マス数: ${count} / 表示領域: ${width}x${height}`;
        }
    }, [map_width, map_height, terrain_grid]);

    // オーバーレイの再描画。ホバーガイドライン・選択カーソル・座標ラベルを描く
    const renderOverlay = useCallback(() => {
        const canvas = overlayCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const { width, height } = sizeRef.current;
        if (width <= 0 || height <= 0) return;

        ctx.clearRect(0, 0, width, height);

        // ホバーガイドライン（選択カーソル・ラベルより先に描き、文字に重ならないようにする）
        // ホバー位置が変わった時点から fadeDurationMs かけてフェードアウトする
        const hoverFadeAlpha = calcHoverFadeAlpha(
            hoverFadeStartRef.current,
            performance.now(),
            HOVER_GRID_CONFIG.fadeDurationMs
        );
        drawHoverGuideLines(
            ctx,
            hoverStateRef.current,
            viewRef.current,
            width,
            height,
            map_width,
            map_height,
            hoverFadeAlpha
        );

        // 選択カーソル（2秒周期のパルス付き角ブラケット）
        if (selectedTileRef.current) {
            const view = viewRef.current;
            const tileSize = MAP_CONFIG.tileSize * view.scale;
            const renderSize = calcTileRenderSize(tileSize, MAP_CONFIG.renderOptions);
            const { x, y } = selectedTileRef.current;
            const { px, py } = tileToPixel(x, y, view);
            const drawX = px - tileSize / 2;
            const drawY = py - tileSize / 2;
            const elapsed = performance.now() - cursorAnimStartRef.current;
            const scale = getPulseScale(elapsed, CORNER_CURSOR_CONFIG);
            drawCornerCursor(ctx, drawX, drawY, renderSize, scale);
        }

        // 座標ラベル（マップの上端・左端に追従。選択中の列・行は強調）
        drawCoordLabels(ctx, viewRef.current, width, height, map_width, map_height, selectedTileRef.current);
    }, [map_width, map_height]);

    // パン・ズーム・リサイズ時に両レイヤーを再描画する
    const renderAll = useCallback(() => {
        render();
        renderOverlay();
    }, [render, renderOverlay]);

    const stopCursorLoop = useCallback(() => {
        if (animationFrameRef.current !== 0) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = 0;
        }
    }, []);

    const startCursorLoop = useCallback(() => {
        stopCursorLoop();
        cursorAnimStartRef.current = performance.now();

        const loop = () => {
            if (!selectedTileRef.current) return;
            renderOverlay();
            animationFrameRef.current = requestAnimationFrame(loop);
        };

        animationFrameRef.current = requestAnimationFrame(loop);
    }, [renderOverlay, stopCursorLoop]);

    const stopHoverFadeLoop = useCallback(() => {
        if (hoverFadeFrameRef.current !== 0) {
            cancelAnimationFrame(hoverFadeFrameRef.current);
            hoverFadeFrameRef.current = 0;
        }
    }, []);

    // フェードアウト中だけオーバーレイを再描画し続け、消えきったらループを止める
    const startHoverFadeLoop = useCallback(() => {
        stopHoverFadeLoop();

        const loop = () => {
            // フェード完了時: alpha=0 で描き直してラインを完全に消してからループを止める
            if (performance.now() - hoverFadeStartRef.current >= HOVER_GRID_CONFIG.fadeDurationMs) {
                hoverFadeFrameRef.current = 0;
                renderOverlay();
                return;
            }
            renderOverlay();
            hoverFadeFrameRef.current = requestAnimationFrame(loop);
        };

        hoverFadeFrameRef.current = requestAnimationFrame(loop);
    }, [renderOverlay, stopHoverFadeLoop]);

    // ホバー位置が変わったとき: ラインを表示してフェードアウトを開始する（解除時は即座に消す）
    const handleHoverChange = useCallback(() => {
        const hover = hoverStateRef.current;
        if (hover.x === null || hover.y === null) {
            stopHoverFadeLoop();
            renderOverlay();
            return;
        }

        hoverFadeStartRef.current = performance.now();
        startHoverFadeLoop();
    }, [renderOverlay, startHoverFadeLoop, stopHoverFadeLoop]);

    // ポインター位置→マス座標の変換（viewはref経由で常に最新の表示状態を参照する）
    const resolveHoverCell = useCallback(
        (localX: number, localY: number) => pixelToTile(localX, localY, viewRef.current, map_width, map_height),
        [map_width, map_height]
    );

    // ホバー追跡（ポインター操作の共通基盤）。位置が変わったときだけ通知され、ラインの再表示とフェードを開始する
    const { handlePointerMoveForHover, handlePointerLeaveForHover, handleTapForHover } = useHoverTracking(
        hoverStateRef,
        containerRef,
        resolveHoverCell,
        handleHoverChange
    );

    // アンマウント時のクリーンアップ
    useEffect(() => {
        return () => {
            stopCursorLoop();
            stopHoverFadeLoop();
        };
    }, [stopCursorLoop, stopHoverFadeLoop]);

    // Canvasサイズをコンテナに追従させ、初回のみ中央揃えを実行
    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const updateSize = () => {
            const rect = container.getBoundingClientRect();
            const w = Math.min(MAP_CONFIG.maxViewportWidth, Math.max(1, Math.round(rect.width)));
            const h = Math.min(MAP_CONFIG.maxViewportHeight, Math.max(1, Math.round(rect.height)));

            sizeRef.current = { width: w, height: h };
            setupCanvasForDpr(canvas, w, h);
            if (overlayCanvasRef.current) {
                setupCanvasForDpr(overlayCanvasRef.current, w, h);
            }

            if (!initializedRef.current) {
                initView(w, h);
                initializedRef.current = true;
            }

            renderAll();
        };

        updateSize();

        const observer = new ResizeObserver(updateSize);
        observer.observe(container);
        return () => {
            observer.disconnect();
        };
    }, [renderAll, initView]);

    // 地形タイプに対応する全画像を事前ロード
    useEffect(() => {
        const map = imagesRef.current;
        for (const src of Object.values(TERRAIN_IMAGE_MAP)) {
            if (map.has(src)) continue;
            const img = new Image();
            img.onload = () => render();
            img.src = src;
            map.set(src, img);
        }
    }, [render]);

    const { handlePointerDown, handlePointerMove, handlePointerUp, isDraggingRef } = usePointerPanZoom(
        containerRef,
        viewRef,
        renderAll
    );

    const onContainerPointerUp = (e: PointerEvent<HTMLDivElement>) => {
        const wasDragging = isDraggingRef.current;
        handlePointerUp(e);

        // ドラッグ（パン/ピンチ）をクリックと誤認しない
        if (wasDragging) return;

        // マウス・ペンはホバー中のマスをクリックで即確定、タッチは同一マスへの2回目のタップで確定する
        handleTapForHover(e, (tile) => {
            selectedTileRef.current = tile;
            if (selectedHudRef.current) {
                selectedHudRef.current.textContent = `選択: (x=${tile.x}, y=${tile.y})`;
            }
            startCursorLoop();
        });
    };

    return (
        <div className="flex flex-col items-center w-full h-full min-h-0">
            <div ref={statsRef} className="text-[#ffd27a] text-[13px] mb-2 text-center shrink-0">
                描画: -ms / マス数: 0
            </div>
            <div ref={selectedHudRef} className="text-[#ffd27a] text-[13px] mb-2 text-center shrink-0">
                選択: -
            </div>
            <div
                ref={containerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={(e) => {
                    handlePointerMove(e);
                    handlePointerMoveForHover(e);
                }}
                onPointerUp={onContainerPointerUp}
                onPointerCancel={handlePointerUp}
                onPointerLeave={handlePointerLeaveForHover}
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: `${MAP_CONFIG.maxViewportWidth}px`,
                    height: '100%',
                    maxHeight: `${MAP_CONFIG.maxViewportHeight}px`,
                    touchAction: 'none',
                    overflow: 'hidden',
                    border: '1px solid #2a3a52',
                    background: '#0e1a2b',
                    boxSizing: 'border-box',
                }}
            >
                <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
                <canvas
                    ref={overlayCanvasRef}
                    style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
                />
            </div>
        </div>
    );
}
