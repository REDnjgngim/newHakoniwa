import type { ReactNode } from 'react';
import type { InspectorProps } from '../../types/inspector';

// ============================================================================
// 画面上の独立した UI ブロック（マップ・コマンドリスト・島情報・ログ等）の境界。
// id / type で識別でき、将来的に InspectorFrame 内へ複数並列配置できる設計にする。
// 今回は InspectorFrame 内を埋める 1 個だけを使う。
// ============================================================================

export interface InspectorComponentProps extends InspectorProps {
    children?: ReactNode;
}

export default function Inspector({ id, type, children }: InspectorComponentProps) {
    return (
        <div
            data-inspector-id={id}
            data-inspector-type={type}
            style={{ width: '100%', height: '100%', pointerEvents: 'auto', overflow: 'hidden' }}
        >
            {children}
        </div>
    );
}
