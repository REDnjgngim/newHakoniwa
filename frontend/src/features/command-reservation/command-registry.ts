import type { CommandDefinition } from './command-definition-types';
import { CLASSIC_COMMANDS } from '@/rules/classic';

export const COMMAND_REGISTRY: CommandDefinition[] = CLASSIC_COMMANDS;

export function getCommandDefinition(commandCode: string): CommandDefinition | undefined {
    return COMMAND_REGISTRY.find((def) => def.commandCode === commandCode);
}

export function getCommandDefinitionByName(name: string): CommandDefinition | undefined {
    return COMMAND_REGISTRY.find((def) => def.name === name);
}
