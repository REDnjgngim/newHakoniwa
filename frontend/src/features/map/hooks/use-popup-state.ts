import { useCallback, useEffect, useRef, useState } from 'react';
import type { HoverCell, PopupPosition, PopupState, UsePopupStateParams, UsePopupStateResult } from '../engine/types';
import { tileToPixel } from '../engine/geometry';

export function usePopupState({
    terrain_grid,
    viewRef,
    baseTileSize,
    fadeOutDelayMs = 150,
    viewChangeDebounceMs = 100,
}: UsePopupStateParams): UsePopupStateResult {
    const [popup, setPopup] = useState<PopupState | null>(null);
    const fadeTimerRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);
    const viewChangeTimerRef = useRef<number | null>(null);

    const clearFadeTimer = useCallback(() => {
        if (fadeTimerRef.current !== null) {
            window.clearTimeout(fadeTimerRef.current);
            fadeTimerRef.current = null;
        }
    }, []);

    const clearRaf = useCallback(() => {
        if (rafRef.current !== null) {
            window.cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }, []);

    const clearViewChangeTimer = useCallback(() => {
        if (viewChangeTimerRef.current !== null) {
            window.clearTimeout(viewChangeTimerRef.current);
            viewChangeTimerRef.current = null;
        }
    }, []);

    const onCellHovered = useCallback(
        (cell: HoverCell | null) => {
            if (cell) {
                const terrainCell = terrain_grid[cell.y]?.[cell.x];
                if (terrainCell) {
                    clearFadeTimer();
                    clearRaf();
                    setPopup({ coord: cell, cell: terrainCell, visible: false });
                    rafRef.current = window.requestAnimationFrame(() => {
                        setPopup((prev) => (prev ? { ...prev, visible: true } : prev));
                    });
                }
            } else {
                clearFadeTimer();
                setPopup((prev) => (prev ? { ...prev, visible: false } : null));
                fadeTimerRef.current = window.setTimeout(() => {
                    setPopup(null);
                }, fadeOutDelayMs);
            }
        },
        [terrain_grid, fadeOutDelayMs, clearFadeTimer, clearRaf]
    );

    const onViewChange = useCallback(() => {
        clearViewChangeTimer();
        viewChangeTimerRef.current = window.setTimeout(() => {
            setPopup((prev) => (prev ? { ...prev } : prev));
        }, viewChangeDebounceMs);
    }, [viewChangeDebounceMs, clearViewChangeTimer]);

    useEffect(() => {
        return () => {
            clearFadeTimer();
            clearRaf();
            clearViewChangeTimer();
        };
    }, [clearFadeTimer, clearRaf, clearViewChangeTimer]);

    const anchorPosition: PopupPosition =
        popup !== null
            ? (() => {
                  const { px, py } = tileToPixel(popup.coord.x, popup.coord.y, viewRef.current, baseTileSize);
                  return { x: px, y: py };
              })()
            : { x: 0, y: 0 };

    return { popup, anchorPosition, onCellHovered, onViewChange };
}
