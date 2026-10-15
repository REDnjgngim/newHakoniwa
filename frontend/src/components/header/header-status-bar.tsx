import { mockIslandStatus } from '../../mocks/island-status';
import type { HeaderStatusBarProps } from '../../types/island-status';
import { useSessionState } from '../../hooks/use-session-state';

// ============================================================================
// ヘッダー情報表示領域（島ステータスバー）。
// 左側の Turn は背景なしのフローティング文字のみで表示する。
// 右側ステータスブロックのみ半透明ダークのボックスを持ち、タップ/クリックで
// 詳細パネルがヘッダー下に横一杯スライドインしながらオーバーレイ展開する。
// 詳細は1行目=項目・2行目=値の横並び2行テーブルで表示する。
// 展開状態は sessionStorage に保持され、リロード後も維持される。
// ============================================================================

// デザイン調整用: マップパネル内での中身の最大幅。後から変えやすいよう定数化。
// マップ幅いっぱいに広げたい場合は大きな値にする。詳細パネルもこの幅に収まる。
const CONTENT_MAX_WIDTH_PX = 1200;
const SESSION_KEY = 'header-status-bar:expanded';
const PANEL_BG = 'rgba(10, 25, 45, 0.82)';

function formatNumber(value: number): string {
    return value.toLocaleString('en-US');
}

export default function HeaderStatusBar({ status = mockIslandStatus, className = '' }: HeaderStatusBarProps) {
    const [expanded, setExpanded] = useSessionState(SESSION_KEY, false);

    const toggle = () => setExpanded((prev) => !prev);

    return (
        <header
            data-testid="header-status-bar"
            className={`relative z-20 w-full bg-transparent select-none ${className}`}
            style={{ containerType: 'inline-size' }}
        >
            {/* デザイン調整用: 狭い画面=全幅、広い画面=中央 max 幅。以降の幅調整はここだけ */}
            {/* relative を付けて詳細パネルの absolute 基準にする（＝UI層幅に収まる） */}
            <div className="relative mx-auto w-full" style={{ maxWidth: CONTENT_MAX_WIDTH_PX }}>
                <div className="flex w-full max-w-full items-start justify-between gap-1 sm:gap-2">
                    {/* 左側: Turn 表示（背景なし・文字だけ浮かせる。ヘッダー幅基準で拡縮） */}
                    <div
                        className="shrink-0 px-0.5 py-1.5 font-bold whitespace-nowrap text-white sm:px-1.5"
                        style={{
                            textShadow: '0 1px 4px rgba(0, 0, 0, 0.9), 0 0 2px rgba(0, 0, 0, 0.9)',
                            // 9:16枠の幅（=このheaderの幅）を基準に拡縮。
                            // 縦スマホ（約390px）では約13px、PC枠（約600px）では上限14pxに落ち着く。
                            fontSize: 'clamp(11px, 3.4cqw, 14px)',
                        }}
                    >
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
                        className="flex min-w-0 shrink-0 cursor-pointer items-center justify-end gap-0.75 px-1 py-1.5 whitespace-nowrap text-white select-none sm:gap-2.5 sm:px-2.5"
                        style={{
                            backgroundColor: PANEL_BG,
                            backdropFilter: 'blur(4px)',
                            WebkitBackdropFilter: 'blur(4px)',
                            borderRadius: '0 0 0 8px',
                            fontSize: 'clamp(9px, 2.9cqw, 12px)',
                        }}
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
                            className={`px-2 py-1.5 leading-relaxed text-white tabular-nums transition-transform duration-300 ease-out sm:px-3 ${
                                expanded ? 'translate-y-0' : '-translate-y-2'
                            }`}
                            style={{
                                backgroundColor: PANEL_BG,
                                backdropFilter: 'blur(4px)',
                                WebkitBackdropFilter: 'blur(4px)',
                                fontSize: 'clamp(9px, 2.9cqw, 12px)',
                            }}
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
