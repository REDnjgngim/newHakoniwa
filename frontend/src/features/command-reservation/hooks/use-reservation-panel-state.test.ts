import { describe, it, expect } from 'vitest';
import { reducer } from './use-reservation-panel-state';
import type { PanelState, PanelAction } from './use-reservation-panel-state';

const initial: PanelState = {
    activeTab: 'reservation',
    focusedId: null,
    expandedIds: new Set(),
    toastMessage: '',
    isToastVisible: false,
};

describe('use-reservation-panel-state reducer', () => {
    it('CHANGE_TAB', () => {
        const s = reducer(initial, { type: 'CHANGE_TAB', tab: 'reservation' } as PanelAction);
        expect(s.activeTab).toBe('reservation');
    });
    it('SELECT_COMMAND null', () => {
        const s = reducer({ ...initial, focusedId: 'x' }, { type: 'SELECT_COMMAND', id: null });
        expect(s.focusedId).toBeNull();
    });
    it('TOGGLE_EXPAND add/remove', () => {
        const s1 = reducer(initial, { type: 'TOGGLE_EXPAND', id: 'a' });
        expect(s1.expandedIds.has('a')).toBe(true);
        const s2 = reducer(s1, { type: 'TOGGLE_EXPAND', id: 'a' });
        expect(s2.expandedIds.has('a')).toBe(false);
    });
    it('TOGGLE_ALL_EXPAND', () => {
        const s1 = reducer(initial, { type: 'TOGGLE_ALL_EXPAND', commandIds: ['a', 'b'] });
        expect(s1.expandedIds.size).toBe(2);
        const s2 = reducer(s1, { type: 'TOGGLE_ALL_EXPAND', commandIds: ['a', 'b'] });
        expect(s2.expandedIds.size).toBe(0);
    });
    it('SHOW_TOAST/HIDE_TOAST', () => {
        const s1 = reducer(initial, { type: 'SHOW_TOAST', message: 'hi' });
        expect(s1.toastMessage).toBe('hi');
        expect(s1.isToastVisible).toBe(true);
        const s2 = reducer(s1, { type: 'HIDE_TOAST' });
        expect(s2.isToastVisible).toBe(false);
    });
});
