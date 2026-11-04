import type { CommandDefinition } from './command-definition-types';
import type { Coordinate, SectorData } from '@/shared/terrain-types';

export type CommandExecutionResult = {
    ok: boolean;
    reason?: string;
};

export function canExecuteCommand(
    def: CommandDefinition,
    sector: SectorData,
    coord?: Coordinate
): CommandExecutionResult {
    if (def.hasCoordinate) {
        if (!coord) return { ok: false, reason: '座標が必要です' };
        const terrain = sector.terrain_grid[coord.y]?.[coord.x];
        if (!terrain) return { ok: false, reason: '範囲外の座標です' };
        if (def.allowedTerrains && def.allowedTerrains.length > 0) {
            if (!def.allowedTerrains.includes(terrain.type)) {
                return { ok: false, reason: 'この地形では実行できません' };
            }
        }
        const objectsAtCoord = sector.objects.filter((o) => o.coordinate.x === coord.x && o.coordinate.y === coord.y);
        if (def.requiresNoObject && objectsAtCoord.length > 0) {
            return { ok: false, reason: 'オブジェクトが存在します' };
        }
        const allowedObjects = def.allowedObjects;
        if (allowedObjects && objectsAtCoord.length > 0) {
            const allAllowed = objectsAtCoord.every((o) => allowedObjects.includes(o.objectType));
            if (!allAllowed) return { ok: false, reason: 'このオブジェクトでは実行できません' };
        }
    }
    return { ok: true };
}
