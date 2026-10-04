import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
// import App from './App.tsx';
import { sectorTerrain } from './mocks/sector-terrain';
import HexMapPreview from './components/hex-map/hex-map-preview';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('ルート要素(#root)が見つかりません');

createRoot(rootElement).render(
    <StrictMode>
        {/* <App /> */}
        <HexMapPreview sector={sectorTerrain} />
    </StrictMode>
);
