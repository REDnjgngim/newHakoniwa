import { useCallback, useRef, type PointerEvent } from 'react';
import type { SectorTerrainData } from '../../types/terrain';
import {
    clampPanOffset,
    pixelToTile,
    setupCanvasForDpr,
    useElementSize,
    useHoverTracking,
    useMapAnimations,
    useMapRenderer,
    usePointerPanZoom,
    useTileSelection,
    useWheelZoom,
} from '../../map';
import type { HoverState, OnSelectTile, ResolvedMapSettings, ViewState } from '../../map';
import MapHud from './map-hud';

// ============================================================================
// マップ本体（地形レイヤーとオーバーレイレイヤーの2枚のcanvas）。
// セクター地形データと解決済み設定をpropsで受け取り、モックデータを直接参照しない。
// ============================================================================

export interface CanvasMapProps {
    sector: SectorTerrainData;
    settings: ResolvedMapSettings;
    onSelect?: OnSelectTile;
}

function CanvasMap({ sector, settings, onSelect }: CanvasMapProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);
    const selectedHudRef = useRef<HTMLDivElement>(null);
    const sizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
    const selectedTileRef = useRef<{ x: number; y: number } | null>(null);
    const hoverStateRef = useRef<HoverState>({ x: null, y: null });
    const hoverFadeStartRef = useRef<number>(0); // ホバー位置が変わった時刻(ms)。ここからフェードアウトを始める
    const cursorAnimStartRef = useRef<number>(0); // カーソルアニメーション開始時刻(ms)。パルスの位相計算に使う

    const { map_width, map_height, terrain_grid } = sector;
    const { theme, tileSize: baseTileSize, initialScale, panLimitMode } = settings.view;

    const viewRef = useRef<ViewState>({ offsetX: 0, offsetY: 0, scale: initialScale });

    // 初期スケールでマップ中央がcanvas中央に来るようoffsetを設定
    const initView = useCallback(
        (canvasW: number, canvasH: number) => {
            const centerMapX = (map_width / 2) * baseTileSize + baseTileSize * 0.5;
            const centerMapY = (map_height / 2) * baseTileSize + baseTileSize * 0.5;
            viewRef.current = {
                offsetX: centerMapX * initialScale - canvasW / 2,
                offsetY: centerMapY * initialScale - canvasH / 2,
                scale: initialScale,
            };
        },
        [map_width, map_height, baseTileSize, initialScale]
    );

    // 性能計測テキストを HUD へ書き込む（React の再レンダリングを避けるため textContent を直接更新する）
    const handleStatsUpdate = useCallback((text: string) => {
        if (statsRef.current) {
            statsRef.current.textContent = text;
        }
    }, []);

    const { renderOverlay, renderAll } = useMapRenderer({
        canvasRef,
        overlayCanvasRef,
        sizeRef,
        viewRef,
        selectedTileRef,
        hoverStateRef,
        hoverFadeStartRef,
        cursorAnimStartRef,
        sector,
        settings,
        onStatsUpdate: handleStatsUpdate,
    });

    const { cursorLoop, handleHoverChange } = useMapAnimations({
        selectedTileRef,
        hoverFadeStartRef,
        hoverStateRef,
        fadeDurationMs: settings.hoverGrid.fadeDurationMs,
        renderOverlay,
    });

    const { handleTileConfirm } = useTileSelection({
        selectedTileRef,
        selectedHudRef,
        cursorAnimStartRef,
        cursorLoop,
        terrain_grid,
        onSelect,
    });

    // ポインター位置→マス座標の変換（viewはref経由で常に最新の表示状態を参照する）
    const resolveHoverCell = useCallback(
        (localX: number, localY: number) =>
            pixelToTile(localX, localY, viewRef.current, map_width, map_height, baseTileSize),
        [map_width, map_height, baseTileSize]
    );

    // ホバー追跡（ポインター操作の共通基盤）。位置が変わったときだけ通知され、ラインの再表示とフェードを開始する
    const { handlePointerMoveForHover, handlePointerLeaveForHover, handleTapForHover } = useHoverTracking(
        hoverStateRef,
        containerRef,
        resolveHoverCell,
        handleHoverChange
    );

    // Canvasサイズをコンテナに追従させ、初回のみ中央揃えを実行
    const handleResize = useCallback(
        (size: { width: number; height: number; isFirst: boolean }) => {
            sizeRef.current = { width: size.width, height: size.height };

            const canvas = canvasRef.current;
            if (canvas) setupCanvasForDpr(canvas, size.width, size.height);
            if (overlayCanvasRef.current) setupCanvasForDpr(overlayCanvasRef.current, size.width, size.height);

            if (size.isFirst) initView(size.width, size.height);

            // リサイズで可視領域が変わってもパン範囲内に収まるよう offset を制限し直す
            if (panLimitMode !== 'none') {
                viewRef.current = clampPanOffset(
                    viewRef.current,
                    size.width,
                    size.height,
                    map_width,
                    map_height,
                    baseTileSize
                );
            }

            renderAll();
        },
        [initView, renderAll, panLimitMode, map_width, map_height, baseTileSize]
    );

    // InspectorFrame が full-screen を担うため、container 側の上限は実質撤廃する
    useElementSize(
        containerRef,
        { maxWidth: Number.MAX_SAFE_INTEGER, maxHeight: Number.MAX_SAFE_INTEGER },
        handleResize
    );

    const { handlePointerDown, handlePointerMove, handlePointerUp, isDraggingRef } = usePointerPanZoom(
        containerRef,
        viewRef,
        renderAll,
        {
            dragThresholdPx: settings.view.dragThresholdPx,
            minScale: settings.view.minScale,
            maxScale: settings.view.maxScale,
            mapWidth: map_width,
            mapHeight: map_height,
            tileSize: baseTileSize,
            panLimitMode,
            canvasSize: sizeRef,
        }
    );

    useWheelZoom(containerRef, viewRef, renderAll, {
        wheelZoomFactor: settings.view.wheelZoomFactor,
        minScale: settings.view.minScale,
        maxScale: settings.view.maxScale,
        mapWidth: map_width,
        mapHeight: map_height,
        tileSize: baseTileSize,
        panLimitMode,
        canvasSize: sizeRef,
    });

    const onContainerPointerUp = (e: PointerEvent<HTMLDivElement>) => {
        const wasDragging = isDraggingRef.current;
        handlePointerUp(e);

        // ドラッグ（パン/ピンチ）をクリックと誤認しない
        if (wasDragging) return;

        // マウス・ペンはホバー中のマスをクリックで即確定、タッチは同一マスへの2回目のタップで確定する
        handleTapForHover(e, handleTileConfirm);
    };

    return (
        <div className="relative size-full min-h-0">
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
                    height: '100%',
                    touchAction: 'none',
                    overflow: 'hidden',
                    border: `1px solid ${theme.border}`,
                    background: theme.background,
                    boxSizing: 'border-box',
                    minHeight: 0,
                }}
            >
                <MapHud statsRef={statsRef} selectedHudRef={selectedHudRef} />
                <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
                <canvas
                    ref={overlayCanvasRef}
                    style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
                />
            </div>
        </div>
    );
}

export default CanvasMap;
