export type IslandSearchOption = {
    value: string;
    label: string;
};

export function IslandSearchSelect({
    options,
    value,
    onChange,
}: {
    label?: string;
    options: IslandSearchOption[];
    value: string | null;
    onChange: (value: string) => void;
    commandId: string;
    labelSuffix?: string;
}) {
    return (
        <div className="flex items-center gap-2 text-left text-xs">
            <select
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                className="min-h-0 cursor-pointer rounded border border-white/30 bg-black/20 px-1.5 py-0.5 text-xs text-white"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
