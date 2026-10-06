import type { TerrainType } from '../types/terrain';

import land0 from '../assets/land0.gif';
import land1 from '../assets/land1.gif';
import land2 from '../assets/land2.gif';
import land11 from '../assets/land11.gif';
import land14 from '../assets/land14.gif';

// TerrainType と画像アセットの対応表
export const TERRAIN_IMAGE_MAP: Record<TerrainType, string> = {
    sea: land0,
    shallow: land14,
    wasteland: land1,
    plains: land2,
    mountain: land11,
};
