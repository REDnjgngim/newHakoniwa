import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { sectorTerrain } from './mocks/sector-terrain';
import { mockIslandStatus } from './mocks/island-status';
import HeaderStatusBar from './components/header/header-status-bar';
import HexMapPreview from './components/hex-map/hex-map-preview';
import Inspector from './components/inspector/Inspector';
import InspectorFrame from './components/inspector/InspectorFrame';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('ルート要素(#root)が見つかりません');

createRoot(rootElement).render(
    <StrictMode>
        <InspectorFrame>
            {/* 島ステータスバー: 全幅オーバーレイ。中身はコンポーネント内で max 幅に cap する
                （縦スマホ=全幅そのまま、PC=中央に寄せる）。後からの幅調整は max 幅の値だけ変えればよい */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    width: '100dvw',
                    zIndex: 20,
                }}
            >
                <HeaderStatusBar status={mockIslandStatus} />
            </div>
            <Inspector id="map-inspector" type="map">
                <HexMapPreview sector={sectorTerrain} />
            </Inspector>
        </InspectorFrame>
    </StrictMode>
);
