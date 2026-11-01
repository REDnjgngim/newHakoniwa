import type { ReservationCommand } from '../types';

export type IslandOption = {
    id: string;
    name: string;
};

export const mockIslands: IslandOption[] = [
    { id: 'island-1', name: 'Neptune島' },
    { id: 'island-2', name: '1 2 3 4 5 6 7 8 9 0...島' },
    { id: 'island-3', name: 'エデン島' },
    { id: 'island-4', name: 'ポセイドン島' },
    { id: 'island-5', name: 'アトランティス島' },
];

export const mockReservationCommands: ReservationCommand[] = [
    {
        id: 'cmd-01',
        commandCode: 'RECLAIM',
        commandType: 'normal',
        name: '埋め立て',
        coordinate: { x: 4, y: 4 },
        estimatedTurn: 101,
        estimatedFundsDelta: -20,
    },
    {
        id: 'cmd-02',
        commandCode: 'EXPORT_FOOD',
        commandType: 'fast',
        name: '食料輸出',
        summaryText: '輸出量: 990000トン',
        estimatedTurn: 102,
        estimatedFundsDelta: 430,
        params: {
            exportAmount: 990000,
        },
    },
    {
        id: 'cmd-03',
        commandCode: 'MISSILE',
        commandType: 'normal',
        name: '通常ミサイル',
        coordinate: { x: 5, y: 6 },
        summaryText: '発射数: 28発',
        targetIsland: 'Neptune島',
        estimatedTurn: 103,
        estimatedFundsDelta: -30,
        params: {
            missileCount: 28,
            targetIsland: 'Neptune島',
        },
    },
    {
        id: 'cmd-04',
        commandCode: 'FLEET_MOVE',
        commandType: 'normal',
        name: '艦隊移動',
        summaryText: '対象: はげはげふがふが艦隊',
        targetIsland: '1 2 3 4 5 6 7 8 9 0...島',
        estimatedTurn: 104,
        estimatedFundsDelta: -10,
        params: {
            fleetName: 'はげはげふがふが艦隊',
            sourceIsland: '1 2 3 4 5 6 7 8 9 0...島',
            targetIsland: '1 2 3 4 5 6 7 8 9 0...島',
        },
    },
    {
        id: 'cmd-05',
        commandCode: 'EXCAVATION',
        commandType: 'normal',
        name: '掘削',
        coordinate: { x: 10, y: 10 },
        summaryText: '規模: 19800億円',
        estimatedTurn: 105,
        estimatedFundsDelta: -198,
        params: {
            scale: 19800,
        },
    },
    {
        id: 'cmd-06',
        commandCode: 'RECRUIT',
        commandType: 'normal',
        name: '誘致活動',
        stackCount: 99,
        estimatedTurn: 106,
        estimatedFundsDelta: -50,
        params: {
            stackCount: 99,
        },
    },
    {
        id: 'cmd-07',
        commandCode: 'ITEM_EQUIP',
        commandType: 'fast',
        name: 'アイテム装備',
        coordinate: { x: 24, y: 24 },
        summaryText: 'アイテム: 闇のスパイ道具',
        estimatedTurn: 106, // 高速コマンドなのでターン消費なし
        estimatedFundsDelta: 0,
        params: {
            itemName: '闇のスパイ道具',
        },
    },
    {
        id: 'cmd-08',
        commandCode: 'BUILD_BATTLESHIP',
        commandType: 'normal',
        name: '戦艦建造',
        coordinate: { x: 10, y: 8 },
        summaryText: '対象: はげはげふがふが艦隊',
        targetIsland: '1 2 3 4 5 6 7 8 9 0...島',
        estimatedTurn: 107,
        estimatedFundsDelta: -150,
        params: {
            fleetName: 'はげはげふがふが艦隊',
            targetIsland: '1 2 3 4 5 6 7 8 9 0...島',
        },
    },
    {
        id: 'cmd-02b',
        commandCode: 'EXPORT_FOOD',
        commandType: 'fast',
        name: '食料輸出',
        summaryText: '輸出量: 990000トン',
        estimatedTurn: 102,
        estimatedFundsDelta: 430,
        params: {
            exportAmount: 990000,
        },
    },
    {
        id: 'cmd-02c',
        commandCode: 'EXPORT_FOOD',
        commandType: 'fast',
        name: '食料輸出',
        summaryText: '輸出量: 990000トン',
        estimatedTurn: 102,
        estimatedFundsDelta: 430,
        params: {
            exportAmount: 990000,
        },
    },
    {
        id: 'cmd-02d',
        commandCode: 'EXPORT_FOOD',
        commandType: 'fast',
        name: '食料輸出',
        summaryText: '輸出量: 990000トン',
        estimatedTurn: 102,
        estimatedFundsDelta: 430,
        params: {
            exportAmount: 990000,
        },
    },
];

export const mockItems: IslandOption[] = [
    { id: 'item-1', name: '闇のスパイ道具' },
    { id: 'item-2', name: '死神の鎌' },
    { id: 'item-3', name: '鉄壁の鎧' },
];

export const mockFleets: IslandOption[] = [
    { id: 'fleet-1', name: 'はげはげふがふが艦隊' },
    { id: 'fleet-2', name: '第2艦隊' },
    { id: 'fleet-3', name: '第3艦隊' },
    { id: 'fleet-4', name: '第4艦隊' },
];
