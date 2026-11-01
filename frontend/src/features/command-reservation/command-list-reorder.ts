import type { ReservationCommand } from './types';

export function mapReorderIndicesToIds(
    commands: ReservationCommand[],
    fromIndex: number,
    toIndex: number
): { fromId: string; toId: string | null } | null {
    if (fromIndex < 0 || fromIndex >= commands.length) return null;
    if (toIndex < 0) return null;
    if (fromIndex === toIndex) return null;
    const fromId = commands[fromIndex]?.id;
    if (!fromId) return null;
    const nonDragged = commands.filter((_, i) => i !== fromIndex);
    const toId = toIndex >= nonDragged.length ? null : (nonDragged[toIndex]?.id ?? null);
    return { fromId, toId };
}
