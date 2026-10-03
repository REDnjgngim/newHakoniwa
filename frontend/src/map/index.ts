// ============================================================================
// マップエンジンの公開API（barrel）。
// 内部モジュールを `export *` で横断公開せず、名前を明示して境界を明確にする。
// ============================================================================

// 型
export type {
    AnimationLoopController,
    CornerCursorConfig,
    DeepPartial,
    HexMapPreviewProps,
    HoverCell,
    HoverGridConfig,
    HoverState,
    HoverTrackingResult,
    LabelRange,
    MapConfig,
    MapRenderOptions,
    MapSelection,
    MapSettingsInput,
    MapTheme,
    OnSelectTile,
    OverlayLabelConfig,
    PinchState,
    PointerLocalPosition,
    PointerPanZoomResult,
    ResolvedMapSettings,
    TerrainImageMap,
    TileCoord,
    TileRange,
    ViewState,
} from './types';

// 設定
export {
    CORNER_CURSOR_SETTINGS,
    HOVER_GRID_SETTINGS,
    LABEL_SETTINGS,
    MAP_VIEW_SETTINGS,
    resolveMapSettings,
} from './settings';

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

// フック
export { getPointerLocalPosition, useHoverTracking } from './hooks/use-hover-tracking';
export { usePointerPanZoom } from './hooks/use-pointer-pan-zoom';
export { useWheelZoom } from './hooks/use-wheel-zoom';
export { useAnimationLoop } from './hooks/use-animation-loop';
export { useElementSize } from './hooks/use-element-size';
export { useTerrainImages } from './hooks/use-terrain-images';
export type { PointerPanZoomSettings } from './hooks/use-pointer-pan-zoom';
export type { WheelZoomSettings } from './hooks/use-wheel-zoom';
export type { ElementSize, ElementSizeLimits } from './hooks/use-element-size';
