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
        <div className="flex items-center justify-between gap-2">
            <label htmlFor={inputId} className="shrink-0 text-sm">
                {label}
            </label>
            <div className="min-w-0 flex-1">
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
                            'border border-amber-200/40 rounded bg-amber-950/60 px-2 py-1 text-sm text-white cursor-pointer',
                        menu: () => 'mt-1 rounded border border-amber-200/30 bg-amber-900 shadow-lg z-50',
                        menuList: () => 'py-1 max-h-60 overflow-y-auto',
                        option: (state) =>
                            state.isFocused || state.isSelected
                                ? 'px-3 py-1.5 text-sm cursor-pointer bg-amber-700 text-white'
                                : 'px-3 py-1.5 text-sm text-amber-100 cursor-pointer',
                        input: () => 'text-white text-sm',
                        placeholder: () => 'text-amber-200/50',
                        singleValue: () => 'text-white',
                        valueContainer: () => 'gap-1',
                        indicatorsContainer: () => 'text-amber-200/70',
                        dropdownIndicator: () => 'px-1 text-amber-200/70 hover:text-white',
                        clearIndicator: () => 'px-1',
                    }}
                />
            </div>
        </div>
    );
};
