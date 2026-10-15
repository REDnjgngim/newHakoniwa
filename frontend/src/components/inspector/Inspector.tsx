import type { ReactNode } from 'react';
import type { InspectorProps } from '../../types/inspector';

// ============================================================================
// 画面上の独立した UI ブロック（マップ・コマンドリスト・島情報・ログ等）の境界。
// id / type で識別でき、将来的に InspectorFrame 内へ複数並列配置できる設計にする。
// 今回は InspectorFrame 内を埋める 1 個だけを使う。
// ============================================================================

export interface InspectorComponentProps extends InspectorProps {
    children?: ReactNode;
    className?: string;
}

export default function Inspector({ id, type, children, className = '' }: InspectorComponentProps) {
    return (
        <div
            data-inspector-id={id}
            data-inspector-type={type}
            className={`pointer-events-auto size-full overflow-hidden ${className}`}
        >
            {children}
        </div>
    );
}
