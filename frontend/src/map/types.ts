import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import type { SectorTerrainData, TerrainCell, TerrainType } from '../types/terrain';

// マップ表示・描画設定の型定義
export interface MapRenderOptions {
    /** 画像のスムージング（falseでドット絵をくっきり表示） */
    imageSmoothing: boolean;
    /** サブピクセル描画によるタイルの隙間を防ぐ微小オーバーラップ（px） */
    overlapPx: number;
}

// マップ領域の配色（背景・枠線・地形画像が未ロードのときの代替配色）
export interface MapTheme {
    background: string;
    border: string;
    fallbackBg: string;
    fallbackBorder: string;
}

export interface MapConfig {
    tileSize: number;
    initialScale: number;
    minScale: number;
    maxScale: number;
    wheelZoomFactor: number;
    /** ドラッグとクリックを判定する移動距離の閾値（px） */
    dragThresholdPx: number;
    marginTiles: number;
    maxViewportWidth: number;
    maxViewportHeight: number;
    theme: MapTheme;
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

// ============================================================================
// 公開API（呼び出し側が注入するデータ・通知）
// ============================================================================

// 選択確定の通知内容（座標とセル情報の両方を渡す）
export interface MapSelection {
    coord: TileCoord;
    cell: TerrainCell;
}

export type OnSelectTile = (selection: MapSelection) => void;

// 地形画像マップ（呼び出し側が注入する。全キー必須ではない）
export type TerrainImageMap = Partial<Record<TerrainType, string>>;

// エントリコンポーネントのprops（外部から差し替え可能な入力）
export interface HexMapPreviewProps {
    sector: SectorTerrainData;
    settings?: MapSettingsInput;
    terrainImages?: TerrainImageMap;
    onSelect?: OnSelectTile;
}

// ============================================================================
// 設定の部分上書きと、既定値で解決した後の設定
// ============================================================================

export type DeepPartial<T> = { [Key in keyof T]?: T[Key] extends object ? DeepPartial<T[Key]> : T[Key] };

export interface MapSettingsInput {
    view?: DeepPartial<MapConfig>;
    label?: Partial<OverlayLabelConfig>;
    hoverGrid?: Partial<HoverGridConfig>;
    cornerCursor?: Partial<CornerCursorConfig>;
}

// 既定値と注入値をマージし終えた設定（描画側はこれだけを参照する）
export interface ResolvedMapSettings {
    view: MapConfig;
    label: OverlayLabelConfig;
    hoverGrid: HoverGridConfig;
    cornerCursor: CornerCursorConfig;
    images: TerrainImageMap;
}

// ============================================================================
// フックの入出力型
// ============================================================================

// ホバー対象のセル座標（マス座標の別名）
export type HoverCell = TileCoord;

// ホバー中の状態。未ホバー時は x / y に null が入る
export interface HoverState {
    x: number | null;
    y: number | null;
}

// ポインターイベントの要素内ローカル座標（CSS px）
export interface PointerLocalPosition {
    x: number;
    y: number;
}

export interface HoverTrackingResult<E extends HTMLElement> {
    // ホバー状態を設定する（同一セルなら再描画しない）
    setHover: (next: HoverState) => void;
    // ホバーを解除する
    clearHover: () => void;
    // 指定セルがホバー中かどうか
    isHoveredCell: (cell: HoverCell | null) => boolean;
    // イベント位置をセル座標へ変換する（範囲外は null）
    resolveEventCell: (event: ReactPointerEvent<E>) => HoverCell | null;
    // pointermove 用: ホバー位置をポインターに追従させる（タッチでは何もしない）
    handlePointerMoveForHover: (event: ReactPointerEvent<E>) => void;
    // pointerleave 用: ホバーを解除する（タッチでは解除しない）
    handlePointerLeaveForHover: (event?: ReactPointerEvent<E>) => void;
    // pointerup 用: ホバー中と同一セルなら onConfirm、別セルならホバー移動のみ
    handleTapForHover: (event: ReactPointerEvent<E>, onConfirm: (cell: HoverCell) => void) => void;
}

export interface PointerPanZoomResult<E extends HTMLElement> {
    handlePointerDown: (event: ReactPointerEvent<E>) => void;
    handlePointerMove: (event: ReactPointerEvent<E>) => void;
    handlePointerUp: (event: ReactPointerEvent<E>) => void;
    isDraggingRef: RefObject<boolean>;
}

// ピンチ開始時の表示状態と2本指の中心（開始時を基準に計算する）
export interface PinchState {
    view: ViewState;
    startDist: number;
    centerX: number;
    centerY: number;
}

export interface AnimationLoopController {
    start: () => void;
    stop: () => void;
    isRunning: () => boolean;
}
