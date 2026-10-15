import React, { useEffect } from 'react';

export interface ToastNotificationProps {
    message: string;
    isVisible: boolean;
    onClose: () => void;
    durationMs?: number;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
    message,
    isVisible,
    onClose,
    durationMs = 3000,
}) => {
    useEffect(() => {
        if (!isVisible) return;
        const timer = setTimeout(() => {
            onClose();
        }, durationMs);
        return () => clearTimeout(timer);
    }, [isVisible, durationMs, onClose]);

    if (!isVisible) return null;

    return (
        <div
            data-testid="toast-notification"
            className="animate-in fade-in slide-in-from-top-4 fixed top-12 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-emerald-400 bg-emerald-600/95 px-4 py-2 text-sm font-semibold text-white shadow-xl shadow-emerald-950/50 duration-200"
            role="status"
            aria-live="polite"
        >
            <span>✓</span>
            <span>{message}</span>
        </div>
    );
};
