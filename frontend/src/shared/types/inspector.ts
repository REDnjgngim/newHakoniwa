export type InspectorType = 'map' | 'command-list' | 'island-info' | 'log';

export type InspectorProps = {
    id: string;
    type: InspectorType;
};
