import type { OverlayLabelConfig, TileCoord, ViewState } from '../types';
import { getVisibleLabelRange, tileToPixel } from '../geometry';

// 影→縁取り→本体の順に重ねて文字を描く（影は同じ字形を右下へずらして暗い色で描く）
export function drawLabelText(
    ctx: CanvasRenderingContext2D,
    label: string,
    x: number,
    y: number,
    shadowOffset: number,
    settings: OverlayLabelConfig
): void {
    // 影：ずらし量が潰しの影響を受けないよう画面座標側で移動する
    ctx.save();
    ctx.translate(x + shadowOffset, y + shadowOffset);
    ctx.scale(1, settings.glyphScaleY);
    ctx.fillStyle = settings.shadowColor;
    ctx.fillText(label, 0, 0);
    ctx.restore();

    // 本体：アンカー位置で文字の高さのみ縮めて縁取りと本体を重ねる
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, settings.glyphScaleY);
    ctx.strokeText(label, 0, 0); // 縁取り
    ctx.fillText(label, 0, 0); // 本体
    ctx.restore();
}

// マップの上端・左端に座標ラベルを描画（マップ端が画面外に出た軸は画面端に留める）
// selectedTile に指定された列・行のラベルは強調色で描画する（ホバーでは変えない）
export function drawCoordLabels(
    ctx: CanvasRenderingContext2D,
    view: ViewState,
    width: number,
    height: number,
    mapW: number,
    mapH: number,
    tileSize: number,
    selectedTile: TileCoord | null,
    settings: OverlayLabelConfig
): void {
    const cfg = settings;
    // 拡大に対しては指数カーブで緩やかに伸ばし、上下限で頭打ちにする
    const fontSize = Math.min(
        cfg.maxFontSize,
        Math.max(cfg.minFontSize, cfg.baseFontSize * Math.pow(view.scale, cfg.fontScaleExponent))
    );
    // 影のずらし量は文字サイズに比例させ、縮小時に影だけ離れて見えないようにする
    const shadowOffset = fontSize * cfg.shadowOffsetRatio;
    const { colStart, colEnd, rowStart, rowEnd } = getVisibleLabelRange(view, width, height, mapW, mapH, tileSize);

    // tileToPixelはマス中心を返すため、半マス分戻してマップ端のスクリーン座標を得る
    const scaledTileSize = tileSize * view.scale;
    const origin = tileToPixel(0, 0, view, tileSize);
    const mapTopY = origin.py - scaledTileSize / 2;
    const mapLeftX = origin.px - scaledTileSize / 2;
    // クランプ時も文字が画面外へ出ないよう、縦を縮めた後の文字高で余白を取る
    const columnLabelY = Math.max(cfg.edgeInsetPx + fontSize * cfg.glyphScaleY, mapTopY - cfg.edgeInsetPx);
    // 列は奇数行が半マス右へずれてジグザグに並ぶため、偶数行と奇数行の中心の中間（右へ1/4マス）に置く
    const columnLabelOffsetX = scaledTileSize / 4;

    ctx.save();
    ctx.font = `${fontSize}px ${cfg.fontFamily}`;
    ctx.fillStyle = cfg.color;
    ctx.lineWidth = cfg.haloWidth;
    ctx.strokeStyle = cfg.haloColor;

    // 上端：列ラベル（y=0行の中心基準。奇数行の半マスずれの影響を受けないようにする）
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let x = colStart; x <= colEnd; x++) {
        const { px } = tileToPixel(x, 0, view, tileSize);
        // 選択中の列番号だけ強調色にする
        ctx.fillStyle = selectedTile?.x === x ? cfg.highlightColor : cfg.color;
        drawLabelText(ctx, String(x), px + columnLabelOffsetX, columnLabelY, shadowOffset, cfg);
    }

    // 左端：行ラベル（x=0列の中心基準。縦は常に直線なのでズレない）
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = rowStart; y <= rowEnd; y++) {
        const { py } = tileToPixel(0, y, view, tileSize);
        const label = String(y);
        const labelWidth = ctx.measureText(label).width;
        const rowLabelX = Math.max(cfg.edgeInsetPx + labelWidth, mapLeftX - cfg.edgeInsetPx);
        // 選択中の行番号だけ強調色にする
        ctx.fillStyle = selectedTile?.y === y ? cfg.highlightColor : cfg.color;
        drawLabelText(ctx, label, rowLabelX, py, shadowOffset, cfg);
    }

    ctx.restore();
}
