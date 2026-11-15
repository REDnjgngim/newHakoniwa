import { describe, it, expect } from 'vitest';
import { canExecuteCommand } from './command-execution-check';
import type { CommandDefinition } from './command-definition-types';
import type { SectorData } from '@/shared/terrain-types';

const baseSector: SectorData = {
    sector_id: 1,
    map_width: 2,
    map_height: 2,
    terrain_grid: [
        [{ type: 'sea' }, { type: 'plains' }],
        [{ type: 'wasteland' }, { type: 'mountain' }],
    ],
    objects: [],
    units: [],
};

const coordDef: CommandDefinition = {
    commandCode: 'LEVELING',
    name: '整地',
    commandType: 'normal',
    hasCoordinate: true,
    cost: 5,
    allowedTerrains: ['wasteland', 'plains'],
    requiresNoObject: false,
    parameterSchemas: [],
    estimatedTurn: 0,
    estimatedFundsDelta: 0,
};

const forestryDef: CommandDefinition = {
    commandCode: 'FORESTRY',
    name: '植林',
    commandType: 'normal',
    hasCoordinate: true,
    cost: 50,
    allowedTerrains: ['plains'],
    requiresNoObject: true,
    parameterSchemas: [],
    estimatedTurn: 0,
    estimatedFundsDelta: 0,
};

const nonCoordDef: CommandDefinition = {
    commandCode: 'EXPORT_FOOD',
    name: '食料輸出',
    commandType: 'fast',
    hasCoordinate: false,
    cost: 0,
    parameterSchemas: [],
    estimatedTurn: 0,
    estimatedFundsDelta: 0,
};

describe('canExecuteCommand', () => {
    it('座標不要コマンドは常に ok', () => {
        expect(canExecuteCommand(nonCoordDef, baseSector)).toEqual({ ok: true });
    });

    it('座標が必要だが未指定の場合はエラー', () => {
        expect(canExecuteCommand(coordDef, baseSector)).toEqual({
            ok: false,
            reason: '座標が必要です',
        });
    });

    it('範囲外座標はエラー', () => {
        expect(canExecuteCommand(coordDef, baseSector, { x: 5, y: 5 })).toEqual({
            ok: false,
            reason: '範囲外の座標です',
        });
    });

    it('不許可地形の場合はエラー', () => {
        // (0,0) は sea なので DEVELOP 不可
        expect(canExecuteCommand(coordDef, baseSector, { x: 0, y: 0 })).toEqual({
            ok: false,
            reason: 'この地形では実行できません',
        });
    });

    it('許可地形の場合は ok', () => {
        // (1,0) は plains なので DEVELOP 可能
        expect(canExecuteCommand(coordDef, baseSector, { x: 1, y: 0 })).toEqual({ ok: true });
    });

    it('requiresNoObject が true でオブジェクトが存在する場合はエラー', () => {
        const sectorWithObj: SectorData = {
            ...baseSector,
            objects: [
                {
                    id: 'obj-1',
                    coordinate: { x: 1, y: 0 },
                    layerId: 10,
                    objectType: 'woods',
                },
            ],
        };
        expect(canExecuteCommand(forestryDef, sectorWithObj, { x: 1, y: 0 })).toEqual({
            ok: false,
            reason: 'オブジェクトが存在します',
        });
    });

    it('requiresNoObject が true でオブジェクトが存在しない場合は ok', () => {
        expect(canExecuteCommand(forestryDef, baseSector, { x: 1, y: 0 })).toEqual({ ok: true });
    });
});
