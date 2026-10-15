import React, { useState, useCallback } from 'react';
import type { ReservationCommand, TabType } from '../../types/command-reservation';
import { mockReservationCommands } from '../../mocks/command-reservation';
import { useReservationHistory } from '../../hooks/useReservationHistory';
import { BottomSheetContainer } from './BottomSheetContainer';
import { PanelTabBar } from './PanelTabBar';
import { CommandList } from './CommandList';
import { PanelFooter } from './PanelFooter';
import { ToastNotification } from './ToastNotification';

export interface CommandReservationPanelProps {
    initialCommands?: ReservationCommand[];
    onSelectCommand?: (command: ReservationCommand | null) => void;
}

export const CommandReservationPanel: React.FC<CommandReservationPanelProps> = ({
    initialCommands = mockReservationCommands,
    onSelectCommand,
}) => {
    const { commands, updateCommand, deleteCommand, reorderCommands, undo, redo, canUndo, canRedo, markSaved } =
        useReservationHistory(initialCommands);
    // タブ選択状態（デフォルト「予約」）
    const [activeTab, setActiveTab] = useState<TabType>('reservation');

    // 行選択状態
    const [focusedId, setFocusedId] = useState<string | null>(null);

    // アコーディオン開閉状態（展開中のID一覧）
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

    // トースト通知状態
    const [isToastVisible, setIsToastVisible] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>('');

    // 行選択処理
    const handleSelectCommand = useCallback(
        (cmd: ReservationCommand | null) => {
            setFocusedId(cmd ? cmd.id : null);
            onSelectCommand?.(cmd);
        },
        [onSelectCommand]
    );

    // 個別アコーディオン開閉
    const handleToggleExpand = useCallback((id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    // 一括開閉 [全開/全閉]
    const handleToggleAll = useCallback(() => {
        setExpandedIds((prev) => {
            if (prev.size === commands.length) {
                // すべて開いていれば全閉
                return new Set();
            }
            // 1つでも閉じていれば全開
            return new Set(commands.map((c) => c.id));
        });
    }, [commands]);

    // 予約登録 [予約登録]
    const handleSubmit = useCallback(() => {
        markSaved();
        setToastMessage('予約を登録しました');
        setIsToastVisible(true);
    }, [markSaved]);

    return (
        <BottomSheetContainer>
            {/* 上部タブバー */}
            <PanelTabBar activeTab={activeTab} onChangeTab={setActiveTab} />

            {/* トースト通知 */}
            <ToastNotification
                message={toastMessage}
                isVisible={isToastVisible}
                onClose={() => setIsToastVisible(false)}
            />

            {/* タブコンテンツ */}
            {activeTab === 'reservation' ? (
                <>
                    <CommandList
                        commands={commands}
                        expandedIds={expandedIds}
                        focusedId={focusedId}
                        onToggleExpand={handleToggleExpand}
                        onSelectCommand={handleSelectCommand}
                        onUpdateCommand={updateCommand}
                        onDeleteCommand={deleteCommand}
                        onReorderCommands={reorderCommands}
                    />
                    <PanelFooter
                        canUndo={canUndo}
                        canRedo={canRedo}
                        onUndo={undo}
                        onRedo={redo}
                        onToggleAllAccordion={handleToggleAll}
                        onSubmit={handleSubmit}
                    />
                </>
            ) : activeTab === 'log' ? (
                <div
                    data-testid="tab-content-log"
                    className="flex flex-1 items-center justify-center p-6 text-sm text-slate-400"
                >
                    ログ機能は準備中です
                </div>
            ) : (
                <div
                    data-testid="tab-content-message"
                    className="flex flex-1 items-center justify-center p-6 text-sm text-slate-400"
                >
                    通信機能は準備中です
                </div>
            )}
        </BottomSheetContainer>
    );
};

export default CommandReservationPanel;
