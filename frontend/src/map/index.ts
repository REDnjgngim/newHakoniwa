// ============================================================================
// マップエンジンの公開API（barrel）。
// 内部モジュールを `export *` で横断公開せず、名前を明示して境界を明確にする。
// ============================================================================

// 型
export type {
    CornerCursorConfig,
    HoverGridConfig,
    LabelRange,
    MapConfig,
    MapRenderOptions,
    OverlayLabelConfig,
    TileCoord,
    TileRange,
    ViewState,
} from './types';

// 設定
export { CORNER_CURSOR_SETTINGS, HOVER_GRID_SETTINGS, LABEL_SETTINGS, MAP_VIEW_SETTINGS } from './settings';

// 幾何・Canvas
export {
    clamp,
    distance,
    getVisibleLabelRange,
    getVisibleRange,
    pixelToTile,
    tileToPixel,
    zoomAroundPoint,
} from './geometry';
export { applyCanvasRenderOptions, calcTileRenderSize, setupCanvasForDpr } from './canvas';

// 描画
export { drawCoordLabels, drawLabelText } from './render/coord-labels';
export {
    calcHoverFadeAlpha,
    calcHoverLineWidth,
    drawHoverGuideLines,
    drawHoverHorizontalLines,
    drawHoverVerticalLines,
} from './render/hover-grid';
export { drawCornerCursor, getPulseScale } from './render/corner-cursor';
