import { useEffect, useRef } from 'react';
import type { TerrainImageMap } from '../types';

// ============================================================================
// 地形画像のプリロードフック。
// 未ロードの画像だけを Image で読み込み、完了のたびに onLoaded（再描画トリガー）を呼ぶ。
// ============================================================================

export function useTerrainImages(images: TerrainImageMap, onLoaded: () => void): ReadonlyMap<string, HTMLImageElement> {
    const storeRef = useRef<Map<string, HTMLImageElement>>(new Map());
    const onLoadedRef = useRef(onLoaded);

    useEffect(() => {
        onLoadedRef.current = onLoaded;
    });

    useEffect(() => {
        const store = storeRef.current;
        const created: Array<[string, HTMLImageElement]> = [];

        for (const src of Object.values(images)) {
            if (!src || store.has(src)) continue;

            const img = new Image();
            img.onload = () => onLoadedRef.current();
            img.src = src;
            store.set(src, img);
            created.push([src, img]);
        }

        return () => {
            // コールバックを外し、登録も戻して次回のセットアップで貼り直せるようにする
            // （StrictModeのeffect二重実行でも読み込み完了を通知できるようにするため）
            for (const [src, img] of created) {
                img.onload = null;
                store.delete(src);
            }
        };
    }, [images]);

    return storeRef.current;
}
