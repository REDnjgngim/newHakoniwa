import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
// import App from './App.tsx';
import { sectorTerrain } from './mocks/sector-terrain';
import HexMapPreview from './components/hex-map/hex-map-preview';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        {/* <App /> */}
        <HexMapPreview sector={sectorTerrain} />
    </StrictMode>
);
