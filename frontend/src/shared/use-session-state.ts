import { useCallback, useState } from 'react';

// ============================================================================
// sessionStorage と連動して boolean 値を保持するフック。
// 同一セッション（タブが開いている間・リロード時）は値を保持し、
// タブ終了などのページ離脱でリセットされる。
// SSR や sessionStorage へのアクセス不可時はメモリ上の state のみにフォールバックする。
// ============================================================================

type BooleanUpdater = boolean | ((prev: boolean) => boolean);

function readSessionValue(key: string, defaultValue: boolean): boolean {
    try {
        if (typeof window === 'undefined' || !window.sessionStorage) return defaultValue;
        const raw = window.sessionStorage.getItem(key);
        if (raw === null) return defaultValue;
        // JSON 形式 ("true" / "false") と旧来の "1" / "0" の両方を受け付ける
        if (raw === '1') return true;
        if (raw === '0') return false;
        return raw === 'true' ? true : raw === 'false' ? false : defaultValue;
    } catch {
        return defaultValue;
    }
}

function writeSessionValue(key: string, value: boolean): void {
    try {
        if (typeof window === 'undefined' || !window.sessionStorage) return;
        window.sessionStorage.setItem(key, value ? 'true' : 'false');
    } catch {
        // プライベートモードの例外等では保存を諦めてメモリ上の state のみ使う
    }
}

export function useSessionState(key: string, defaultValue: boolean): [boolean, (value: BooleanUpdater) => void] {
    const [value, setValue] = useState<boolean>(() => readSessionValue(key, defaultValue));

    const setSessionValue = useCallback(
        (updater: BooleanUpdater) => {
            setValue((prev) => {
                const next = typeof updater === 'function' ? updater(prev) : updater;
                writeSessionValue(key, next);
                return next;
            });
        },
        [key]
    );

    return [value, setSessionValue];
}
