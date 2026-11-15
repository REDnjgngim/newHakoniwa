import type { ReservationCommand } from './types';

export function mapReorderIndicesToIds(
    commands: ReservationCommand[],
    fromIndex: number,
    toIndex: number
): { fromId: string; toId: string | null } | null {
    if (fromIndex < 0 || fromIndex >= commands.length) return null;
    if (toIndex < 0) return null;
    if (fromIndex === toIndex) return null;
    const fromId = commands[fromIndex]?.id;
    if (!fromId) return null;
    const nonDragged = commands.filter((_, i) => i !== fromIndex);
    const toId = toIndex >= nonDragged.length ? null : (nonDragged[toIndex]?.id ?? null);
    return { fromId, toId };
}

export type ReorderGeometryParams = {
    heights: number[];
    fromIndex: number;
    toIndex: number;
};

/**
 * ドラッグ中に各行へ適用する translateY シフト量を算出する。
 * ドラッグ中の行自身はポインタ追従で直接移動させるため 0 を返す。
 */
export function calcRowShifts({ heights, fromIndex, toIndex }: ReorderGeometryParams): number[] {
    const count = heights.length;
    if (count === 0) return [];
    const shifts = new Array<number>(count).fill(0);
    if (fromIndex < 0 || fromIndex >= count || toIndex < 0 || toIndex >= count) {
        return shifts;
    }
    if (fromIndex === toIndex) return shifts;

    const draggedHeight = heights[fromIndex] ?? 0;
    if (draggedHeight <= 0) return shifts;

    if (fromIndex < toIndex) {
        for (let i = fromIndex + 1; i <= toIndex; i += 1) {
            shifts[i] = -draggedHeight;
        }
    } else {
        for (let i = toIndex; i < fromIndex; i += 1) {
            shifts[i] = draggedHeight;
        }
    }
    return shifts;
}

/**
 * ドロップ時にドラッグ行が目標スロットへ移動するための translateY 量を算出する。
 */
export function calcDropOffset({ heights, fromIndex, toIndex }: ReorderGeometryParams): number {
    const count = heights.length;
    if (fromIndex < 0 || fromIndex >= count || toIndex < 0 || toIndex >= count) {
        return 0;
    }
    if (fromIndex === toIndex) return 0;

    let offset = 0;
    if (fromIndex < toIndex) {
        for (let i = fromIndex + 1; i <= toIndex; i += 1) {
            offset += heights[i] ?? 0;
        }
    } else {
        for (let i = toIndex; i < fromIndex; i += 1) {
            offset -= heights[i] ?? 0;
        }
    }
    return offset;
}

/**
 * キャッシュ済みの行座標・高さから、現在のドラッグ中心位置に対応する挿入先インデックスを求める。
 */
export function calcDragOverIndex(params: {
    rowTops: number[];
    visualHeights: number[];
    stepHeights: number[];
    fromIndex: number;
    currentOverIndex: number;
    draggedCenterY: number;
}): number {
    const { rowTops, visualHeights, stepHeights, fromIndex, currentOverIndex, draggedCenterY } = params;
    const count = rowTops.length;
    if (count <= 1 || fromIndex < 0 || fromIndex >= count) return Math.max(0, fromIndex);

    const shifts = calcRowShifts({ heights: stepHeights, fromIndex, toIndex: currentOverIndex });
    let insertAt = 0;
    let seen = 0;

    for (let i = 0; i < count; i += 1) {
        if (i === fromIndex) continue;
        const rowOrderIndex = seen;
        seen += 1;
        const top = (rowTops[i] ?? 0) + (shifts[i] ?? 0);
        const height = visualHeights[i] ?? stepHeights[i] ?? 0;
        // プレースホルダーより下の行は25%、上の行は75%を境界にして素早く安定して入れ替える
        const ratio = rowOrderIndex >= currentOverIndex ? 0.25 : 0.75;
        const threshold = top + height * ratio;
        if (draggedCenterY >= threshold) {
            insertAt += 1;
        }
    }

    return Math.max(0, Math.min(insertAt, count - 1));
}
