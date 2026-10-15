import type { IslandStatus } from '../types/island-status';

// ============================================================================
// ヘッダー情報表示領域の開発・プレビュー用モックデータ。
// issue-004 の仕様書に記載されたサンプル数値を網羅する。
// ============================================================================

export const mockIslandStatus: IslandStatus = {
    turn: 12345,
    timeToNextTurn: '0:45:12',
    rank: 1,
    population: 90000,
    funds: 9999,
    food: 999900,
    area: 8800,
    farm: 100000,
    factory: 0,
    mine: 2000000,
    unemployed: 0,
};
