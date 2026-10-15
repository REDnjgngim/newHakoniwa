import Select, { type SingleValue } from 'react-select';

export interface IslandSearchOption {
    value: string;
    label: string;
}

interface IslandSearchSelectProps {
    label: string;
    options: IslandSearchOption[];
    value: string | null;
    onChange: (value: string) => void;
    commandId: string;
    labelSuffix?: string;
}

/**
 * 島・アイテム・艦隊選択用の検索付きドロップダウン。
 * react-select (unstyled + Tailwind classNames) のラッパー。
 */
export const IslandSearchSelect: React.FC<IslandSearchSelectProps> = ({
    label,
    options,
    value,
    onChange,
    commandId,
    labelSuffix,
}) => {
    const inputId = `island-search-${commandId}${labelSuffix ? `-${labelSuffix}` : ''}`;
    const selectedOption: SingleValue<IslandSearchOption> =
        options.find((opt) => opt.value === value || opt.label === value) ?? null;

    const handleChange = (option: SingleValue<IslandSearchOption>) => {
        if (option) {
            onChange(option.value);
        }
    };

    return (
        <div className="flex items-center gap-2 text-left text-xs">
            <label htmlFor={inputId} className="shrink-0 text-xs">
                {label}
            </label>
            <div className="inline-block w-auto max-w-55 min-w-30">
                <Select<IslandSearchOption, false>
                    inputId={inputId}
                    aria-label={label}
                    options={options}
                    value={selectedOption}
                    onChange={handleChange}
                    placeholder="選択..."
                    isSearchable
                    isClearable={false}
                    unstyled
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                    styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                    classNames={{
                        control: () =>
                            'border border-white/30 rounded bg-black/20 px-1.5 py-0.5 text-xs text-white cursor-pointer min-h-0',
                        menu: () => 'mt-1 rounded border border-slate-700 bg-slate-900 shadow-xl text-xs',
                        menuList: () => 'py-1 max-h-60 overflow-y-auto',
                        option: () => 'px-2 py-1 text-xs cursor-pointer',
                        input: () => 'text-xs text-white p-0 m-0',
                        placeholder: () => 'text-xs text-white/50',
                        singleValue: () => 'text-xs text-white',
                        valueContainer: () => 'py-0 px-1 gap-1',
                        indicatorsContainer: () => 'p-0 text-white/70',
                        dropdownIndicator: () => 'p-0.5 text-white/70 hover:text-white',
                        clearIndicator: () => 'p-0',
                    }}
                />
            </div>
        </div>
    );
};
