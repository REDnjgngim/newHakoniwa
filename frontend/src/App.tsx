import { HeaderStatusBar } from './features/island-status';
import { HexMapPreview } from './features/map';
import { Inspector, InspectorFrame } from './shared/components';
import { CommandReservationPanel } from './features/command-reservation';
import { useGameSession } from './features/game-session';

export function App() {
    const { sectorTerrain, islandStatus, selectTile } = useGameSession();

    return (
        <InspectorFrame>
            {/* マップ＋予約パネル: PCではくっつけた1200pxの塊として中央寄せ、モバイルでは従来通り */}
            <div className="contents md:mx-auto md:flex md:size-full md:min-h-0 md:max-w-300 md:flex-row md:items-stretch md:gap-1 md:py-3">
                {/* マップ Inspector: PCでは予約リストの最大2倍（800px）に抑える、モバイルでは画面全体 */}
                <Inspector
                    id="map-inspector"
                    type="map"
                    className="relative h-full min-w-0 flex-1 md:flex md:h-auto md:min-h-0 md:items-stretch md:justify-center md:bg-transparent"
                >
                    <div className="relative size-full md:overflow-hidden md:rounded-xl md:border md:border-sky-300/30 md:shadow-[0_0_40px_rgba(56,189,248,0.25),inset_0_0_60px_rgba(8,145,178,0.15)]">
                        {/* 島ステータスバー: マップパネル内オーバーレイ */}
                        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 w-full">
                            <div className="pointer-events-auto">
                                <HeaderStatusBar status={islandStatus} />
                            </div>
                        </div>
                        <HexMapPreview sector={sectorTerrain} onSelect={(selection) => selectTile(selection.coord)} />
                    </div>
                </Inspector>

                {/* コマンド予約管理パネル Inspector: PCではマップにくっつけて右側並列、モバイルではボトムシート */}
                <Inspector
                    id="command-reservation-inspector"
                    type="command-list"
                    className="contents md:block md:h-full md:min-h-0 md:w-100 md:shrink-0 md:self-stretch"
                >
                    <CommandReservationPanel />
                </Inspector>
            </div>
        </InspectorFrame>
    );
}
