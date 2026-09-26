import { useEffect, useRef, useCallback, type RefObject, type PointerEvent } from 'react';
import type { SectorTerrainData } from './types/terrain';
import { TERRAIN_IMAGE_MAP } from './constants/terrain';
import terrainDataJson from './mocks/sector_terrain.json';

// マップ表示・描画設定の型定義
interface MapRenderOptions {
    /** 画像のスムージング（falseでドット絵をくっきり表示） */
    imageSmoothing: boolean;
    /** サブピクセル描画によるタイルの隙間を防ぐ微小オーバーラップ（px） */
    overlapPx: number;
}

interface MapConfig {
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
    cometAnimation: {
        durationMs: number;
        trailRatio: number;
        segments: number;
        lineWidth: number;
    };
    renderOptions: MapRenderOptions;
}

// マップ表示の基本設定値
const MAP_CONFIG: MapConfig = {
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
    cometAnimation: {
        durationMs: 3000, // 1周にかかるミリ秒
        trailRatio: 0.25, // 残像の長さ（外周全体に対する割合: 1/4 = 1辺分）
        segments: 100, // 残像を構成する線分の分割数
        lineWidth: 2, // 線の太さ(px)
    },
    renderOptions: {
        imageSmoothing: false, // 画像の平滑化（falseでドット絵をくっきり表示）
        overlapPx: 0.5, // タイルの隙間を防ぐ微小オーバーラップ（px）
    },
};

// Canvas描画オプションの適用処理
function applyCanvasRenderOptions(ctx: CanvasRenderingContext2D, options: MapRenderOptions) {
    ctx.imageSmoothingEnabled = options.imageSmoothing;
}

// サブピクセルの隙間防止オーバーラップを考慮したタイル描画サイズの算出
function calcTileRenderSize(tileSize: number, options: MapRenderOptions): number {
    return tileSize + options.overlapPx;
}

// JSON型をSectorTerrainDataとして扱う
const sectorData = terrainDataJson as SectorTerrainData;

interface ViewState {
    offsetX: number;
    offsetY: number;
    scale: number;
}

interface TileRange {
    colStart: number;
    colEnd: number;
    rowStart: number;
    rowEnd: number;
    tileSize: number;
}

export default function HexMapPreview() {
    return (
        <div className="w-full h-screen bg-[#0e1a2b] flex flex-col items-center p-3 box-border font-sans overflow-hidden">
            <CanvasMap />
        </div>
    );
}

// 奇数行を右に半マスずらすoffset座標系でマップ座標→スクリーン座標へ変換
function tileToPixel(x: number, y: number, view: ViewState) {
    const { offsetX, offsetY, scale } = view;
    const rowOffset = y % 2 === 1 ? MAP_CONFIG.tileSize / 2 : 0;
    const mapPx = x * MAP_CONFIG.tileSize + rowOffset + MAP_CONFIG.tileSize * 0.5;
    const mapPy = y * MAP_CONFIG.tileSize + MAP_CONFIG.tileSize * 0.5;
    return { px: mapPx * scale - offsetX, py: mapPy * scale - offsetY };
}

// スクリーンピクセル座標からタイルグリッド座標(x, y)を逆算（範囲外ならnull）
function pixelToTile(
    px: number,
    py: number,
    view: ViewState,
    mapW: number,
    mapH: number
): { x: number; y: number } | null {
    const { offsetX, offsetY, scale } = view;
    const mapPx = (px + offsetX) / scale;
    const mapPy = (py + offsetY) / scale;

    const y = Math.floor(mapPy / MAP_CONFIG.tileSize);
    if (y < 0 || y >= mapH) return null;

    const rowOffset = y % 2 === 1 ? MAP_CONFIG.tileSize / 2 : 0;
    const x = Math.floor((mapPx - rowOffset) / MAP_CONFIG.tileSize);
    if (x < 0 || x >= mapW) return null;

    return { x, y };
}

// タイル外周上の正規化位置 t ∈ [0, 1) からスクリーン座標を算出（時計回り: 上辺→右辺→下辺→左辺）
function perimeterPoint(t: number, drawX: number, drawY: number, size: number): { x: number; y: number } {
    // 0 <= t < 1 に正規化
    const normT = ((t % 1) + 1) % 1;
    if (normT < 0.25) {
        // 上辺: 左 (drawX, drawY) → 右 (drawX + size, drawY)
        return { x: drawX + normT * 4 * size, y: drawY };
    } else if (normT < 0.5) {
        // 右辺: 上 (drawX + size, drawY) → 下 (drawX + size, drawY + size)
        return { x: drawX + size, y: drawY + (normT - 0.25) * 4 * size };
    } else if (normT < 0.75) {
        // 下辺: 右 (drawX + size, drawY + size) → 左 (drawX, drawY + size)
        return { x: drawX + size - (normT - 0.5) * 4 * size, y: drawY + size };
    } else {
        // 左辺: 下 (drawX, drawY + size) → 上 (drawX, drawY)
        return { x: drawX, y: drawY + size - (normT - 0.75) * 4 * size };
    }
}

// 選択タイルの外周（マスの内側）を周回する彗星エフェクトを描画（連続した滑らかな残像線）
function drawCometEffect(ctx: CanvasRenderingContext2D, t: number, drawX: number, drawY: number, size: number): void {
    const { trailRatio, segments, lineWidth } = MAP_CONFIG.cometAnimation;

    // 線の中心がタイルの境界上だと半分外側にはみ出すため、lineWidth / 2 だけ内側にオフセット
    const inset = lineWidth / 2;
    const innerX = drawX + inset;
    const innerY = drawY + inset;
    const innerSize = size - lineWidth;

    ctx.save();
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';

    // 尾から先端に向かって細分化された線分を描画
    for (let i = segments - 1; i >= 0; i--) {
        const ratioStart = (i + 1) / segments;
        const ratioEnd = i / segments;

        const tStart = t - ratioStart * trailRatio;
        const tEnd = t - ratioEnd * trailRatio;

        const pStart = perimeterPoint(tStart, innerX, innerY, innerSize);
        const pEnd = perimeterPoint(tEnd, innerX, innerY, innerSize);

        // 先端に向かってなめらかに明るくなる
        const alpha = Math.pow(1 - ratioEnd, 1);

        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.lineTo(pEnd.x, pEnd.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        ctx.stroke();
    }

    ctx.restore();
}

// ビューポートカリング: 現在表示範囲に含まれるマス番号の範囲を算出
function getVisibleRange(view: ViewState, width: number, height: number, mapW: number, mapH: number): TileRange {
    const { offsetX, offsetY, scale } = view;
    const tileSize = MAP_CONFIG.tileSize * scale;
    return {
        colStart: Math.max(0, Math.floor(offsetX / tileSize) - MAP_CONFIG.marginTiles),
        colEnd: Math.min(mapW - 1, Math.ceil((offsetX + width) / tileSize) + MAP_CONFIG.marginTiles),
        rowStart: Math.max(0, Math.floor(offsetY / tileSize) - MAP_CONFIG.marginTiles),
        rowEnd: Math.min(mapH - 1, Math.ceil((offsetY + height) / tileSize) + MAP_CONFIG.marginTiles),
        tileSize,
    };
}

// ドラッグ・ピンチ・ホイールによるパン/ズーム操作フック
function usePointerPanZoom(
    containerRef: RefObject<HTMLDivElement | null>,
    viewRef: RefObject<ViewState>,
    onChange: () => void
) {
    const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const isDraggingRef = useRef(false);
    const pinchRef = useRef({
        active: false,
        startDist: 0,
        startScale: 1,
        startOffsetX: 0,
        startOffsetY: 0,
        centerX: 0,
        centerY: 0,
    });

    function dist(p1: { x: number; y: number }, p2: { x: number; y: number }) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }

    const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        pointersRef.current.set(e.pointerId, pos);

        if (pointersRef.current.size === 1) {
            dragStartRef.current = pos;
            isDraggingRef.current = false;
        } else if (pointersRef.current.size === 2) {
            isDraggingRef.current = true;
            const [p1, p2] = Array.from(pointersRef.current.values());
            pinchRef.current = {
                active: true,
                startDist: dist(p1, p2),
                startScale: viewRef.current.scale,
                startOffsetX: viewRef.current.offsetX,
                startOffsetY: viewRef.current.offsetY,
                centerX: (p1.x + p2.x) / 2,
                centerY: (p1.y + p2.y) / 2,
            };
        }
    };

    const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (!pointersRef.current.has(e.pointerId)) return;
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const prev = pointersRef.current.get(e.pointerId)!;
        const next = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        pointersRef.current.set(e.pointerId, next);

        if (pointersRef.current.size === 2 && pinchRef.current.active) {
            isDraggingRef.current = true;
            const [p1, p2] = Array.from(pointersRef.current.values());
            const pinch = pinchRef.current;
            let newScale = pinch.startScale * (dist(p1, p2) / pinch.startDist);
            newScale = Math.min(MAP_CONFIG.maxScale, Math.max(MAP_CONFIG.minScale, newScale));
            const mapAtCenterX = (pinch.centerX + pinch.startOffsetX) / pinch.startScale;
            const mapAtCenterY = (pinch.centerY + pinch.startOffsetY) / pinch.startScale;
            viewRef.current = {
                offsetX: mapAtCenterX * newScale - pinch.centerX,
                offsetY: mapAtCenterY * newScale - pinch.centerY,
                scale: newScale,
            };
            onChange();
        } else if (pointersRef.current.size === 1) {
            if (dragStartRef.current) {
                const moved = Math.hypot(next.x - dragStartRef.current.x, next.y - dragStartRef.current.y);
                if (moved > 4) {
                    isDraggingRef.current = true;
                }
            }
            viewRef.current = {
                ...viewRef.current,
                offsetX: viewRef.current.offsetX - (next.x - prev.x),
                offsetY: viewRef.current.offsetY - (next.y - prev.y),
            };
            onChange();
        }
    };

    const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
        pointersRef.current.delete(e.pointerId);
        if (pointersRef.current.size === 0) {
            dragStartRef.current = null;
        }
        if (pointersRef.current.size < 2) pinchRef.current.active = false;
    };

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const rect = el.getBoundingClientRect();
            const cursorX = e.clientX - rect.left;
            const cursorY = e.clientY - rect.top;
            const { offsetX, offsetY, scale } = viewRef.current;

            // 上回転(奥)で拡大、下回転(手前)で縮小
            const zoomFactor = e.deltaY < 0 ? MAP_CONFIG.wheelZoomFactor : 1 / MAP_CONFIG.wheelZoomFactor;
            const newScale = Math.min(MAP_CONFIG.maxScale, Math.max(MAP_CONFIG.minScale, scale * zoomFactor));
            if (newScale === scale) return;

            // カーソル位置を中心にズーム
            const mapAtCursorX = (cursorX + offsetX) / scale;
            const mapAtCursorY = (cursorY + offsetY) / scale;
            viewRef.current = {
                offsetX: mapAtCursorX * newScale - cursorX,
                offsetY: mapAtCursorY * newScale - cursorY,
                scale: newScale,
            };
            onChange();
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            el.removeEventListener('wheel', handleWheel);
        };
    }, [containerRef, viewRef, onChange]);

    return { handlePointerDown, handlePointerMove, handlePointerUp, isDraggingRef };
}

function CanvasMap() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
    const statsRef = useRef<HTMLDivElement | null>(null);
    const sizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
    const initializedRef = useRef(false);
    const selectedTileRef = useRef<{ x: number; y: number } | null>(null);
    const selectedHudRef = useRef<HTMLDivElement | null>(null);
    const animationFrameRef = useRef<number>(0);
    const animationStartRef = useRef<number>(0);

    const { map_width, map_height, terrain_grid } = sectorData;

    // 初期スケールでマップ中央がcanvas中央に来るようoffsetを設定
    const initView = useCallback(
        (canvasW: number, canvasH: number) => {
            const centerMapX = (map_width / 2) * MAP_CONFIG.tileSize + MAP_CONFIG.tileSize * 0.5;
            const centerMapY = (map_height / 2) * MAP_CONFIG.tileSize + MAP_CONFIG.tileSize * 0.5;
            viewRef.current = {
                offsetX: centerMapX * MAP_CONFIG.initialScale - canvasW / 2,
                offsetY: centerMapY * MAP_CONFIG.initialScale - canvasH / 2,
                scale: MAP_CONFIG.initialScale,
            };
        },
        [map_width, map_height]
    );

    const viewRef = useRef<ViewState>({ offsetX: 0, offsetY: 0, scale: MAP_CONFIG.initialScale });

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const { width, height } = sizeRef.current;
        if (width <= 0 || height <= 0) return;

        ctx.clearRect(0, 0, width, height);
        applyCanvasRenderOptions(ctx, MAP_CONFIG.renderOptions);
        const view = viewRef.current;
        const { colStart, colEnd, rowStart, rowEnd, tileSize } = getVisibleRange(
            view,
            width,
            height,
            map_width,
            map_height
        );

        let count = 0;
        const start = performance.now();

        // オプションに応じたタイル描画サイズを計算
        const renderSize = calcTileRenderSize(tileSize, MAP_CONFIG.renderOptions);

        for (let y = rowStart; y <= rowEnd; y++) {
            for (let x = colStart; x <= colEnd; x++) {
                const cell = terrain_grid[y]?.[x];
                if (!cell) continue;

                const { px, py } = tileToPixel(x, y, view);
                const drawX = px - tileSize / 2;
                const drawY = py - tileSize / 2;

                const imgSrc = TERRAIN_IMAGE_MAP[cell.type];
                const img = imagesRef.current.get(imgSrc);

                if (img && img.complete && img.naturalWidth > 0) {
                    ctx.drawImage(img, drawX, drawY, renderSize, renderSize);
                } else {
                    ctx.fillStyle = MAP_CONFIG.colors.fallbackBg;
                    ctx.fillRect(drawX, drawY, renderSize, renderSize);
                    ctx.strokeStyle = MAP_CONFIG.colors.fallbackBorder;
                    ctx.strokeRect(drawX, drawY, renderSize, renderSize);
                }
                count++;
            }
        }

        // 選択タイルの彗星エフェクト描画
        if (selectedTileRef.current) {
            const { x, y } = selectedTileRef.current;
            const { px, py } = tileToPixel(x, y, view);
            const drawX = px - tileSize / 2;
            const drawY = py - tileSize / 2;
            const now = performance.now();
            const elapsedSinceStart = now - animationStartRef.current;
            const t = (((elapsedSinceStart / MAP_CONFIG.cometAnimation.durationMs) % 1) + 1) % 1;
            drawCometEffect(ctx, t, drawX, drawY, renderSize);
        }

        const elapsed = performance.now() - start;
        if (statsRef.current) {
            statsRef.current.textContent = `描画: ${elapsed.toFixed(2)}ms / マス数: ${count} / 表示領域: ${width}x${height}`;
        }
        if (selectedHudRef.current) {
            if (selectedTileRef.current) {
                selectedHudRef.current.textContent = `選択: (x=${selectedTileRef.current.x}, y=${selectedTileRef.current.y})`;
            } else {
                selectedHudRef.current.textContent = '選択: -';
            }
        }
    }, [map_width, map_height, terrain_grid]);

    const stopCometLoop = useCallback(() => {
        if (animationFrameRef.current !== 0) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = 0;
        }
    }, []);

    const startCometLoop = useCallback(() => {
        stopCometLoop();
        animationStartRef.current = performance.now();

        const loop = () => {
            if (!selectedTileRef.current) return;
            render();
            animationFrameRef.current = requestAnimationFrame(loop);
        };

        animationFrameRef.current = requestAnimationFrame(loop);
    }, [render, stopCometLoop]);

    // アンマウント時のクリーンアップ
    useEffect(() => {
        return () => {
            stopCometLoop();
        };
    }, [stopCometLoop]);

    // Canvasサイズをコンテナに追従させ、初回のみ中央揃えを実行
    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const updateSize = () => {
            const rect = container.getBoundingClientRect();
            const w = Math.min(MAP_CONFIG.maxViewportWidth, Math.max(1, Math.round(rect.width)));
            const h = Math.min(MAP_CONFIG.maxViewportHeight, Math.max(1, Math.round(rect.height)));
            const dpr = window.devicePixelRatio || 1;

            sizeRef.current = { width: w, height: h };
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);

            if (!initializedRef.current) {
                initView(w, h);
                initializedRef.current = true;
            }

            render();
        };

        updateSize();

        const observer = new ResizeObserver(updateSize);
        observer.observe(container);
        return () => {
            observer.disconnect();
        };
    }, [render, initView]);

    // 地形タイプに対応する全画像を事前ロード
    useEffect(() => {
        const map = imagesRef.current;
        for (const src of Object.values(TERRAIN_IMAGE_MAP)) {
            if (map.has(src)) continue;
            const img = new Image();
            img.onload = () => render();
            img.src = src;
            map.set(src, img);
        }
    }, [render]);

    const { handlePointerDown, handlePointerMove, handlePointerUp, isDraggingRef } = usePointerPanZoom(
        containerRef,
        viewRef,
        render
    );

    const onContainerPointerUp = (e: PointerEvent<HTMLDivElement>) => {
        const wasDragging = isDraggingRef.current;
        handlePointerUp(e);

        if (!wasDragging && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            const tile = pixelToTile(clickX, clickY, viewRef.current, map_width, map_height);
            if (tile) {
                selectedTileRef.current = tile;
                startCometLoop();
            }
        }
    };

    return (
        <div className="flex flex-col items-center w-full h-full min-h-0">
            <div ref={statsRef} className="text-[#ffd27a] text-[13px] mb-2 text-center shrink-0">
                描画: -ms / マス数: 0
            </div>
            <div ref={selectedHudRef} className="text-[#ffd27a] text-[13px] mb-2 text-center shrink-0">
                選択: -
            </div>
            <div
                ref={containerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={onContainerPointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: `${MAP_CONFIG.maxViewportWidth}px`,
                    height: '100%',
                    maxHeight: `${MAP_CONFIG.maxViewportHeight}px`,
                    touchAction: 'none',
                    overflow: 'hidden',
                    border: '1px solid #2a3a52',
                    background: '#0e1a2b',
                    boxSizing: 'border-box',
                }}
            >
                <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
            </div>
        </div>
    );
}
