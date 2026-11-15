/** 表示中（またはフェードアウト中）の対象と、その表示状態 */
export type Presence<T> = {
    item: T;
    /** 対象の識別キー。React の key に使い、変わったら入場アニメを再生する */
    key: string;
    visible: boolean;
};

export type UsePresenceOptions<T> = {
    getKey: (value: T) => string;
    /** 非表示にしてからアンマウントするまでの時間（CSS の transition 時間と合わせる） */
    exitDurationMs: number;
};
