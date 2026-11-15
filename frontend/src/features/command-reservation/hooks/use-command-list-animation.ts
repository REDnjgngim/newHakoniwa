import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { ExitingCommandItem, ReservationCommand } from '../types';

const INSERT_DURATION_MS = 150;
const FLIP_DURATION_MS = 150;
const EXIT_DURATION_MS = 150;
const EXIT_CLEANUP_BUFFER_MS = 40;
const SLIDE_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

export type UseCommandListAnimationOptions = {
    commands: ReservationCommand[];
    listContainerRef: RefObject<HTMLDivElement | null>;
    viewportRef?: RefObject<HTMLDivElement | null>;
    /** 並び替えドラッグ・着地アニメーション中は true を渡し、FLIP の二重発火を抑止する */
    isReorderActive?: boolean;
};

export type UseCommandListAnimationReturn = {
    visibleExitingItems: ExitingCommandItem[];
    minContainerHeight: number | undefined;
    setRowRef: (id: string, el: HTMLDivElement | null) => void;
    setItemRef: (id: string, el: HTMLDivElement | null) => void;
    setExitingRef: (id: string, el: HTMLDivElement | null) => void;
};

function getComputedTranslateY(el: HTMLElement): number {
    if (typeof DOMMatrix === 'undefined') return 0;
    const transform = window.getComputedStyle(el).transform;
    if (!transform || transform === 'none') return 0;
    const matrix = new DOMMatrix(transform);
    return Number.isFinite(matrix.m42) ? matrix.m42 : 0;
}

/**
 * コマンドリストの挿入（左→右スライドイン）、削除・履歴巻き戻し時の退場（縮小フェードアウト）、
 * および位置入れ替え・詰め（FLIP）アニメーションを制御するフック。
 */
export function useCommandListAnimation({
    commands,
    listContainerRef,
    viewportRef,
    isReorderActive = false,
}: UseCommandListAnimationOptions): UseCommandListAnimationReturn {
    const rowMapRef = useRef<Map<string, HTMLDivElement>>(new Map());
    const itemMapRef = useRef<Map<string, HTMLDivElement>>(new Map());
    const exitingMapRef = useRef<Map<string, HTMLDivElement>>(new Map());

    const prevSnapshotsRef = useRef<Map<string, ExitingCommandItem>>(new Map());
    const flipAnimationsRef = useRef<Map<string, Animation>>(new Map());
    const prevCommandIdsRef = useRef<Set<string>>(new Set());
    const isInitializedRef = useRef<boolean>(false);
    const prevIsReorderActiveRef = useRef<boolean>(false);

    const exitTimersRef = useRef<Map<string, number>>(new Map());
    const exitingStartedIdsRef = useRef<Set<string>>(new Set());
    const [exitingItems, setExitingItems] = useState<ExitingCommandItem[]>([]);

    const removeExitingItem = useCallback((id: string) => {
        const timerId = exitTimersRef.current.get(id);
        if (timerId !== undefined) {
            window.clearTimeout(timerId);
            exitTimersRef.current.delete(id);
        }
        exitingStartedIdsRef.current.delete(id);
        setExitingItems((prev) => prev.filter((item) => item.command.id !== id));
    }, []);

    const setRowRef = useCallback((id: string, el: HTMLDivElement | null) => {
        if (el) {
            rowMapRef.current.set(id, el);
        } else {
            rowMapRef.current.delete(id);
        }
    }, []);

    const setItemRef = useCallback((id: string, el: HTMLDivElement | null) => {
        if (el) {
            itemMapRef.current.set(id, el);
        } else {
            itemMapRef.current.delete(id);
        }
    }, []);

    const setExitingRef = useCallback((id: string, el: HTMLDivElement | null) => {
        if (el) {
            exitingMapRef.current.set(id, el);
        } else {
            exitingMapRef.current.delete(id);
        }
    }, []);

    // 退場検出と新規挿入のスライドインアニメーション
    useLayoutEffect(() => {
        const activeIds = new Set(commands.map((c) => c.id));

        if (!isInitializedRef.current) {
            prevCommandIdsRef.current = activeIds;
            isInitializedRef.current = true;
            return;
        }

        // 削除または履歴操作（Undo/Redo）でリストから消えたコマンドを退場アニメーションへ登録
        const newlyExited: ExitingCommandItem[] = [];
        prevSnapshotsRef.current.forEach((snapshot, id) => {
            if (activeIds.has(id)) return;
            const existingTimer = exitTimersRef.current.get(id);
            if (existingTimer !== undefined) {
                window.clearTimeout(existingTimer);
            }
            exitingStartedIdsRef.current.delete(id);
            const timerId = window.setTimeout(() => {
                removeExitingItem(id);
            }, EXIT_DURATION_MS + EXIT_CLEANUP_BUFFER_MS);
            exitTimersRef.current.set(id, timerId);
            newlyExited.push(snapshot);
        });

        if (newlyExited.length > 0) {
            const newlyExitedIds = new Set(newlyExited.map((item) => item.command.id));
            // ペイント前に退場要素を同期描画してチラつきを防ぐため useLayoutEffect 内で更新する
            // eslint-disable-next-line @eslint-react/set-state-in-effect
            setExitingItems((prev) => [...prev.filter((item) => !newlyExitedIds.has(item.command.id)), ...newlyExited]);
        }

        const prevIds = prevCommandIdsRef.current;
        let hasNewInsertion = false;
        commands.forEach((cmd) => {
            if (prevIds.has(cmd.id)) return;
            hasNewInsertion = true;
            const el = itemMapRef.current.get(cmd.id);
            if (!el || typeof el.animate !== 'function') return;
            el.animate(
                [
                    { transform: 'translateX(-100%)', opacity: 0 },
                    { transform: 'translateX(0)', opacity: 1 },
                ],
                {
                    duration: INSERT_DURATION_MS,
                    easing: SLIDE_EASING,
                }
            );
        });

        if (hasNewInsertion) {
            const viewport = viewportRef?.current;
            if (viewport && viewport.scrollHeight > viewport.clientHeight) {
                if (typeof viewport.scrollTo === 'function') {
                    viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
                } else {
                    viewport.scrollTop = viewport.scrollHeight;
                }
            }
        }

        prevCommandIdsRef.current = activeIds;
    }, [commands, removeExitingItem, viewportRef]);

    // 位置変化の FLIP アニメーションと直前座標スナップショット更新
    useLayoutEffect(() => {
        const skipFlip = isReorderActive || prevIsReorderActiveRef.current;
        prevIsReorderActiveRef.current = isReorderActive;

        const container = listContainerRef.current;
        const containerRect = container ? container.getBoundingClientRect() : null;
        const nextSnapshots = new Map<string, ExitingCommandItem>();

        commands.forEach((cmd, index) => {
            const el = rowMapRef.current.get(cmd.id);
            if (!el || !containerRect) {
                const prev = prevSnapshotsRef.current.get(cmd.id);
                nextSnapshots.set(cmd.id, {
                    command: cmd,
                    displayOrder: index + 1,
                    top: prev?.top ?? 0,
                    height: prev?.height ?? 0,
                });
                return;
            }

            const existingAnim = flipAnimationsRef.current.get(cmd.id);
            let currentTranslateY = 0;
            if (existingAnim) {
                currentTranslateY = getComputedTranslateY(el);
                existingAnim.cancel();
                flipAnimationsRef.current.delete(cmd.id);
            }

            const rowRect = el.getBoundingClientRect();
            const nextTop = rowRect.top - containerRect.top;
            const prevSnapshot = prevSnapshotsRef.current.get(cmd.id);

            if (!skipFlip && prevSnapshot !== undefined) {
                const deltaY = prevSnapshot.top + currentTranslateY - nextTop;
                if (Math.abs(deltaY) >= 0.5 && typeof el.animate === 'function') {
                    const anim = el.animate(
                        [{ transform: `translateY(${deltaY}px)` }, { transform: 'translateY(0)' }],
                        {
                            duration: FLIP_DURATION_MS,
                            easing: SLIDE_EASING,
                        }
                    );
                    flipAnimationsRef.current.set(cmd.id, anim);
                    anim.onfinish = () => {
                        if (flipAnimationsRef.current.get(cmd.id) === anim) {
                            flipAnimationsRef.current.delete(cmd.id);
                        }
                    };
                }
            }

            nextSnapshots.set(cmd.id, {
                command: cmd,
                displayOrder: index + 1,
                top: nextTop,
                height: rowRect.height,
            });
        });

        prevSnapshotsRef.current = nextSnapshots;
    }, [commands, isReorderActive, listContainerRef]);

    // 退場中アイテムの縮小フェードアウトアニメーション開始
    useLayoutEffect(() => {
        exitingItems.forEach((item) => {
            const id = item.command.id;
            if (exitingStartedIdsRef.current.has(id)) return;
            const el = exitingMapRef.current.get(id);
            if (!el) return;
            exitingStartedIdsRef.current.add(id);

            if (typeof el.animate !== 'function') return;
            const anim = el.animate(
                [
                    { transform: 'scale(1)', opacity: 1 },
                    { transform: 'scale(0.78)', opacity: 0 },
                ],
                {
                    duration: EXIT_DURATION_MS,
                    easing: 'ease-in',
                    fill: 'forwards',
                }
            );
            anim.onfinish = () => {
                removeExitingItem(id);
            };
        });
    }, [exitingItems, removeExitingItem]);

    useEffect(() => {
        const timers = exitTimersRef.current;
        const anims = flipAnimationsRef.current;
        return () => {
            timers.forEach((timerId) => window.clearTimeout(timerId));
            timers.clear();
            anims.forEach((anim) => anim.cancel());
            anims.clear();
        };
    }, []);

    const visibleExitingItems = useMemo(() => {
        const activeIds = new Set(commands.map((c) => c.id));
        return exitingItems.filter((item) => !activeIds.has(item.command.id));
    }, [commands, exitingItems]);

    const minContainerHeight = useMemo(() => {
        if (visibleExitingItems.length === 0) return undefined;
        return Math.max(...visibleExitingItems.map((item) => item.top + item.height));
    }, [visibleExitingItems]);

    return {
        visibleExitingItems,
        minContainerHeight,
        setRowRef,
        setItemRef,
        setExitingRef,
    };
}
