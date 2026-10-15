// ============================================================================
// ヘッダー情報表示領域（島ステータスバー）で扱うデータ型定義。
// 常時表示情報と展開時詳細情報を1つのインターフェースにまとめる。
// ============================================================================

export interface IslandStatus {
    // 常時表示情報
    turn: number;
    timeToNextTurn: string; // 例: "0:45:12"
    rank: number;
    population: number; // 人口（人）
    funds: number; // 資金（億円）
    food: number; // 食料（トン）

    // 展開時詳細情報
    area: number; // 面積（Hex）
    farm: number; // 農場規模（人）
    factory: number; // 工場規模（人）
    mine: number; // 採掘場規模（人）
    unemployed: number; // 失業人数（人）
}

export interface HeaderStatusBarProps {
    status?: IslandStatus;
    className?: string;
}
