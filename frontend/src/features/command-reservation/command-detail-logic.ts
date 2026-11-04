import type { ReservationCommand } from './types';
import { getCommandDefinition } from './command-registry';
import type {
    CommandDefinition,
    ParameterSchema,
    SliderParamSchema,
    SelectParamSchema,
} from './command-definition-types';
import type { IslandSearchOption } from './components/IslandSearchSelect';

export function resolveDefinition(command: ReservationCommand): CommandDefinition | undefined {
    return getCommandDefinition(command.commandCode);
}

export function clampSliderValue(value: number, min: number, max: number): number {
    if (Number.isNaN(value)) return min;
    return Math.min(max, Math.max(min, Math.floor(value)));
}

export function toNumberParam(value: string | number | boolean | undefined, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function resolveTargetIslandValue(params: ReservationCommand['params']): string | null {
    if (typeof params?.targetIsland === 'string') return params.targetIsland;
    return null;
}

export type SliderUpdateResult = {
    updatedParams: NonNullable<ReservationCommand['params']>;
    actualValue: number;
    summaryText: string;
};

export function computeSliderUpdate(
    schema: SliderParamSchema,
    command: ReservationCommand,
    nextSliderValue: number
): SliderUpdateResult {
    const min = schema.min;
    const max = schema.max;
    const scale = schema.scale ?? 1;
    const safeValue = clampSliderValue(nextSliderValue, min, max);
    const updatedParams = { ...(command.params ?? {}) };
    const actualValue = safeValue * scale;
    updatedParams[schema.key] = actualValue;
    const summaryText = schema.unit ? `${schema.label}: ${actualValue}${schema.unit}` : `${schema.label}: ${safeValue}`;
    return { updatedParams, actualValue, summaryText };
}

export function getSelectOptions(
    _schema: SelectParamSchema,
    islandOptions: IslandSearchOption[]
): IslandSearchOption[] {
    return islandOptions;
}

export function buildCoordUpdate(command: ReservationCommand, axis: 'x' | 'y', next: number): ReservationCommand {
    return {
        ...command,
        coordinate: {
            x: axis === 'x' ? next : (command.coordinate?.x ?? 0),
            y: axis === 'y' ? next : (command.coordinate?.y ?? 0),
        },
    };
}

export function buildTargetIslandUpdate(command: ReservationCommand, islandName: string): ReservationCommand {
    return {
        ...command,
        params: { ...command.params, targetIsland: islandName },
    };
}

export type { ParameterSchema };
