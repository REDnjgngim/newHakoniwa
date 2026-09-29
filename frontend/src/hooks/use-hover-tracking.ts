import { useCallback, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

// ============================================================================
// マウス/ペン/タッチの違いを吸収し、「今どのセルをホバーしているか」の状態管理と
// イベントハンドラの生成をまとめて提供する。
// ホバー状態の ref は呼び出し側（描画側）が保持し、このフックに渡す。
// 描画側はその ref を読むだけでよく、ホバー位置が変化したときだけ
// onHoverChange（再描画トリガー）が呼ばれる。
// ============================================================================

// ホバー対象のセル座標（マス座標）
export interface HoverCell {
    x: number;
    y: number;
}

// ホバー中の状態。未ホバー時は x / y に null が入る
export interface HoverState {
    x: number | null;
    y: number | null;
}

// ポインターイベントの要素内ローカル座標（CSS px）
export interface PointerLocalPosition {
    x: number;
    y: number;
}

// クライアント座標を要素内ローカル座標へ変換（PointerEvent / MouseEvent / Touch いずれでも使える）
export function getPointerLocalPosition(
    event: { clientX: number; clientY: number },
    element: HTMLElement
): PointerLocalPosition {
    const rect = element.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

// ホバーを常時追跡できるポインターか（マウス・ペン）。タッチは追跡できないためタップで代用する
function isHoverCapablePointer(event: { pointerType: string }): boolean {
    return event.pointerType !== 'touch';
}

export interface UseHoverTrackingResult<E extends HTMLElement> {
    // ホバー状態を設定する（同一セルなら再描画しない）
    setHover: (next: HoverState) => void;
    // ホバーを解除する
    clearHover: () => void;
    // 指定セルがホバー中かどうか
    isHoveredCell: (cell: HoverCell | null) => boolean;
    // イベント位置をセル座標へ変換する（範囲外は null）
    resolveEventCell: (event: ReactPointerEvent<E>) => HoverCell | null;
    // pointermove 用: ホバー位置をポインターに追従させる（タッチでは何もしない）
    handlePointerMoveForHover: (event: ReactPointerEvent<E>) => void;
    // pointerleave 用: ホバーを解除する（タッチでは解除しない）
    handlePointerLeaveForHover: (event?: ReactPointerEvent<E>) => void;
    // pointerup 用: ホバー中と同一セルなら onConfirm、別セルならホバー移動のみ
    handleTapForHover: (event: ReactPointerEvent<E>, onConfirm: (cell: HoverCell) => void) => void;
}

// ホバー追跡フック本体
// hoverRef: ホバー状態を保持するref（描画側と共有するため呼び出し側が生成したものを渡す）
export function useHoverTracking<E extends HTMLElement>(
    hoverRef: RefObject<HoverState>,
    containerRef: RefObject<E | null>,
    resolveCell: (localX: number, localY: number) => HoverCell | null,
    onHoverChange: () => void
): UseHoverTrackingResult<E> {
    const setHover = useCallback(
        (next: HoverState) => {
            const prev = hoverRef.current;
            // pointermove は毎回発火するため、変化がなければ再描画を促さない
            if (prev.x === next.x && prev.y === next.y) return;
            hoverRef.current = next;
            onHoverChange();
        },
        [hoverRef, onHoverChange]
    );

    const clearHover = useCallback(() => {
        setHover({ x: null, y: null });
    }, [setHover]);

    const isHoveredCell = useCallback(
        (cell: HoverCell | null): boolean => {
            if (!cell) return false;
            const hover = hoverRef.current;
            return hover.x === cell.x && hover.y === cell.y;
        },
        [hoverRef]
    );

    const resolveEventCell = useCallback(
        (event: ReactPointerEvent<E>): HoverCell | null => {
            const container = containerRef.current;
            if (!container) return null;
            const pos = getPointerLocalPosition(event, container);
            return resolveCell(pos.x, pos.y);
        },
        [containerRef, resolveCell]
    );

    const handlePointerMoveForHover = useCallback(
        (event: ReactPointerEvent<E>) => {
            // タッチは「タップでホバーを決める」仕様のため pointermove では動かさない
            // （パン操作中に指の下のマスへホバーが飛ぶのも防げる）
            if (!isHoverCapablePointer(event)) return;

            const cell = resolveEventCell(event);
            // マップ外へ出たらホバー解除
            setHover(cell ? { x: cell.x, y: cell.y } : { x: null, y: null });
        },
        [resolveEventCell, setHover]
    );

    const handlePointerLeaveForHover = useCallback(
        (event?: ReactPointerEvent<E>) => {
            // タッチは pointerup 直後に pointerleave が発火する。ここで解除すると1回目のタップで
            // ホバーが消えて2回目のタップ確定ができなくなるため、タッチでは解除しない
            if (event && !isHoverCapablePointer(event)) return;
            setHover({ x: null, y: null });
        },
        [setHover]
    );

    const handleTapForHover = useCallback(
        (event: ReactPointerEvent<E>, onConfirm: (cell: HoverCell) => void) => {
            const cell = resolveEventCell(event);
            if (!cell) {
                // マップ外のタップ/クリックはホバー解除
                setHover({ x: null, y: null });
                return;
            }

            const wasHovered = isHoveredCell(cell);
            setHover({ x: cell.x, y: cell.y });

            // マウス・ペンはホバーを常時追跡しているため、クリック＝その場で確定する
            // タッチは同一セルへの2回目のタップで確定する（1回目・別セルのタップはホバー移動のみ）
            if (wasHovered || isHoverCapablePointer(event)) {
                onConfirm(cell);
            }
        },
        [resolveEventCell, isHoveredCell, setHover]
    );

    return {
        setHover,
        clearHover,
        isHoveredCell,
        resolveEventCell,
        handlePointerMoveForHover,
        handlePointerLeaveForHover,
        handleTapForHover,
    };
}
