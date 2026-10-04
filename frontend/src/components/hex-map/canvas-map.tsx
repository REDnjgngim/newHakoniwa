import { useCallback, useEffect, useRef, type PointerEvent } from 'react';
import type { SectorTerrainData } from '../../types/terrain';
import {
    applyCanvasRenderOptions,
    calcHoverFadeAlpha,
    calcTileRenderSize,
    drawCoordLabels,
    drawCornerCursor,
    drawHoverGuideLines,
    getPulseScale,
    getVisibleRange,
    pixelToTile,
    setupCanvasForDpr,
    tileToPixel,
    useAnimationLoop,
    useElementSize,
    useHoverTracking,
    usePointerPanZoom,
    useTerrainImages,
    useWheelZoom,
} from '../../map';
import type { AnimationLoopController, HoverState, OnSelectTile, ResolvedMapSettings, ViewState } from '../../map';
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
    const { theme, renderOptions, tileSize: baseTileSize, marginTiles, initialScale } = settings.view;

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

    // 画像の読み込み完了時に最新の地形描画を呼ぶため、描画処理はref経由で参照する
    const renderRef = useRef<() => void>(() => {});
    const images = useTerrainImages(settings.images, () => renderRef.current());

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const { width, height } = sizeRef.current;
        if (width <= 0 || height <= 0) return;

        ctx.clearRect(0, 0, width, height);
        applyCanvasRenderOptions(ctx, renderOptions);
        const view = viewRef.current;
        const { colStart, colEnd, rowStart, rowEnd, tileSize } = getVisibleRange(
            view,
            width,
            height,
            map_width,
            map_height,
            { tileSize: baseTileSize, marginTiles }
        );

        let count = 0;
        const start = performance.now();

        // オプションに応じたタイル描画サイズを計算
        const renderSize = calcTileRenderSize(tileSize, renderOptions);

        for (let y = rowStart; y <= rowEnd; y++) {
            for (let x = colStart; x <= colEnd; x++) {
                const cell = terrain_grid[y]?.[x];
                if (!cell) continue;

                const { px, py } = tileToPixel(x, y, view, baseTileSize);
                const drawX = px - tileSize / 2;
                const drawY = py - tileSize / 2;

                // 画像が未定義の地形タイプはフォールバック矩形で描く
                const imgSrc = settings.images[cell.type];
                const img = imgSrc ? images.get(imgSrc) : undefined;

                if (img && img.complete && img.naturalWidth > 0) {
                    ctx.drawImage(img, drawX, drawY, renderSize, renderSize);
                } else {
                    ctx.fillStyle = theme.fallbackBg;
                    ctx.fillRect(drawX, drawY, renderSize, renderSize);
                    ctx.strokeStyle = theme.fallbackBorder;
                    ctx.strokeRect(drawX, drawY, renderSize, renderSize);
                }
                count++;
            }
        }

        const elapsed = performance.now() - start;
        if (statsRef.current) {
            statsRef.current.textContent = `描画: ${elapsed.toFixed(2)}ms / マス数: ${count} / 表示領域: ${width}x${height}`;
        }
    }, [map_width, map_height, terrain_grid, baseTileSize, marginTiles, renderOptions, theme, settings.images, images]);

    // ループや読み込み完了コールバックへ常に最新の描画処理を渡せるようにする
    useEffect(() => {
        renderRef.current = render;
    });

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
            settings.hoverGrid.fadeDurationMs
        );
        drawHoverGuideLines(
            ctx,
            hoverStateRef.current,
            viewRef.current,
            width,
            height,
            map_width,
            map_height,
            hoverFadeAlpha,
            settings.hoverGrid,
            baseTileSize
        );

        // 選択カーソル（2秒周期のパルス付き角ブラケット）
        if (selectedTileRef.current) {
            const view = viewRef.current;
            const tileSize = baseTileSize * view.scale;
            const renderSize = calcTileRenderSize(tileSize, renderOptions);
            const { x, y } = selectedTileRef.current;
            const { px, py } = tileToPixel(x, y, view, baseTileSize);
            const elapsed = performance.now() - cursorAnimStartRef.current;
            const scale = getPulseScale(elapsed, settings.cornerCursor);
            drawCornerCursor(ctx, px - tileSize / 2, py - tileSize / 2, renderSize, scale, settings.cornerCursor);
        }

        // 座標ラベル（マップの上端・左端に追従。選択中の列・行は強調）
        drawCoordLabels(
            ctx,
            viewRef.current,
            width,
            height,
            map_width,
            map_height,
            baseTileSize,
            selectedTileRef.current,
            settings.label
        );
    }, [map_width, map_height, baseTileSize, renderOptions, settings.hoverGrid, settings.cornerCursor, settings.label]);

    // パン・ズーム・リサイズ時に両レイヤーを再描画する
    const renderAll = useCallback(() => {
        render();
        renderOverlay();
    }, [render, renderOverlay]);

    // 選択演出のパルス: 選択が外れたらループを止める
    const cursorLoopRef = useRef<AnimationLoopController>(null);
    const cursorLoop = useAnimationLoop(
        useCallback(() => {
            if (!selectedTileRef.current) {
                cursorLoopRef.current?.stop();
                return;
            }
            renderOverlay();
        }, [renderOverlay])
    );
    useEffect(() => {
        cursorLoopRef.current = cursorLoop;
    }, [cursorLoop]);

    // ホバーのフェード: フェード完了時に最後の描画をしてからループを止める
    const hoverFadeLoopRef = useRef<AnimationLoopController>(null);
    const hoverFadeLoop = useAnimationLoop(
        useCallback(
            (nowMs: number) => {
                if (nowMs - hoverFadeStartRef.current >= settings.hoverGrid.fadeDurationMs) {
                    hoverFadeLoopRef.current?.stop();
                    renderOverlay();
                    return;
                }
                renderOverlay();
            },
            [renderOverlay, settings.hoverGrid.fadeDurationMs]
        )
    );
    useEffect(() => {
        hoverFadeLoopRef.current = hoverFadeLoop;
    }, [hoverFadeLoop]);

    // ホバー位置が変わったとき: ラインを表示してフェードアウトを開始する（解除時は即座に消す）
    const handleHoverChange = useCallback(() => {
        const hover = hoverStateRef.current;
        if (hover.x === null || hover.y === null) {
            hoverFadeLoop.stop();
            renderOverlay();
            return;
        }

        hoverFadeStartRef.current = performance.now();
        hoverFadeLoop.start();
    }, [renderOverlay, hoverFadeLoop]);

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

            renderAll();
        },
        [initView, renderAll]
    );

    useElementSize(
        containerRef,
        { maxWidth: settings.view.maxViewportWidth, maxHeight: settings.view.maxViewportHeight },
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
        }
    );

    useWheelZoom(containerRef, viewRef, renderAll, {
        wheelZoomFactor: settings.view.wheelZoomFactor,
        minScale: settings.view.minScale,
        maxScale: settings.view.maxScale,
    });

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

            // セルが取得できない場合は通知せずHUDのみ更新する
            const cell = terrain_grid[tile.y]?.[tile.x];
            if (cell) onSelect?.({ coord: tile, cell });

            cursorAnimStartRef.current = performance.now();
            cursorLoop.start();
        });
    };

    return (
        <div className="flex flex-col items-center w-full h-full min-h-0">
            <MapHud statsRef={statsRef} selectedHudRef={selectedHudRef} />
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
                    maxWidth: `${settings.view.maxViewportWidth}px`,
                    height: '100%',
                    maxHeight: `${settings.view.maxViewportHeight}px`,
                    touchAction: 'none',
                    overflow: 'hidden',
                    border: `1px solid ${theme.border}`,
                    background: theme.background,
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

export default CanvasMap;
