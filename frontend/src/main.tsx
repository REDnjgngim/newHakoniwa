import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { sectorTerrain } from './mocks/sector-terrain';
import { mockIslandStatus } from './mocks/island-status';
import HeaderStatusBar from './components/header/header-status-bar';
import HexMapPreview from './components/hex-map/hex-map-preview';
import Inspector from './components/inspector/Inspector';
import InspectorFrame from './components/inspector/InspectorFrame';
import CommandReservationPanel from './components/command-reservation/CommandReservationPanel';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('ルート要素(#root)が見つかりません');

createRoot(rootElement).render(
    <StrictMode>
        <InspectorFrame>
            {/* 島ステータスバー: 全幅オーバーレイ */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    width: '100dvw',
                    zIndex: 20,
                    pointerEvents: 'none',
                }}
            >
                <div style={{ pointerEvents: 'auto' }}>
                    <HeaderStatusBar status={mockIslandStatus} />
                </div>
            </div>

            {/* マップ Inspector: PCでは左側・中央を占有、モバイルでは画面全体 */}
            <Inspector id="map-inspector" type="map" className="relative h-full min-w-0 flex-1">
                <HexMapPreview sector={sectorTerrain} />
            </Inspector>

            {/* コマンド予約管理パネル Inspector: PCでは右側並列、モバイルではボトムシート */}
            <Inspector
                id="command-reservation-inspector"
                type="command-list"
                className="contents md:block md:h-full md:w-100 md:shrink-0"
            >
                <CommandReservationPanel />
            </Inspector>
        </InspectorFrame>
    </StrictMode>
);
