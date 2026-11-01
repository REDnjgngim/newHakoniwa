import type { ReservationCommand } from '../types';
import { mockFleets, mockIslands, mockItems } from '../mocks/command-reservation';
import { IslandSearchSelect } from './IslandSearchSelect';
import { TerrainIcon } from './TerrainIcon';
import { getCommandDefinition, getCommandDefinitionByName } from '../command-registry';
import type { ParameterSchema, SliderParamSchema, SelectParamSchema } from '../command-definition-types';

export type CommandDetailEditorProps = {
    command: ReservationCommand;
    onUpdate: (updatedCommand: ReservationCommand) => void;
};

function resolveDefinition(command: ReservationCommand) {
    if (command.commandCode) {
        const def = getCommandDefinition(command.commandCode);
        if (def) return def;
    }
    return getCommandDefinitionByName(command.name);
}

function clampSliderValue(value: number, min: number, max: number): number {
    if (Number.isNaN(value)) return min;
    return Math.min(max, Math.max(min, Math.floor(value)));
}

function toNumberParam(value: string | number | boolean | undefined, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function CommandDetailEditor({ command, onUpdate }: CommandDetailEditorProps) {
    const definition = resolveDefinition(command);
    const params = command.params ?? {};
    const targetIslandValue =
        typeof params.targetIsland === 'string' ? params.targetIsland : (command.targetIsland ?? null);
    const islandOptions = mockIslands.map((island) => ({ value: island.name, label: island.name }));
    const itemOptions = mockItems.map((item) => ({ value: item.name, label: item.name }));
    const fleetOptions = mockFleets.map((fleet) => ({ value: fleet.name, label: fleet.name }));

    const handleCoordSelect = (axis: 'x' | 'y', next: number) => {
        onUpdate({
            ...command,
            coordinate: {
                x: axis === 'x' ? next : (command.coordinate?.x ?? 0),
                y: axis === 'y' ? next : (command.coordinate?.y ?? 0),
            },
        });
    };
    const handleParamTextChange = (key: string, value: string) => {
        onUpdate({ ...command, params: { ...command.params, [key]: value } });
    };
    const handleTargetIslandChange = (islandName: string) => {
        onUpdate({ ...command, targetIsland: islandName, params: { ...command.params, targetIsland: islandName } });
    };

    const getSelectOptions = (schema: SelectParamSchema) => {
        if (schema.kind === 'item-select') return itemOptions;
        if (schema.kind === 'fleet-select') return fleetOptions;
        return islandOptions;
    };

    const handleSliderValueChange = (schema: SliderParamSchema, nextSliderValue: number) => {
        const min = schema.min;
        const max = schema.max;
        const scale = schema.scale ?? 1;
        const safeValue = clampSliderValue(nextSliderValue, min, max);
        const updatedParams = { ...command.params };
        const actualValue = safeValue * scale;
        updatedParams[schema.key] = actualValue;
        const summaryText = schema.unit
            ? `${schema.label}: ${actualValue}${schema.unit}`
            : `${schema.label}: ${safeValue}`;
        const stackCountUpdate =
            schema.key === 'stackCount' && command.commandCode === 'RECRUIT' ? safeValue : command.stackCount;
        onUpdate({
            ...command,
            summaryText,
            stackCount: stackCountUpdate,
            params: updatedParams,
        });
    };

    const schemas: ParameterSchema[] = definition?.parameterSchemas ?? [];

    return (
        <div
            data-testid={`command-detail-${command.id}`}
            className="w-full space-y-2 py-1 text-left text-white"
            onClick={(e) => e.stopPropagation()}
        >
            <HeaderRow command={command} onSelect={handleCoordSelect} />
            {schemas.map((schema) => {
                if (schema.kind === 'slider') {
                    const scale = schema.scale ?? 1;
                    const min = schema.min;
                    const max = schema.max;
                    const raw = toNumberParam(params[schema.key], min * scale);
                    const sliderValue = clampSliderValue(Math.round(raw / scale), min, max);
                    const displayValue = schema.unit ? `${sliderValue * scale}${schema.unit}` : `${sliderValue}`;
                    return (
                        <div key={schema.key} className="flex items-center justify-start gap-2 text-left text-xs">
                            <span className="shrink-0">
                                {schema.label}: {displayValue}
                            </span>
                            <button
                                type="button"
                                aria-label="値を減らす"
                                onClick={() => handleSliderValueChange(schema, sliderValue - 1)}
                                className="shrink-0 rounded-full border border-current/30 px-2 leading-tight"
                            >
                                −
                            </button>
                            <input
                                type="range"
                                min={min}
                                max={max}
                                value={sliderValue}
                                onChange={(e) => handleSliderValueChange(schema, Number(e.target.value))}
                                className="h-1 w-24 cursor-pointer accent-white"
                            />
                            <button
                                type="button"
                                aria-label="値を増やす"
                                onClick={() => handleSliderValueChange(schema, sliderValue + 1)}
                                className="shrink-0 rounded-full border border-current/30 px-2 leading-tight"
                            >
                                ＋
                            </button>
                        </div>
                    );
                }
                const selectSchema = schema;
                const options = getSelectOptions(selectSchema);
                const paramValue = params[selectSchema.key];
                const value =
                    selectSchema.key === 'targetIsland'
                        ? targetIslandValue
                        : typeof paramValue === 'string'
                          ? paramValue
                          : null;
                const onChange =
                    selectSchema.key === 'targetIsland'
                        ? handleTargetIslandChange
                        : (v: string | null) => handleParamTextChange(selectSchema.key, v ?? '');
                return (
                    <IslandSearchSelect
                        key={selectSchema.key}
                        label={selectSchema.label}
                        options={options}
                        value={value}
                        onChange={onChange}
                        commandId={command.id}
                        labelSuffix={selectSchema.labelSuffix}
                    />
                );
            })}
            <div className="mt-2 space-y-0.5 border-t border-white/20 pt-1 text-left text-[10px] leading-tight text-white/90 sm:text-[11px]">
                <div>実行予定ターン: T{command.estimatedTurn}</div>
                <div>
                    [T{command.estimatedTurn}でのここまでの推定資金増減:{' '}
                    <span className="font-bold">
                        {command.estimatedFundsDelta >= 0 ? '+' : ''}
                        {command.estimatedFundsDelta}億円
                    </span>
                    ]
                </div>
            </div>
        </div>
    );
}

function HeaderRow({
    command,
    onSelect,
}: {
    command: ReservationCommand;
    onSelect: (axis: 'x' | 'y', next: number) => void;
}) {
    if (!command.coordinate) return <div className="text-left text-xs font-medium sm:text-sm">{command.name}</div>;
    return (
        <div className="flex items-center gap-1.5 text-left text-xs font-medium sm:text-sm">
            <span className="inline-flex items-center">
                (<CoordSelect axis="x" value={command.coordinate.x} onSelect={onSelect} />
            </span>
            <span>,</span>
            <span className="inline-flex items-center">
                <CoordSelect axis="y" value={command.coordinate.y} onSelect={onSelect} />)
            </span>
            <TerrainIcon coordinate={command.coordinate} size={20} />
            <span>{command.name}</span>
        </div>
    );
}

function CoordSelect({
    axis,
    value,
    onSelect,
}: {
    axis: 'x' | 'y';
    value: number;
    onSelect: (axis: 'x' | 'y', next: number) => void;
}) {
    return (
        <select
            aria-label={axis === 'x' ? 'X座標選択' : 'Y座標選択'}
            value={value}
            onChange={(e) => onSelect(axis, Number(e.target.value))}
            className="cursor-pointer appearance-none rounded bg-black/30 px-0.5 text-center font-bold text-white underline decoration-dotted underline-offset-4"
        >
            {Array.from({ length: 30 }, (_, i) => i).map((v) => (
                <option key={v} value={v} className="bg-slate-900 text-white">
                    {v}
                </option>
            ))}
        </select>
    );
}
