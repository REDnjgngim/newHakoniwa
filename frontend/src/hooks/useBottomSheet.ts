import { useState, useCallback } from 'react';
import type { BottomSheetSnap } from '../types/command-reservation';

export interface UseBottomSheetReturn {
    snap: BottomSheetSnap;
    setSnap: (snap: BottomSheetSnap) => void;
    toggleSnap: () => void;
    snapHeightStyle: React.CSSProperties;
    handleDragHandleClick: () => void;
}

export function useBottomSheet(initialSnap: BottomSheetSnap = 'half'): UseBottomSheetReturn {
    const [snap, setSnap] = useState<BottomSheetSnap>(initialSnap);

    // タップやクリックでの順次トグル（half -> expanded -> collapsed -> half）
    const toggleSnap = useCallback(() => {
        setSnap((prev) => {
            if (prev === 'collapsed') return 'half';
            if (prev === 'half') return 'expanded';
            return 'collapsed';
        });
    }, []);

    const handleDragHandleClick = useCallback(() => {
        toggleSnap();
    }, [toggleSnap]);

    // スナップごとのスタイル定義
    let heightClass = '50dvh';
    if (snap === 'collapsed') {
        heightClass = '4rem'; // タブとハンドルバーが見える高さ
    } else if (snap === 'expanded') {
        heightClass = '90dvh';
    }

    const snapHeightStyle: React.CSSProperties = {
        height: heightClass,
        maxHeight: '92dvh',
        transition: 'height 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
    };

    return {
        snap,
        setSnap,
        toggleSnap,
        snapHeightStyle,
        handleDragHandleClick,
    };
}
