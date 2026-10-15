import React from 'react';
import type { CommandDetailPattern, ReservationCommand } from '../../types/command-reservation';
import { mockFleets, mockIslands, mockItems } from '../../mocks/command-reservation';
import { IslandSearchSelect } from './IslandSearchSelect';
import { TerrainIcon } from './TerrainIcon';

export interface CommandDetailEditorProps {
    command: ReservationCommand;
    onUpdate: (updatedCommand: ReservationCommand) => void;
}

function detectPattern(command: ReservationCommand): CommandDetailPattern {
    const p = command.params ?? {};
    if ('missileCount' in p) return 'missile';
    if ('exportAmount' in p) return 'exportAmount';
    if ('itemName' in p) return 'item';
    if ('fleetName' in p) return 'fleet';
    if ('amount' in p) return 'amount';
    if ('scale' in p) return 'scale';
    if (command.stackCount !== undefined) return 'stack';
    if (command.coordinate) return 'coord-only';
    return 'none';
}

const EXPORT_AMOUNT_STEP = 10000;
const SCALE_AMOUNT_STEP = 200;
const SLIDER_MIN = 1;
const SLIDER_MAX = 99;

function clampSliderValue(value: number): number {
    if (Number.isNaN(value)) return SLIDER_MIN;
    return Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, Math.floor(value)));
}

function toNumberParam(value: string | number | boolean | undefined, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function getSliderValue(pattern: CommandDetailPattern, command: ReservationCommand): number {
    const params = command.params ?? {};
    switch (pattern) {
        case 'missile':
            return clampSliderValue(toNumberParam(params.missileCount, SLIDER_MIN));
        case 'exportAmount':
            return clampSliderValue(toNumberParam(params.exportAmount, EXPORT_AMOUNT_STEP) / EXPORT_AMOUNT_STEP);
        case 'amount':
            return clampSliderValue(toNumberParam(params.amount, SLIDER_MIN));
        case 'scale':
            return clampSliderValue(Math.round(toNumberParam(params.scale, SCALE_AMOUNT_STEP) / SCALE_AMOUNT_STEP));
        case 'stack':
            return clampSliderValue(command.stackCount ?? toNumberParam(params.stackCount, SLIDER_MIN));
        default:
            return SLIDER_MIN;
    }
}

function getSliderLabel(pattern: CommandDetailPattern): string {
    switch (pattern) {
        case 'missile':
            return '発射数';
        case 'exportAmount':
            return '輸出量';
        case 'amount':
            return '数量';
        case 'scale':
            return '規模';
        case 'stack':
            return '回数';
        default:
            return '';
    }
}

function getSliderDisplayValue(pattern: CommandDetailPattern, sliderValue: number): string {
    if (pattern === 'exportAmount') {
        return `${sliderValue * EXPORT_AMOUNT_STEP}トン`;
    }
    if (pattern === 'scale') {
        return `${sliderValue * SCALE_AMOUNT_STEP}億円`;
    }
    return `${sliderValue}`;
}
export const CommandDetailEditor: React.FC<CommandDetailEditorProps> = ({ command, onUpdate }) => {
    const pattern = detectPattern(command);
    const sliderValue = getSliderValue(pattern, command);
    const params = command.params ?? {};
    const targetIslandValue =
        typeof params.targetIsland === 'string' ? params.targetIsland : (command.targetIsland ?? null);
    const showSlider =
        pattern === 'missile' ||
        pattern === 'exportAmount' ||
        pattern === 'amount' ||
        pattern === 'scale' ||
        pattern === 'stack';
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
    const handleSliderValueChange = (nextSliderValue: number) => {
        const safeValue = clampSliderValue(nextSliderValue);
        const updatedParams = { ...command.params };
        if (pattern === 'missile') updatedParams.missileCount = safeValue;
        else if (pattern === 'exportAmount') updatedParams.exportAmount = safeValue * EXPORT_AMOUNT_STEP;
        else if (pattern === 'amount') updatedParams.amount = safeValue;
        else if (pattern === 'scale') updatedParams.scale = safeValue * SCALE_AMOUNT_STEP;
        else if (pattern === 'stack') updatedParams.stackCount = safeValue;
        else return;
        let summaryText = command.summaryText;
        if (pattern === 'missile') summaryText = `発射数: ${safeValue}発`;
        else if (pattern === 'exportAmount') summaryText = `輸出量: ${safeValue * EXPORT_AMOUNT_STEP}トン`;
        else if (pattern === 'amount') summaryText = `数量: ${safeValue}`;
        else if (pattern === 'scale') summaryText = `規模: ${safeValue * SCALE_AMOUNT_STEP}億円`;
        onUpdate({
            ...command,
            summaryText,
            stackCount: pattern === 'stack' ? safeValue : command.stackCount,
            params: updatedParams,
        });
    };
    const handleParamTextChange = (key: string, value: string) => {
        onUpdate({ ...command, params: { ...command.params, [key]: value } });
    };
    const handleTargetIslandChange = (islandName: string) => {
        onUpdate({ ...command, targetIsland: islandName, params: { ...command.params, targetIsland: islandName } });
    };
    return (
        <div
            data-testid={`command-detail-${command.id}`}
            className="w-full space-y-2 py-1 text-left text-white"
            onClick={(e) => e.stopPropagation()}
        >
            <HeaderRow command={command} onSelect={handleCoordSelect} />
            {showSlider && (
                <div className="flex items-center justify-start gap-2 text-left text-xs">
                    <span className="shrink-0">
                        {getSliderLabel(pattern)}: {getSliderDisplayValue(pattern, sliderValue)}
                    </span>
                    <button
                        type="button"
                        aria-label="値を減らす"
                        onClick={() => handleSliderValueChange(sliderValue - 1)}
                        className="shrink-0 rounded-full border border-current/30 px-2 leading-tight"
                    >
                        -
                    </button>
                    <input
                        type="range"
                        aria-label={`${getSliderLabel(pattern)}スライダー`}
                        min={SLIDER_MIN}
                        max={SLIDER_MAX}
                        value={sliderValue}
                        onChange={(e) => handleSliderValueChange(Number(e.target.value))}
                        className="min-w-0 flex-1 cursor-pointer"
                    />
                    <button
                        type="button"
                        aria-label="値を増やす"
                        onClick={() => handleSliderValueChange(sliderValue + 1)}
                        className="shrink-0 rounded-full border border-current/30 px-2 leading-tight"
                    >
                        +
                    </button>
                </div>
            )}
            <div className="mt-2 space-y-2 text-left">
                {pattern === 'missile' && (
                    <IslandSearchSelect
                        label="目標の島"
                        options={islandOptions}
                        value={targetIslandValue}
                        onChange={handleTargetIslandChange}
                        commandId={command.id}
                        labelSuffix="target"
                    />
                )}
                {pattern === 'item' && (
                    <IslandSearchSelect
                        label="アイテム"
                        options={itemOptions}
                        value={typeof params.itemName === 'string' ? params.itemName : null}
                        onChange={(value) => handleParamTextChange('itemName', value)}
                        commandId={command.id}
                        labelSuffix="item"
                    />
                )}
                {pattern === 'fleet' && (
                    <>
                        <IslandSearchSelect
                            label="対象"
                            options={fleetOptions}
                            value={typeof params.fleetName === 'string' ? params.fleetName : null}
                            onChange={(value) => handleParamTextChange('fleetName', value)}
                            commandId={command.id}
                            labelSuffix="fleet"
                        />
                        {command.name !== '戦艦建造' && (
                            <>
                                <IslandSearchSelect
                                    label="移動元の島"
                                    options={islandOptions}
                                    value={typeof params.sourceIsland === 'string' ? params.sourceIsland : null}
                                    onChange={(value) => handleParamTextChange('sourceIsland', value)}
                                    commandId={command.id}
                                    labelSuffix="source"
                                />
                                <IslandSearchSelect
                                    label="移動先の島"
                                    options={islandOptions}
                                    value={targetIslandValue}
                                    onChange={handleTargetIslandChange}
                                    commandId={command.id}
                                    labelSuffix="destination"
                                />
                            </>
                        )}
                    </>
                )}
            </div>
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
};

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
