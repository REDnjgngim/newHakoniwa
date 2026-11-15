import type { ReservationCommand } from './types';

export function isFastCommand(command: ReservationCommand): boolean {
    return command.commandType === 'fast';
}

export function resolveDetailLine(command: ReservationCommand): string | null {
    return command.summaryText?.trim() ? command.summaryText : null;
}

export function resolveTargetIslandLine(command: ReservationCommand): string | null {
    const value = command.params?.targetIsland;
    return typeof value === 'string' && value.trim() ? value : null;
}

export function resolveStackCount(command: ReservationCommand): number | undefined {
    const value = command.params?.stackCount;
    return typeof value === 'number' ? value : undefined;
}

export function isThreeLines(command: ReservationCommand): boolean {
    return resolveTargetIslandLine(command) !== null;
}

export function formatOrder(displayOrder: number): string {
    return String(displayOrder).padStart(2, '0');
}
