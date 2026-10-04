import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { AnimationLoopController } from '../types';

// ============================================================================
// requestAnimationFrame ループを共通化するフック。
// 複数インスタンスを同時に動かせるよう、ループごとに独立したIDを保持する。
// ============================================================================

export function useAnimationLoop(onFrame: (nowMs: number) => void): AnimationLoopController {
    const frameRef = useRef<number | null>(null);
    // rAFのコールバックはEffect外から呼ばれるため、useEffectEventではなくrefで最新化する
    const callbackRef = useRef(onFrame);

    // ループ実行中に最新のコールバックを参照できるよう、毎レンダリング後に差し替える
    useEffect(() => {
        callbackRef.current = onFrame;
    });

    const stop = useCallback(() => {
        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
    }, []);

    const start = useCallback(() => {
        // 二重起動を防ぐため、既存ループを止めてから開始する
        stop();

        const loop = (nowMs: number) => {
            callbackRef.current(nowMs);
            frameRef.current = requestAnimationFrame(loop);
        };

        frameRef.current = requestAnimationFrame(loop);
    }, [stop]);

    const isRunning = useCallback(() => frameRef.current !== null, []);

    // アンマウント時に必ず停止する
    useEffect(() => stop, [stop]);

    return useMemo(() => ({ start, stop, isRunning }), [start, stop, isRunning]);
}
