import { useMemo } from 'react';
import { resolveMapSettings, type HexMapPreviewProps } from '../../map';
import CanvasMap from './canvas-map';

// ============================================================================
// マップ描画のエントリコンポーネント。
// セクター地形データと設定をpropsで受け取り、既定値とマージしてCanvasMapへ渡す。
// ============================================================================

export default function HexMapPreview({ sector, settings, terrainImages, onSelect }: HexMapPreviewProps) {
    const resolved = useMemo(
        () => resolveMapSettings({ sector, settings, terrainImages, onSelect }),
        [sector, settings, terrainImages, onSelect]
    );

    return (
        <div
            className="w-full h-screen flex flex-col items-center p-3 box-border font-sans overflow-hidden"
            style={{ background: resolved.view.theme.background }}
        >
            <CanvasMap sector={sector} settings={resolved} onSelect={onSelect} />
        </div>
    );
}
