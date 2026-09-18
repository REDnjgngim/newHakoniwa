import React, { useEffect, useRef, useState, useCallback } from 'react';

const GRID_SIZE = 300;

// --- マス設計パラメータ（固定px） ---
const TILE_SIZE = 32;
const TILE_GAP = 0;
const STEP = TILE_SIZE + TILE_GAP;

const MAX_VIEWPORT_W = 3940;
const MAX_VIEWPORT_H = 2160;
const MARGIN_TILES = 2;

const MIN_SCALE = 0.1;
const MAX_SCALE = 10;

// assets 内の画像（land*.gif, hero.pngなど）を一括ロード
const imageModules = import.meta.glob<{ default: string }>('./assets/*.gif', { eager: true });
const TILE_IMAGE_SRCS: string[] = Object.values(imageModules).map((mod) => mod.default);

// 座標 (x, y) ごとに一貫したランダムな画像インデックスを返す
// （スクロールやドラッグしてもマスの絵柄が変わらないようにする決定論的ハッシュ）
function getTileImageIndex(x: number, y: number, total: number): number {
    if (total <= 0) return 0;
    const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return Math.floor((hash - Math.floor(hash)) * total);
}

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

interface TileItem {
    key: string;
    px: number;
    py: number;
    size: number;
    imageSrc: string;
}

export default function HexMapPreview() {
    const [mode, setMode] = useState<'canvas' | 'dom'>('canvas');

    return (
        <div
            style={{
                width: '100%',
                height: '100vh',
                background: '#0e1a2b',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '12px',
                boxSizing: 'border-box',
                fontFamily: 'sans-serif',
                overflow: 'hidden',
            }}
        >
            <div style={{ marginBottom: '8px', display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                    onClick={() => setMode('canvas')}
                    style={{
                        padding: '6px 16px',
                        borderRadius: '4px',
                        border: '1px solid #2a3a52',
                        background: mode === 'canvas' ? '#2E6DA4' : 'transparent',
                        color: '#fff',
                        cursor: 'pointer',
                    }}
                >
                    Canvas版
                </button>
                <button
                    onClick={() => setMode('dom')}
                    style={{
                        padding: '6px 16px',
                        borderRadius: '4px',
                        border: '1px solid #2a3a52',
                        background: mode === 'dom' ? '#2E6DA4' : 'transparent',
                        color: '#fff',
                        cursor: 'pointer',
                    }}
                >
                    DOM版
                </button>
            </div>

            <div
                style={{
                    flex: 1,
                    width: '100%',
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                {mode === 'canvas' ? <CanvasMap /> : <DomMap />}
            </div>
        </div>
    );
}

// ============================================================
// 共通の座標変換（Canvas版・DOM版どちらもこれを使う）
// ============================================================
function tileToPixel(x: number, y: number, view: ViewState) {
    const { offsetX, offsetY, scale } = view;
    const rowOffset = y % 2 === 1 ? STEP / 2 : 0;
    const mapPx = x * STEP + rowOffset + STEP * 0.5;
    const mapPy = y * STEP + STEP * 0.5;
    return { px: mapPx * scale - offsetX, py: mapPy * scale - offsetY };
}

function getVisibleRange(view: ViewState, width: number, height: number): TileRange {
    const { offsetX, offsetY, scale } = view;
    const tileSize = STEP * scale;
    const firstCol = Math.floor(offsetX / tileSize) - MARGIN_TILES;
    const lastCol = Math.ceil((offsetX + width) / tileSize) + MARGIN_TILES;
    const firstRow = Math.floor(offsetY / tileSize) - MARGIN_TILES;
    const lastRow = Math.ceil((offsetY + height) / tileSize) + MARGIN_TILES;
    return {
        colStart: Math.max(0, firstCol),
        colEnd: Math.min(GRID_SIZE - 1, lastCol),
        rowStart: Math.max(0, firstRow),
        rowEnd: Math.min(GRID_SIZE - 1, lastRow),
        tileSize,
    };
}

function computeDomTiles(view: ViewState, width: number, height: number): { tiles: TileItem[]; renderMs: number } {
    const { colStart, colEnd, rowStart, rowEnd, tileSize } = getVisibleRange(view, width, height);
    const start = performance.now();
    const next: TileItem[] = [];
    for (let y = rowStart; y <= rowEnd; y++) {
        for (let x = colStart; x <= colEnd; x++) {
            const { px, py } = tileToPixel(x, y, view);
            const imgIdx = getTileImageIndex(x, y, TILE_IMAGE_SRCS.length);
            next.push({
                key: `${x}_${y}`,
                px: px - tileSize / 2,
                py: py - tileSize / 2,
                size: tileSize,
                imageSrc: TILE_IMAGE_SRCS[imgIdx] || '',
            });
        }
    }
    return {
        tiles: next,
        renderMs: performance.now() - start,
    };
}

// ============================================================
// 共通のポインター操作フック（ドラッグ+ピンチ）
// ============================================================
function usePointerPanZoom(
    containerRef: React.RefObject<HTMLDivElement | null>,
    viewRef: React.MutableRefObject<ViewState>,
    onChange: () => void
) {
    const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
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

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        pointersRef.current.set(e.pointerId, { x: e.clientX - rect.left, y: e.clientY - rect.top });
        if (pointersRef.current.size === 2) {
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

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!pointersRef.current.has(e.pointerId)) return;
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const prev = pointersRef.current.get(e.pointerId)!;
        const next = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        pointersRef.current.set(e.pointerId, next);

        if (pointersRef.current.size === 2 && pinchRef.current.active) {
            const [p1, p2] = Array.from(pointersRef.current.values());
            const newDist = dist(p1, p2);
            const pinch = pinchRef.current;
            let newScale = pinch.startScale * (newDist / pinch.startDist);
            newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
            const mapAtCenterX = (pinch.centerX + pinch.startOffsetX) / pinch.startScale;
            const mapAtCenterY = (pinch.centerY + pinch.startOffsetY) / pinch.startScale;
            const newOffsetX = mapAtCenterX * newScale - pinch.centerX;
            const newOffsetY = mapAtCenterY * newScale - pinch.centerY;
            viewRef.current = { offsetX: newOffsetX, offsetY: newOffsetY, scale: newScale };
            onChange();
        } else if (pointersRef.current.size === 1) {
            const dx = next.x - prev.x;
            const dy = next.y - prev.y;
            viewRef.current = {
                ...viewRef.current,
                offsetX: viewRef.current.offsetX - dx,
                offsetY: viewRef.current.offsetY - dy,
            };
            onChange();
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        pointersRef.current.delete(e.pointerId);
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
            const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
            let newScale = scale * zoomFactor;
            newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));

            if (newScale === scale) return;

            // カーソルの指すマップ位置を中心にしてズーム
            const mapAtCursorX = (cursorX + offsetX) / scale;
            const mapAtCursorY = (cursorY + offsetY) / scale;

            const newOffsetX = mapAtCursorX * newScale - cursorX;
            const newOffsetY = mapAtCursorY * newScale - cursorY;

            viewRef.current = {
                offsetX: newOffsetX,
                offsetY: newOffsetY,
                scale: newScale,
            };

            onChange();
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            el.removeEventListener('wheel', handleWheel);
        };
    }, [containerRef, viewRef, onChange]);

    return { handlePointerDown, handlePointerMove, handlePointerUp };
}

// ============================================================
// Canvas版
// ============================================================
function CanvasMap() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const imagesRef = useRef<HTMLImageElement[]>([]);
    const statsRef = useRef<HTMLDivElement | null>(null);
    const sizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

    const viewRef = useRef<ViewState>({ offsetX: 0, offsetY: 0, scale: 1.0 });

    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const { width, height } = sizeRef.current;
        if (width <= 0 || height <= 0) return;

        ctx.clearRect(0, 0, width, height);
        const view = viewRef.current;
        const { colStart, colEnd, rowStart, rowEnd, tileSize } = getVisibleRange(view, width, height);

        const images = imagesRef.current;
        let count = 0;
        const start = performance.now();
        for (let y = rowStart; y <= rowEnd; y++) {
            for (let x = colStart; x <= colEnd; x++) {
                const { px, py } = tileToPixel(x, y, view);
                const drawX = px - tileSize / 2;
                const drawY = py - tileSize / 2;

                const imgIdx = getTileImageIndex(x, y, images.length);
                const img = images[imgIdx];

                if (img && img.complete && img.naturalWidth > 0) {
                    ctx.drawImage(img, drawX, drawY, tileSize, tileSize);
                } else {
                    ctx.fillStyle = '#18324f';
                    ctx.fillRect(drawX, drawY, tileSize, tileSize);
                    ctx.strokeStyle = '#2e5b88';
                    ctx.strokeRect(drawX, drawY, tileSize, tileSize);
                }
                count++;
            }
        }
        const elapsed = performance.now() - start;
        if (statsRef.current) {
            statsRef.current.textContent = `[Canvas] 描画: ${elapsed.toFixed(2)}ms / マス数: ${count} / 表示領域: ${width}x${height} (最大: ${MAX_VIEWPORT_W}x${MAX_VIEWPORT_H})`;
        }
    }, []);

    // ResizeObserver でコンテナのサイズに自動追従（上限: MAX_VIEWPORT_W x MAX_VIEWPORT_H）
    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const updateSize = () => {
            const rect = container.getBoundingClientRect();
            const w = Math.min(MAX_VIEWPORT_W, Math.max(1, Math.round(rect.width)));
            const h = Math.min(MAX_VIEWPORT_H, Math.max(1, Math.round(rect.height)));
            const dpr = window.devicePixelRatio || 1;

            sizeRef.current = { width: w, height: h };
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);

            render();
        };

        updateSize();

        const observer = new ResizeObserver(() => {
            updateSize();
        });
        observer.observe(container);

        return () => {
            observer.disconnect();
        };
    }, [render]);

    useEffect(() => {
        // 画像を一括ロード
        const imgs = TILE_IMAGE_SRCS.map((src) => {
            const img = new Image();
            img.onload = () => render();
            img.src = src;
            return img;
        });
        imagesRef.current = imgs;
    }, [render]);

    const { handlePointerDown, handlePointerMove, handlePointerUp } = usePointerPanZoom(containerRef, viewRef, render);

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minHeight: 0,
            }}
        >
            <div
                ref={statsRef}
                style={{ color: '#ffd27a', fontSize: '13px', marginBottom: '8px', textAlign: 'center', flexShrink: 0 }}
            >
                [Canvas] 描画: -ms / マス数: 0
            </div>
            <div
                ref={containerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: `${MAX_VIEWPORT_W}px`,
                    height: '100%',
                    maxHeight: `${MAX_VIEWPORT_H}px`,
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

// ============================================================
// DOM版：可視範囲のマスだけ<div>を生成して背景画像を敷く
// ============================================================
function DomMap() {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const viewRef = useRef<ViewState>({ offsetX: 0, offsetY: 0, scale: 1.0 });
    const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const [tilesData, setTilesData] = useState<{ tiles: TileItem[]; renderMs: number }>({ tiles: [], renderMs: 0 });

    const render = useCallback(() => {
        const { width, height } = size;
        if (width <= 0 || height <= 0) return;
        const res = computeDomTiles(viewRef.current, width, height);
        setTilesData(res);
    }, [size]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateSize = () => {
            const rect = container.getBoundingClientRect();
            const w = Math.min(MAX_VIEWPORT_W, Math.max(1, Math.round(rect.width)));
            const h = Math.min(MAX_VIEWPORT_H, Math.max(1, Math.round(rect.height)));
            setSize({ width: w, height: h });
        };

        updateSize();

        const observer = new ResizeObserver(() => {
            updateSize();
        });
        observer.observe(container);

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (size.width > 0 && size.height > 0) {
            render();
        }
    }, [size, render]);

    const { handlePointerDown, handlePointerMove, handlePointerUp } = usePointerPanZoom(containerRef, viewRef, render);

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minHeight: 0,
            }}
        >
            <div
                style={{ color: '#ffd27a', fontSize: '13px', marginBottom: '8px', textAlign: 'center', flexShrink: 0 }}
            >
                [DOM] 座標計算: {tilesData.renderMs.toFixed(2)}ms / DOM要素数: {tilesData.tiles.length} / 表示領域:{' '}
                {size.width}x{size.height} (最大: {MAX_VIEWPORT_W}x{MAX_VIEWPORT_H})
                <br />
                <span style={{ color: '#5a7396', fontSize: '11px' }}>
                    ※これはdiv生成の座標計算のみの時間。実際のDOM反映・レイアウトコストは含まれません
                </span>
            </div>
            <div
                ref={containerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: `${MAX_VIEWPORT_W}px`,
                    height: '100%',
                    maxHeight: `${MAX_VIEWPORT_H}px`,
                    touchAction: 'none',
                    overflow: 'hidden',
                    border: '1px solid #2a3a52',
                    background: '#0e1a2b',
                    boxSizing: 'border-box',
                }}
            >
                {tilesData.tiles.map((t) => (
                    <div
                        key={t.key}
                        style={{
                            position: 'absolute',
                            left: t.px,
                            top: t.py,
                            width: t.size,
                            height: t.size,
                            backgroundColor: '#18324f',
                            backgroundImage: t.imageSrc ? `url(${t.imageSrc})` : undefined,
                            backgroundSize: 'cover',
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
