import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { AnimationLoopController } from '../types';

// ============================================================================
// requestAnimationFrame ループを共通化するフック。
// 複数インスタンスを同時に動かせるよう、ループごとに独立したIDを保持する。
// ============================================================================

export function useAnimationLoop(
    onFrame: (nowMs: number, self: AnimationLoopController) => void
): AnimationLoopController {
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

    // onFrame へ渡す自身の controller。次回レンダリングより前にループが開始されても
    // 参照できるよう、effect で最新化して ref で先行保持する。
    const controllerRef = useRef<AnimationLoopController | null>(null);

    const start = useCallback(() => {
        // 二重起動を防ぐため、既存ループを止めてから開始する
        stop();

        const loop = (nowMs: number) => {
            const self = controllerRef.current;
            if (self) callbackRef.current(nowMs, self);
            frameRef.current = requestAnimationFrame(loop);
        };

        frameRef.current = requestAnimationFrame(loop);
    }, [stop]);

    const isRunning = useCallback(() => frameRef.current !== null, []);

    // アンマウント時に必ず停止する
    useEffect(() => stop, [stop]);

    const controller = useMemo(() => ({ start, stop, isRunning }), [start, stop, isRunning]);

    useEffect(() => {
        controllerRef.current = controller;
    }, [controller]);

    return controller;
}
