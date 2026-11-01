import { getCommandDefinition, getCommandDefinitionByName, COMMAND_REGISTRY } from './command-registry';

describe('command-registry', () => {
    it('存在する code で定義を返す', () => {
        expect(getCommandDefinition('MISSILE')?.commandCode).toBe('MISSILE');
    });
    it('未登録 code で undefined', () => {
        expect(getCommandDefinition('NOPE')).toBeUndefined();
    });
    it('存在する name で定義を返す', () => {
        expect(getCommandDefinitionByName('通常ミサイル')?.commandCode).toBe('MISSILE');
    });
    it('未登録 name で undefined', () => {
        expect(getCommandDefinitionByName('存在しない')).toBeUndefined();
    });
    it('commandCode が一意', () => {
        const codes = COMMAND_REGISTRY.map((d) => d.commandCode);
        expect(new Set(codes).size).toBe(codes.length);
    });
    it('hasCoordinate が座標必須コマンドに付与', () => {
        const withCoord = COMMAND_REGISTRY.filter((d) => d.hasCoordinate).map((d) => d.commandCode);
        expect(withCoord).toContain('MISSILE');
    });
    it('parameterSchemas の key が一意', () => {
        for (const def of COMMAND_REGISTRY) {
            const keys = def.parameterSchemas.map((s) => s.key);
            expect(new Set(keys).size).toBe(keys.length);
        }
    });
    it('slider の min <= max', () => {
        for (const def of COMMAND_REGISTRY) {
            for (const s of def.parameterSchemas) {
                if (s.kind === 'slider') {
                    expect(s.min).toBeLessThanOrEqual(s.max);
                }
            }
        }
    });
    it('slider の scale 未指定時は 1 相当', () => {
        for (const def of COMMAND_REGISTRY) {
            for (const s of def.parameterSchemas) {
                if (s.kind === 'slider') {
                    expect(s.scale ?? 1).toBeGreaterThanOrEqual(1);
                }
            }
        }
    });
    it('全定義に estimatedTurn / estimatedFundsDelta が数値', () => {
        for (const def of COMMAND_REGISTRY) {
            expect(typeof def.estimatedTurn).toBe('number');
            expect(typeof def.estimatedFundsDelta).toBe('number');
        }
    });
});
