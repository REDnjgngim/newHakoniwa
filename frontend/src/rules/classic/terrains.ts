import type { TerrainDefinition } from '@/shared/terrain-types';
import { TERRAIN_IMAGE_MAP } from '@/shared/terrain-images';

/**
 * クラシック箱庭の土台地形定義一覧
 * 1つのオブジェクトに「識別子・表示名・画像・説明」を集約
 */
export const CLASSIC_TERRAINS: readonly TerrainDefinition[] = [
    {
        type: 'sea',
        name: '海',
        image: TERRAIN_IMAGE_MAP.sea,
        description: '広大な海。埋め立てることで浅瀬にできます。',
    },
    {
        type: 'shallow',
        name: '浅瀬',
        image: TERRAIN_IMAGE_MAP.shallow,
        description: '浅い海。埋め立てることで荒地にできます。',
    },
    {
        type: 'wasteland',
        name: '荒地',
        image: TERRAIN_IMAGE_MAP.wasteland,
        description: '荒れ果てた土地。整地することで平野になります。',
    },
    {
        type: 'plains',
        name: '平地',
        image: TERRAIN_IMAGE_MAP.plains,
        description: '平坦な土地。農場や建物を建設できます。',
    },
    {
        type: 'mountain',
        name: '山',
        image: TERRAIN_IMAGE_MAP.mountain,
        description: '険しい山。採掘場を整備できます。',
    },
];

/** 定義一覧から地形タイプIDを抽出した型 ('sea' | 'shallow' | 'wasteland' | 'plains' | 'mountain') */
export type ClassicTerrainType = (typeof CLASSIC_TERRAINS)[number]['type'];

/** IDから地形定義を取得するヘルパー */
export function getClassicTerrain(type: string): TerrainDefinition | undefined {
    return CLASSIC_TERRAINS.find((t) => t.type === type);
}
