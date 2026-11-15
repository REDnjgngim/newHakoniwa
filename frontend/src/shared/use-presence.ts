import { useEffect, useState } from 'react';
import type { Presence, UsePresenceOptions } from './presence-types';

/**
 * 対象値の出現（次フレームで visible=true）と消滅（visible=false 後に遅延アンマウント）を管理するフック。
 * - null → 値: visible=false でマウントし、次フレームで visible=true にする
 * - 値(k1) → 値(k2): 内容を差し替えて visible=false から入場し直す
 * - 値(k1) → 値(k1): 最新の値を返し、表示状態は維持する
 * - 値 → null: 即座に visible=false にし、exitDurationMs 後に null に戻す
 */
export function usePresence<T>(value: T | null, { getKey, exitDurationMs }: UsePresenceOptions<T>): Presence<T> | null {
    const [state, setState] = useState<Presence<T> | null>(null);
    const nextKey = value === null ? null : getKey(value);

    // 対象の切り替え・消去は描画中に反映し、内容と表示状態がずれたフレームを作らない
    if (value !== null && nextKey !== null && (state === null || state.key !== nextKey)) {
        setState({ item: value, key: nextKey, visible: false });
    } else if (value === null && state !== null && state.visible) {
        setState({ ...state, visible: false });
    }

    const isEntering = state !== null && state.key === nextKey && !state.visible;
    useEffect(() => {
        if (!isEntering) return;
        // 非表示の状態を1フレーム描画してから表示に切り替え、CSS トランジションを発火させる
        const id = window.requestAnimationFrame(() => {
            setState((prev) => (prev && prev.key === nextKey ? { ...prev, visible: true } : prev));
        });
        return () => window.cancelAnimationFrame(id);
    }, [isEntering, nextKey]);

    const isExiting = value === null && state !== null;
    useEffect(() => {
        if (!isExiting) return;
        const id = window.setTimeout(() => setState(null), exitDurationMs);
        return () => window.clearTimeout(id);
    }, [isExiting, exitDurationMs]);

    // 同じ key の間は最新の値を返し、位置などの更新をすぐ反映する
    if (state !== null && value !== null && state.key === nextKey) {
        return { ...state, item: value };
    }
    return state;
}
