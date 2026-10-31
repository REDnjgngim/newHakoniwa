import type { ReservationCommand, TabType } from '../types';

export type UseReservationPanelStateReturn = {
    activeTab: TabType;
    focusedId: string | null;
    expandedIds: Set<string>;
    toastMessage: string;
    isToastVisible: boolean;
    changeTab: (tab: TabType) => void;
    selectCommand: (command: ReservationCommand | null) => void;
    toggleExpand: (id: string) => void;
    toggleAllExpand: () => void;
    showToast: (message: string) => void;
    hideToast: () => void;
};

// Step 4 で実装
// eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
export function useReservationPanelState(): UseReservationPanelStateReturn {
    throw new Error('useReservationPanelState is not implemented yet');
}
