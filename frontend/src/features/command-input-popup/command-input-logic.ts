import { clampSliderValue, type CommandDefinition } from '@/features/command-reservation';
import type { CommandInputMode, CommandInputModeOption } from './types';

export const QUANTITY_MIN = 1;
export const QUANTITY_MAX = 99;
/** コマンド入力ポップアップのフェードアウト時間（CSS の duration-150 と合わせる） */
export const COMMAND_POPUP_EXIT_MS = 150;

export const COMMAND_INPUT_MODE_OPTIONS: readonly CommandInputModeOption[] = [
    { mode: 'classic', label: 'クラシック' },
    { mode: 'manage', label: '運営' },
];

/** 数量を整数に丸めて範囲内に収める（NaN は最小値） */
export function clampQuantity(value: number): number {
    return clampSliderValue(value, QUANTITY_MIN, QUANTITY_MAX);
}

/** モードごとの表示コマンド（クラシック: 座標あり / 運営: 座標なし） */
export function filterCommandsByMode(
    commands: readonly CommandDefinition[],
    mode: CommandInputMode
): CommandDefinition[] {
    return commands.filter((def) => (mode === 'classic' ? def.hasCoordinate : !def.hasCoordinate));
}
