import type { CommandDefinition } from './command-definition-types';

export const COMMAND_REGISTRY: CommandDefinition[] = [
    {
        commandCode: 'RECLAIM',
        name: '埋め立て',
        commandType: 'normal',
        hasCoordinate: true,
        parameterSchemas: [],
        estimatedTurn: 0,
        estimatedFundsDelta: 0,
    },
    {
        commandCode: 'EXPORT_FOOD',
        name: '食料輸出',
        commandType: 'fast',
        hasCoordinate: false,
        parameterSchemas: [
            {
                kind: 'slider',
                key: 'exportAmount',
                label: '輸出量',
                min: 0,
                max: 99,
                scale: 10000,
                unit: 'トン',
            },
        ],
        estimatedTurn: 0,
        estimatedFundsDelta: 0,
    },
    {
        commandCode: 'MISSILE',
        name: '通常ミサイル',
        commandType: 'normal',
        hasCoordinate: true,
        parameterSchemas: [
            {
                kind: 'slider',
                key: 'missileCount',
                label: '発射数',
                min: 1,
                max: 99,
                unit: '発',
            },
            {
                kind: 'island-select',
                key: 'targetIsland',
                label: '目標の島',
                labelSuffix: '目標の島',
            },
        ],
        estimatedTurn: 0,
        estimatedFundsDelta: 0,
    },
    {
        commandCode: 'FLEET_MOVE',
        name: '艦隊移動',
        commandType: 'normal',
        hasCoordinate: false,
        parameterSchemas: [
            {
                kind: 'fleet-select',
                key: 'fleetName',
                label: '対象',
                labelSuffix: '対象',
            },
            {
                kind: 'island-select',
                key: 'sourceIsland',
                label: '移動元の島',
                labelSuffix: '移動元の島',
            },
            {
                kind: 'island-select',
                key: 'targetIsland',
                label: '移動先の島',
                labelSuffix: '移動先の島',
            },
        ],
        estimatedTurn: 0,
        estimatedFundsDelta: 0,
    },
    {
        commandCode: 'EXCAVATION',
        name: '掘削',
        commandType: 'normal',
        hasCoordinate: true,
        parameterSchemas: [
            {
                kind: 'slider',
                key: 'scale',
                label: '規模',
                min: 1,
                max: 99,
                scale: 200,
                unit: '億円',
            },
        ],
        estimatedTurn: 0,
        estimatedFundsDelta: 0,
    },
    {
        commandCode: 'RECRUIT',
        name: '誘致活動',
        commandType: 'normal',
        hasCoordinate: false,
        parameterSchemas: [
            {
                kind: 'slider',
                key: 'stackCount',
                label: '回数',
                min: 1,
                max: 99,
            },
        ],
        estimatedTurn: 0,
        estimatedFundsDelta: 0,
    },
    {
        commandCode: 'ITEM_EQUIP',
        name: 'アイテム装備',
        commandType: 'fast',
        hasCoordinate: true,
        parameterSchemas: [
            {
                kind: 'item-select',
                key: 'itemName',
                label: 'アイテム',
                labelSuffix: 'アイテム',
            },
        ],
        estimatedTurn: 0,
        estimatedFundsDelta: 0,
    },
    {
        commandCode: 'BUILD_BATTLESHIP',
        name: '戦艦建造',
        commandType: 'normal',
        hasCoordinate: true,
        parameterSchemas: [
            {
                kind: 'fleet-select',
                key: 'fleetName',
                label: '対象',
                labelSuffix: '対象',
            },
        ],
        estimatedTurn: 0,
        estimatedFundsDelta: 0,
    },
];

export function getCommandDefinition(commandCode: string): CommandDefinition | undefined {
    return COMMAND_REGISTRY.find((def) => def.commandCode === commandCode);
}

export function getCommandDefinitionByName(name: string): CommandDefinition | undefined {
    return COMMAND_REGISTRY.find((def) => def.name === name);
}
