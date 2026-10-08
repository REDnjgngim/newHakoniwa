import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { sectorTerrain } from './mocks/sector-terrain';
import HexMapPreview from './components/hex-map/hex-map-preview';
import Inspector from './components/inspector/Inspector';
import InspectorFrame from './components/inspector/InspectorFrame';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('ルート要素(#root)が見つかりません');

createRoot(rootElement).render(
    <StrictMode>
        <InspectorFrame>
            <Inspector id="map-inspector" type="map">
                <HexMapPreview sector={sectorTerrain} />
            </Inspector>
        </InspectorFrame>
    </StrictMode>
);
