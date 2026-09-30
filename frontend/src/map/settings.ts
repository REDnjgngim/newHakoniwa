import type { CornerCursorConfig, HoverGridConfig, MapConfig, OverlayLabelConfig } from './types';

// マップ表示の基本設定値
export const MAP_VIEW_SETTINGS: MapConfig = {
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

export const LABEL_SETTINGS: OverlayLabelConfig = {
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

export const HOVER_GRID_SETTINGS: HoverGridConfig = {
    lineColor: 'rgba(255, 255, 255, 0.5)', // ガイドラインは白。地形画像を隠さないよう少し透過させる
    baseLineWidth: 1, // scale=1.0時の線幅(px)
    minLineWidth: 0.5,
    maxLineWidth: 2, // 基準の2倍。達したら以降は一定
    lineWidthScaleExponent: 0.8, // 拡大に対する伸び。座標ラベルの文字サイズと同じカーブにする
    fadeDurationMs: 1000, // ホバー位置が変わってからラインが消えるまでの時間(ms)
};

export const CORNER_CURSOR_SETTINGS: CornerCursorConfig = {
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
