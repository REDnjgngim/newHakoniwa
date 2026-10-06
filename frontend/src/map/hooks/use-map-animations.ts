import { useCallback, type RefObject } from 'react';
import type { AnimationLoopController, HoverState, TileCoord } from '../types';
import { useAnimationLoop } from './use-animation-loop';

// ============================================================================
// 選択演出のパルス（cursorLoop）とホバーのフェード（hoverFadeLoop）の2本の
// rAF ループをまとめて提供するフック。ホバー変化時の切り替え
// （handleHoverChange）も担い、呼び出し側の loop ref + 同期 useEffect を不要にする。
// ============================================================================

export interface MapAnimationsParams {
    selectedTileRef: RefObject<TileCoord | null>;
    hoverFadeStartRef: RefObject<number>;
    hoverStateRef: RefObject<HoverState>;
    fadeDurationMs: number;
    renderOverlay: () => void;
}

export interface MapAnimationsResult {
    cursorLoop: AnimationLoopController;
    hoverFadeLoop: AnimationLoopController;
    handleHoverChange: () => void;
}

export function useMapAnimations(params: MapAnimationsParams): MapAnimationsResult {
    const { selectedTileRef, hoverFadeStartRef, hoverStateRef, fadeDurationMs, renderOverlay } = params;

    // 選択演出のパルス: 選択が外れたらループを止める
    const cursorLoop = useAnimationLoop(
        useCallback(
            (_nowMs: number, self: AnimationLoopController) => {
                if (!selectedTileRef.current) {
                    self.stop();
                    return;
                }
                renderOverlay();
            },
            [selectedTileRef, renderOverlay]
        )
    );

    // ホバーのフェード: フェード完了時に最後の描画をしてからループを止める
    const hoverFadeLoop = useAnimationLoop(
        useCallback(
            (nowMs: number, self: AnimationLoopController) => {
                if (nowMs - hoverFadeStartRef.current >= fadeDurationMs) {
                    self.stop();
                    renderOverlay();
                    return;
                }
                renderOverlay();
            },
            [hoverFadeStartRef, renderOverlay, fadeDurationMs]
        )
    );

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
    }, [hoverStateRef, hoverFadeStartRef, renderOverlay, hoverFadeLoop]);

    return { cursorLoop, hoverFadeLoop, handleHoverChange };
}
