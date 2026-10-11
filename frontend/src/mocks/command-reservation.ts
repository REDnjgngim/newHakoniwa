import type { ReservationCommand } from '../types/command-reservation';

export interface IslandOption {
    id: string;
    name: string;
}

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
        order: 1,
        commandType: 'normal',
        name: '埋め立て',
        coordinate: { x: 4, y: 4 },
        terrainIcon: '🌊',
        summaryText: '[2回]',
        estimatedTurn: 101,
        estimatedFundsDelta: -20,
        params: {
            repeatCount: 2,
        },
    },
    {
        id: 'cmd-02',
        order: 2,
        commandType: 'normal',
        name: '食料輸出',
        summaryText: '[輸出量: 990000トン]',
        estimatedTurn: 102,
        estimatedFundsDelta: 430,
        params: {
            amount: 990000,
        },
    },
    {
        id: 'cmd-03',
        order: 3,
        commandType: 'normal',
        name: '通常ミサイル',
        coordinate: { x: 5, y: 6 },
        terrainIcon: '🎯',
        summaryText: '[制御回数: 28発]',
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
        order: 4,
        commandType: 'normal',
        name: '艦隊移動',
        summaryText: '対象: [はげはげふがふが艦隊]',
        targetIsland: '1 2 3 4 5 6 7 8 9 0...島',
        estimatedTurn: 104,
        estimatedFundsDelta: -10,
        params: {
            fleetName: 'はげはげふがふが艦隊',
            targetIsland: '1 2 3 4 5 6 7 8 9 0...島',
        },
    },
    {
        id: 'cmd-05',
        order: 5,
        commandType: 'normal',
        name: '掘削',
        coordinate: { x: 10, y: 10 },
        terrainIcon: '⛏️',
        summaryText: '[規模: 19800億円]',
        estimatedTurn: 105,
        estimatedFundsDelta: -198,
        params: {
            scale: 19800,
        },
    },
    {
        id: 'cmd-06',
        order: 6,
        commandType: 'normal',
        name: '誘致活動',
        stackCount: 99,
        summaryText: '(X 99 スタック)',
        estimatedTurn: 106,
        estimatedFundsDelta: -50,
        params: {
            stackCount: 99,
        },
    },
    {
        id: 'cmd-07',
        order: 7,
        commandType: 'fast',
        name: 'アイテム装備',
        coordinate: { x: 24, y: 24 },
        terrainIcon: '✨',
        summaryText: '[アイテム: 闇のスパイ追跡]',
        estimatedTurn: 106, // 高速コマンドなのでターン消費なし
        estimatedFundsDelta: 0,
        params: {
            itemName: '闇のスパイ追跡',
        },
    },
    {
        id: 'cmd-08',
        order: 8,
        commandType: 'normal',
        name: '戦艦建造',
        coordinate: { x: 10, y: 8 },
        terrainIcon: '⚓',
        summaryText: '対象: [はげはげふがふが艦隊]',
        targetIsland: '1 2 3 4 5 6 7 8 9 0...島',
        estimatedTurn: 107,
        estimatedFundsDelta: -150,
        params: {
            fleetName: 'はげはげふがふが艦隊',
            targetIsland: '1 2 3 4 5 6 7 8 9 0...島',
        },
    },
];
