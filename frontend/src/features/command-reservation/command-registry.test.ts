import { getCommandDefinition, COMMAND_REGISTRY } from './command-registry';

describe('command-definition', () => {
    it('COMMAND_REGISTRY が空でない', () => {
        expect(COMMAND_REGISTRY.length).toBeGreaterThan(0);
    });
    it('getCommandDefinition が MISSILE を返す', () => {
        expect(getCommandDefinition('MISSILE')?.name).toBe('通常ミサイル');
    });
});
