import type { LayerDefinition } from '@/shared/terrain-types';

export const SURFACE_LAYER: LayerDefinition = {
    id: 10,
    name: '地表',
    category: 'surface',
    order: 10,
};

export const CLASSIC_LAYERS: LayerDefinition[] = [SURFACE_LAYER];
