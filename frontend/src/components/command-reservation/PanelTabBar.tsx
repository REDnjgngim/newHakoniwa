import React from 'react';
import type { TabType } from '../../types/command-reservation';

export interface PanelTabBarProps {
    activeTab: TabType;
    onChangeTab: (tab: TabType) => void;
}

export const PanelTabBar: React.FC<PanelTabBarProps> = ({ activeTab, onChangeTab }) => {
    const tabs: { key: TabType; label: string }[] = [
        { key: 'reservation', label: '予約' },
        { key: 'log', label: 'ログ' },
        { key: 'message', label: '通信' },
    ];

    return (
        <div
            data-testid="panel-tab-bar"
            className="flex items-center gap-1 border-b border-slate-700/80 bg-slate-900/90 px-2 pt-1 text-xs select-none"
        >
            {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                    <button
                        key={tab.key}
                        type="button"
                        data-testid={`tab-${tab.key}`}
                        onClick={() => onChangeTab(tab.key)}
                        className={`flex items-center gap-1 rounded-t-md px-3 py-1.5 font-medium transition-colors ${
                            isActive
                                ? 'border-x border-t-2 border-slate-700 border-t-sky-400 bg-slate-800 text-sky-400'
                                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                        }`}
                    >
                        <span>{isActive ? '◎' : '○'}</span>
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
};
