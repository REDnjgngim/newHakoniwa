import { describe, it, expect } from 'vitest';
import type { ReservationCommand } from './types';
import {
    resolveDefinition,
    clampSliderValue,
    computeSliderUpdate,
    buildCoordUpdate,
    buildTargetIslandUpdate,
    getSelectOptions,
    resolveTargetIslandValue,
} from './command-detail-logic';

const cmd: ReservationCommand = {
    id: '1',
    name: '通常ミサイル',
    commandType: 'normal',
    commandCode: 'MISSILE_NORMAL',
    estimatedTurn: 0,
    estimatedFundsDelta: 0,
};

describe('command-detail-logic', () => {
    it('resolveDefinition: code 優先', () => {
        expect(resolveDefinition(cmd)?.commandCode).toBe('MISSILE_NORMAL');
    });
    it('clampSliderValue: NaN→min', () => {
        expect(clampSliderValue(NaN, 1, 5)).toBe(1);
    });
    it('clampSliderValue: floor & clamp', () => {
        expect(clampSliderValue(2.7, 1, 5)).toBe(2);
        expect(clampSliderValue(10, 1, 5)).toBe(5);
    });
    it('computeSliderUpdate: scale と summary', () => {
        const schema = {
            kind: 'slider' as const,
            key: 'missileCount',
            label: '発射数',
            min: 1,
            max: 99,
            scale: 1,
            unit: '発',
        };
        const r = computeSliderUpdate(schema, cmd, 3);
        expect(r.actualValue).toBe(3);
        expect(r.summaryText).toBe('発射数: 3発');
    });
    it('computeSliderUpdate: params 更新', () => {
        const c = { ...cmd, commandCode: 'RECRUIT', name: '誘致活動' };
        const schema = { kind: 'slider' as const, key: 'stackCount', label: '回数', min: 1, max: 99 };
        const r = computeSliderUpdate(schema, c, 5);
        expect(r.updatedParams.stackCount).toBe(5);
    });
    it('buildCoordUpdate: x/y マージ', () => {
        const c = { ...cmd, coordinate: { x: 1, y: 2 } };
        expect(buildCoordUpdate(c, 'x', 9).coordinate).toEqual({ x: 9, y: 2 });
        expect(buildCoordUpdate(c, 'y', 9).coordinate).toEqual({ x: 1, y: 9 });
    });
    it('buildTargetIslandUpdate: params 更新', () => {
        const r = buildTargetIslandUpdate(cmd, '島A');
        expect(r.params?.targetIsland).toBe('島A');
    });
    it('getSelectOptions: island-select', () => {
        const island = [{ value: 'i', label: '島' }];
        expect(getSelectOptions({ kind: 'island-select', key: 'k', label: 'l', labelSuffix: 's' }, island)).toBe(
            island
        );
    });
    it('resolveTargetIslandValue: params 取得', () => {
        const c = { ...cmd, params: { targetIsland: '島A' } };
        expect(resolveTargetIslandValue(c.params)).toBe('島A');
    });
});
