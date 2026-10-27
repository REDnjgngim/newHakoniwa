import type { HeaderStatusBarProps } from '../types';
import { useSessionState } from '../../../shared/hooks/use-session-state';

// ============================================================================
// ヘッダー情報表示領域（島ステータスバー）。
// 左側の Turn は背景なしのフローティング文字のみで表示する。
// 右側ステータスブロックのみ半透明ダークのボックスを持ち、タップ/クリックで
// 詳細パネルがヘッダー下に横一杯スライドインしながらオーバーレイ展開する。
// 詳細は1行目=項目・2行目=値の横並び2行テーブルで表示する。
// 展開状態は sessionStorage に保持され、リロード後も維持される。
// ============================================================================

const SESSION_KEY = 'header-status-bar:expanded';

function formatNumber(value: number): string {
    return value.toLocaleString('en-US');
}

export function HeaderStatusBar({ status, className = '' }: HeaderStatusBarProps) {
    const [expanded, setExpanded] = useSessionState(SESSION_KEY, false);

    const toggle = () => setExpanded((prev) => !prev);

    return (
        <header
            data-testid="header-status-bar"
            className={`@container relative z-20 w-full bg-transparent select-none ${className}`}
        >
            {/* デザイン調整用: 狭い画面=全幅、広い画面=中央 max 幅。以降の幅調整はここだけ */}
            {/* relative を付けて詳細パネルの absolute 基準にする（＝UI層幅に収まる） */}
            <div className="relative mx-auto w-full max-w-300">
                <div className="flex w-full max-w-full items-start justify-between gap-1 sm:gap-2">
                    {/* 左側: Turn 表示（背景なし・文字だけ浮かせる。ヘッダー幅基準で拡縮） */}
                    <div className="shrink-0 px-0.5 py-1.5 text-[clamp(11px,3.4cqi,14px)] font-bold whitespace-nowrap text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.9),0_0_2px_rgba(0,0,0,0.9)] sm:px-1.5">
                        Turn {formatNumber(status.turn)} ({status.timeToNextTurn})
                    </div>

                    {/* 右側: 常時表示のステータスボックス（幅は常時表示のまま固定） */}
                    <div
                        role="button"
                        tabIndex={0}
                        aria-expanded={expanded}
                        aria-label={expanded ? '詳細を閉じる' : '詳細を開く'}
                        onClick={toggle}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggle();
                            }
                        }}
                        className="flex min-w-0 shrink-0 cursor-pointer items-center justify-end gap-0.75 rounded-bl-lg bg-[rgba(10,25,45,0.82)] px-1 py-1.5 text-[clamp(9px,2.9cqi,12px)] whitespace-nowrap text-white backdrop-blur-sm select-none sm:gap-2.5 sm:px-2.5"
                    >
                        <span aria-hidden="true" className="shrink-0 px-0 text-white sm:px-0.5">
                            {expanded ? '▲' : '▼'}
                        </span>
                        <span className="shrink-0">△ {formatNumber(status.rank)}位</span>
                        <span className="shrink-0">👥 {formatNumber(status.population)}人</span>
                        <span className="shrink-0">💰 {formatNumber(status.funds)}億円</span>
                        <span className="shrink-0">🍙 {formatNumber(status.food)}トン</span>
                    </div>
                </div>

                {/* 展開時詳細パネル: コンテナ幅いっぱいに広がるオーバーレイ。
                常時バーのレイアウト幅には影響させない */}
                <div
                    data-testid="header-status-detail"
                    aria-hidden={!expanded}
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute inset-x-0 top-full grid transition-all duration-300 ease-out ${
                        expanded ? 'grid-rows-[1fr] opacity-100' : 'pointer-events-none grid-rows-[0fr] opacity-0'
                    }`}
                >
                    <div className="overflow-hidden">
                        <div
                            className={`rounded-bl-lg bg-[rgba(10,25,45,0.82)] px-2 py-1.5 text-[clamp(9px,2.9cqi,12px)] leading-relaxed text-white tabular-nums backdrop-blur-sm transition-transform duration-300 ease-out sm:px-3 ${expanded ? 'translate-y-0' : '-translate-y-2'}`}
                        >
                            {/* 1行目=項目・2行目=値の横並び2行テーブル */}
                            <table className="w-full border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="text-white/70">
                                        <th scope="col" className="px-1 py-0.5 text-center font-normal">
                                            面積
                                        </th>
                                        <th scope="col" className="px-1 py-0.5 text-center font-normal">
                                            農場
                                        </th>
                                        <th scope="col" className="px-1 py-0.5 text-center font-normal">
                                            工場
                                        </th>
                                        <th scope="col" className="px-1 py-0.5 text-center font-normal">
                                            採掘場
                                        </th>
                                        <th scope="col" className="px-1 py-0.5 text-center font-normal">
                                            失業人数
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="text-center">
                                        <td className="px-1 py-0.5">{formatNumber(status.area)}Hex</td>
                                        <td className="px-1 py-0.5">{formatNumber(status.farm)}人</td>
                                        <td className="px-1 py-0.5">{formatNumber(status.factory)}人</td>
                                        <td className="px-1 py-0.5">{formatNumber(status.mine)}人</td>
                                        <td className="px-1 py-0.5">{formatNumber(status.unemployed)}人</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
