import { useCallback, useEffect, useRef, useState } from 'react';
import type { HoverCell, PopupPosition, PopupState, UsePopupStateParams, UsePopupStateResult } from '../engine/types';
import { calculatePopupPosition, tileToPixel } from '../engine/geometry';

export function usePopupState({
    terrain_grid,
    viewRef,
    baseTileSize,
    containerSizeRef,
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

    const popupPosition: PopupPosition =
        popup !== null
            ? (() => {
                  const containerSize = containerSizeRef.current;
                  const { px, py } = tileToPixel(popup.coord.x, popup.coord.y, viewRef.current, baseTileSize);
                  const containerWidth = containerSize.width > 0 ? containerSize.width : 480 + 16;
                  const containerHeight = containerSize.height > 0 ? containerSize.height : 0;
                  // popup height unknown; pass a reasonable default (60) for clamping
                  return calculatePopupPosition(
                      px,
                      py,
                      480,
                      60,
                      containerWidth,
                      containerHeight > 0 ? containerHeight : 9999
                  );
              })()
            : { x: 8, y: 8 };

    return { popup, popupPosition, onCellHovered, onViewChange };
}
