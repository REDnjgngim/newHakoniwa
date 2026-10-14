import { useMemo } from 'react';
import { resolveMapSettings, type HexMapPreviewProps } from '../../map';
import CanvasMap from './canvas-map';

// ============================================================================
// マップ描画のエントリコンポーネント。
// セクター地形データと設定をpropsで受け取り、既定値とマージしてCanvasMapへ渡す。
// UI配置用の9:16不可視論理枠はこのマップパネル基準で中央配置する。
// ============================================================================

export default function HexMapPreview({ sector, settings, terrainImages, onSelect }: HexMapPreviewProps) {
    const resolved = useMemo(
        () => resolveMapSettings({ sector, settings, terrainImages, onSelect }),
        [sector, settings, terrainImages, onSelect]
    );

    return (
        <div
            className="relative box-border flex flex-col items-stretch overflow-hidden font-sans"
            style={{
                width: '100%',
                height: '100%',
                background: resolved.view.theme.background ?? 'transparent',
                containerType: 'size',
            }}
        >
            {/* UI配置用の9:16論理枠（マップパネル基準・不可視・操作を通過させる） */}
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 'min(100cqw, calc(100cqh * 9 / 16))',
                    height: 'min(100cqh, calc(100cqw * 16 / 9))',
                    background: 'transparent',
                    pointerEvents: 'none',
                }}
            />
            <CanvasMap sector={sector} settings={resolved} onSelect={onSelect} />
        </div>
    );
}
