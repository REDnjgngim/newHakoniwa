// マップ表示・描画設定の型定義
export interface MapRenderOptions {
    /** 画像のスムージング（falseでドット絵をくっきり表示） */
    imageSmoothing: boolean;
    /** サブピクセル描画によるタイルの隙間を防ぐ微小オーバーラップ（px） */
    overlapPx: number;
}

export interface MapConfig {
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

// 座標ラベルの描画設定
export interface OverlayLabelConfig {
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

// ホバー中のマスを示すガイドラインの描画設定
export interface HoverGridConfig {
    lineColor: string;
    baseLineWidth: number;
    minLineWidth: number;
    maxLineWidth: number;
    lineWidthScaleExponent: number;
    fadeDurationMs: number;
}

// 選択中タイルを示す角ブラケットカーソルの描画設定
export interface CornerCursorConfig {
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

// マス座標（0始まり）
export interface TileCoord {
    x: number;
    y: number;
}

export interface ViewState {
    offsetX: number;
    offsetY: number;
    scale: number;
}

export interface TileRange {
    colStart: number;
    colEnd: number;
    rowStart: number;
    rowEnd: number;
    tileSize: number;
}

// ラベル描画用の表示範囲（描画用の余剰マスは含めない）
export interface LabelRange {
    colStart: number;
    colEnd: number;
    rowStart: number;
    rowEnd: number;
}
