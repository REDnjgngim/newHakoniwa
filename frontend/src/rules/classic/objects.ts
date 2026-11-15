export const CLASSIC_OBJECT_TYPES = {
    FARM: 'farm',
    MINE: 'mine',
    WOODS: 'woods',
    TOWN: 'town',
} as const;

export type ClassicObjectType = (typeof CLASSIC_OBJECT_TYPES)[keyof typeof CLASSIC_OBJECT_TYPES];
