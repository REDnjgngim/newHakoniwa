import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
// import App from './App.tsx';
import HexMapPreview from './hex-map-preview.tsx';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        {/* <App /> */}
        <HexMapPreview />
    </StrictMode>
);
