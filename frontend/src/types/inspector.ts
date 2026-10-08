export type InspectorType = 'map' | 'command-list' | 'island-info' | 'log';

export interface InspectorProps {
    id: string;
    type: InspectorType;
}
