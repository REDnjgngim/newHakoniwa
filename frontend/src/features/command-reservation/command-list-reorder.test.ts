import { describe, it, expect } from 'vitest';
import type { ReservationCommand } from './types';
import { calcDragOverIndex, calcDropOffset, calcRowShifts, mapReorderIndicesToIds } from './command-list-reorder';

const cmds: ReservationCommand[] = [
    { id: 'a', commandCode: 'LEVELING', name: 'A', commandType: 'normal', estimatedTurn: 0, estimatedFundsDelta: 0 },
    { id: 'b', commandCode: 'LEVELING', name: 'B', commandType: 'normal', estimatedTurn: 0, estimatedFundsDelta: 0 },
    { id: 'c', commandCode: 'LEVELING', name: 'C', commandType: 'normal', estimatedTurn: 0, estimatedFundsDelta: 0 },
];

describe('command-list-reorder', () => {
    it('正常系', () => {
        expect(mapReorderIndicesToIds(cmds, 0, 1)).toEqual({ fromId: 'a', toId: 'c' });
    });
    it('toIndex が末尾を超える場合は null', () => {
        expect(mapReorderIndicesToIds(cmds, 0, 10)).toEqual({ fromId: 'a', toId: null });
    });
    it('不正 index は null', () => {
        expect(mapReorderIndicesToIds(cmds, 0, 0)).toBeNull();
        expect(mapReorderIndicesToIds(cmds, 5, 1)).toBeNull();
    });
});

describe('calcRowShifts', () => {
    it('下方向へのドラッグ時は間の行をドラッグ行の高さ分だけ上にシフトする', () => {
        expect(calcRowShifts({ heights: [60, 120, 60], fromIndex: 0, toIndex: 2 })).toEqual([0, -60, -60]);
    });

    it('上方向へのドラッグ時は間の行をドラッグ行の高さ分だけ下にシフトする', () => {
        expect(calcRowShifts({ heights: [60, 120, 80], fromIndex: 2, toIndex: 0 })).toEqual([80, 80, 0]);
    });

    it('同一インデックスや範囲外はすべて 0 を返す', () => {
        expect(calcRowShifts({ heights: [60, 60], fromIndex: 1, toIndex: 1 })).toEqual([0, 0]);
        expect(calcRowShifts({ heights: [60, 60], fromIndex: -1, toIndex: 1 })).toEqual([0, 0]);
        expect(calcRowShifts({ heights: [], fromIndex: 0, toIndex: 0 })).toEqual([]);
    });
});

describe('calcDropOffset', () => {
    it('下方向へのドラッグ時は通過する行の高さ合計（正）を返す', () => {
        expect(calcDropOffset({ heights: [60, 120, 80], fromIndex: 0, toIndex: 2 })).toBe(200);
    });

    it('上方向へのドラッグ時は通過する行の高さ合計（負）を返す', () => {
        expect(calcDropOffset({ heights: [60, 120, 80], fromIndex: 2, toIndex: 0 })).toBe(-180);
    });

    it('同一インデックスや範囲外は 0 を返す', () => {
        expect(calcDropOffset({ heights: [60, 60], fromIndex: 1, toIndex: 1 })).toBe(0);
        expect(calcDropOffset({ heights: [60, 60], fromIndex: 0, toIndex: 5 })).toBe(0);
    });
});

describe('calcDragOverIndex', () => {
    it('下方向へドラッグして閾値(25%)を超えると挿入先が進む', () => {
        // row0: top=0, h=60 / row1: top=60, h=60 -> row1 の 25% は 75
        const next = calcDragOverIndex({
            rowTops: [0, 60],
            visualHeights: [52, 52],
            stepHeights: [60, 60],
            fromIndex: 0,
            currentOverIndex: 0,
            draggedCenterY: 80,
        });
        expect(next).toBe(1);
    });

    it('すでに下にある状態から戻る際は上側の閾値(75%)を下回るまで維持される', () => {
        // currentOverIndex=1 のとき row1 は -60 シフトして top=0, 75% 閾値は 0 + 52*0.75 = 39
        const stayed = calcDragOverIndex({
            rowTops: [0, 60],
            visualHeights: [52, 52],
            stepHeights: [60, 60],
            fromIndex: 0,
            currentOverIndex: 1,
            draggedCenterY: 45,
        });
        expect(stayed).toBe(1);

        const movedBack = calcDragOverIndex({
            rowTops: [0, 60],
            visualHeights: [52, 52],
            stepHeights: [60, 60],
            fromIndex: 0,
            currentOverIndex: 1,
            draggedCenterY: 30,
        });
        expect(movedBack).toBe(0);
    });
});
