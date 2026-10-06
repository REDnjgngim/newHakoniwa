import { useCallback, type RefObject } from 'react';
import type { SectorTerrainData } from '../../types/terrain';
import { applyCanvasRenderOptions, calcTileRenderSize } from '../canvas';
import { getVisibleRange, tileToPixel } from '../geometry';
import { drawCoordLabels } from '../render/coord-labels';
import { drawCornerCursor, getPulseScale } from '../render/corner-cursor';
import { calcHoverFadeAlpha, drawHoverGuideLines } from '../render/hover-grid';
import type { HoverState, ResolvedMapSettings, TileCoord, ViewState } from '../types';
import { useTerrainImages } from './use-terrain-images';

// ============================================================================
// 地形レイヤー描画（render）・オーバーレイ描画（renderOverlay）・両者の一括再描画
// （renderAll）をまとめて提供するフック。地形画像の読み込み完了時の再描画も
// このフック内部で完結させ、呼び出し側の renderRef を不要にする。
// 性能計測テキストは HUD へ直接書き込まず、onStatsUpdate で外部へ通知する。
// ============================================================================

export interface MapRendererParams {
    canvasRef: RefObject<HTMLCanvasElement | null>;
    overlayCanvasRef: RefObject<HTMLCanvasElement | null>;
    sizeRef: RefObject<{ width: number; height: number }>;
    viewRef: RefObject<ViewState>;
    selectedTileRef: RefObject<TileCoord | null>;
    hoverStateRef: RefObject<HoverState>;
    hoverFadeStartRef: RefObject<number>;
    cursorAnimStartRef: RefObject<number>;
    sector: SectorTerrainData;
    settings: ResolvedMapSettings;
    /** 性能計測結果の通知先（HUD の textContent 更新などに使う） */
    onStatsUpdate?: (text: string) => void;
}

export interface MapRendererResult {
    render: () => void;
    renderOverlay: () => void;
    renderAll: () => void;
}

export function useMapRenderer(params: MapRendererParams): MapRendererResult {
    const {
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
        onStatsUpdate,
    } = params;
    const { map_width, map_height, terrain_grid } = sector;
    const { theme, renderOptions, tileSize: baseTileSize, marginTiles } = settings.view;

    // 画像の読み込み完了時に最新の地形描画を呼ぶ。render より先に宣言する必要があるため、
    // 非同期の読み込み完了時に解決されるクロージャで参照する（renderRef は使わない）。
    const images = useTerrainImages(settings.images, () => {
        render();
    });

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
        onStatsUpdate?.(`描画: ${elapsed.toFixed(2)}ms / マス数: ${count} / 表示領域: ${width}x${height}`);
    }, [
        canvasRef,
        sizeRef,
        viewRef,
        map_width,
        map_height,
        terrain_grid,
        baseTileSize,
        marginTiles,
        renderOptions,
        theme,
        settings.images,
        images,
        onStatsUpdate,
    ]);

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
    }, [
        overlayCanvasRef,
        sizeRef,
        viewRef,
        selectedTileRef,
        hoverStateRef,
        hoverFadeStartRef,
        cursorAnimStartRef,
        map_width,
        map_height,
        baseTileSize,
        renderOptions,
        settings.hoverGrid,
        settings.cornerCursor,
        settings.label,
    ]);

    // パン・ズーム・リサイズ時に両レイヤーを再描画する
    const renderAll = useCallback(() => {
        render();
        renderOverlay();
    }, [render, renderOverlay]);

    return { render, renderOverlay, renderAll };
}
