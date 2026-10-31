import { useReducer, useCallback } from 'react';
import type { ReservationCommand, TabType } from '../types';

type PanelState = {
    activeTab: TabType;
    focusedId: string | null;
    expandedIds: Set<string>;
    toastMessage: string;
    isToastVisible: boolean;
};

type PanelAction =
    | { type: 'CHANGE_TAB'; tab: TabType }
    | { type: 'SELECT_COMMAND'; id: string | null }
    | { type: 'TOGGLE_EXPAND'; id: string }
    | { type: 'TOGGLE_ALL_EXPAND'; commandIds: string[] }
    | { type: 'SHOW_TOAST'; message: string }
    | { type: 'HIDE_TOAST' };

function reducer(state: PanelState, action: PanelAction): PanelState {
    switch (action.type) {
        case 'CHANGE_TAB':
            return { ...state, activeTab: action.tab };
        case 'SELECT_COMMAND':
            return { ...state, focusedId: action.id };
        case 'TOGGLE_EXPAND': {
            const next = new Set(state.expandedIds);
            if (next.has(action.id)) next.delete(action.id);
            else next.add(action.id);
            return { ...state, expandedIds: next };
        }
        case 'TOGGLE_ALL_EXPAND': {
            if (state.expandedIds.size === action.commandIds.length && action.commandIds.length > 0) {
                return { ...state, expandedIds: new Set() };
            }
            return { ...state, expandedIds: new Set(action.commandIds) };
        }
        case 'SHOW_TOAST':
            return { ...state, toastMessage: action.message, isToastVisible: true };
        case 'HIDE_TOAST':
            return { ...state, isToastVisible: false };
        default:
            return state;
    }
}

const initialState: PanelState = {
    activeTab: 'reservation',
    focusedId: null,
    expandedIds: new Set(),
    toastMessage: '',
    isToastVisible: false,
};

export type UseReservationPanelStateReturn = {
    activeTab: TabType;
    focusedId: string | null;
    expandedIds: Set<string>;
    toastMessage: string;
    isToastVisible: boolean;
    changeTab: (tab: TabType) => void;
    selectCommand: (command: ReservationCommand | null) => void;
    toggleExpand: (id: string) => void;
    toggleAllExpand: (commandIds: string[]) => void;
    showToast: (message: string) => void;
    hideToast: () => void;
};

export function useReservationPanelState(): UseReservationPanelStateReturn {
    const [state, dispatch] = useReducer(reducer, initialState);

    const changeTab = useCallback((tab: TabType) => dispatch({ type: 'CHANGE_TAB', tab }), []);
    const selectCommand = useCallback(
        (command: ReservationCommand | null) => dispatch({ type: 'SELECT_COMMAND', id: command ? command.id : null }),
        []
    );
    const toggleExpand = useCallback((id: string) => dispatch({ type: 'TOGGLE_EXPAND', id }), []);
    const toggleAllExpand = useCallback(
        (commandIds: string[]) => dispatch({ type: 'TOGGLE_ALL_EXPAND', commandIds }),
        []
    );
    const showToast = useCallback((message: string) => dispatch({ type: 'SHOW_TOAST', message }), []);
    const hideToast = useCallback(() => dispatch({ type: 'HIDE_TOAST' }), []);

    return {
        activeTab: state.activeTab,
        focusedId: state.focusedId,
        expandedIds: state.expandedIds,
        toastMessage: state.toastMessage,
        isToastVisible: state.isToastVisible,
        changeTab,
        selectCommand,
        toggleExpand,
        toggleAllExpand,
        showToast,
        hideToast,
    };
}
