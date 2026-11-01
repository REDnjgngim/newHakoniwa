import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { SectorTerrainData } from '@/shared/terrain-types';
import { applyCanvasRenderOptions, calcTileRenderSize } from '../engine/canvas';
import { tileToPixel } from '../engine/geometry';
import { drawBoundaryLine } from '../render/boundary-line';
import { drawCoordLabels } from '../render/coord-labels';
import { drawCornerCursor, getPulseScale } from '../render/corner-cursor';
import { calcHoverFadeAlpha, drawHoverGuideLines } from '../render/hover-grid';
import { buildTerrainCache } from '../engine/terrain-cache';
import type { HoverState, ResolvedMapSettings, TerrainCache, ViewState } from '../engine/types';
import type { TileCoord } from '@/shared/terrain-types';
import { useTerrainImages } from './use-terrain-images';

// ============================================================================
// 地形レイヤー描画（render）・オーバーレイ描画（renderOverlay）・両者の一括再描画
// （renderAll）をまとめて提供するフック。地形画像の読み込み完了時の再描画も
// このフック内部で完結させ、呼び出し側の renderRef を不要にする。
// ============================================================================

export type MapRendererParams = {
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
};

export type MapRendererResult = {
    render: () => void;
    renderOverlay: () => void;
    renderAll: () => void;
};

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
    } = params;
    const { map_width, map_height } = sector;
    const { renderOptions, tileSize: baseTileSize } = settings.view;

    const cacheRef = useRef<TerrainCache | null>(null);
    const renderRef = useRef<() => void>(() => {});
    const [imageVersion, setImageVersion] = useState(0);
    const images = useTerrainImages(settings.images, () => {
        // 画像ロード完了時はステート更新のみ通知（setTimeout は削除）
        setImageVersion((v) => v + 1);
    });

    useEffect(() => {
        // キャッシュを生成してセット
        const c = buildTerrainCache({ sector, settings, images });
        cacheRef.current = c;
        // 最新キャッシュの準備が完了した直後に確実にメイン Canvas へ描画
        renderRef.current();
    }, [sector, settings, images, imageVersion]);

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const { width, height } = sizeRef.current;
        if (width <= 0 || height <= 0) return;

        const c = cacheRef.current;
        if (!c) return;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = settings.view.theme.outerSea;
        ctx.fillRect(0, 0, width, height);
        applyCanvasRenderOptions(ctx, renderOptions);
        const view = viewRef.current;

        ctx.drawImage(c.canvas, -view.offsetX, -view.offsetY, c.width * view.scale, c.height * view.scale);
    }, [canvasRef, sizeRef, viewRef, renderOptions, settings.view.theme.outerSea]);
    renderRef.current = render;

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

        // 12×12 グリッドの外枠を囲む境界ライン（グロー付き実線・パン/ズーム追従）
        drawBoundaryLine(ctx, viewRef.current, map_width, map_height, baseTileSize, settings.boundaryLine);

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
        settings.boundaryLine,
    ]);

    // パン・ズーム・リサイズ時に両レイヤーを再描画する
    const renderAll = useCallback(() => {
        render();
        renderOverlay();
    }, [render, renderOverlay]);

    return { render, renderOverlay, renderAll };
}
