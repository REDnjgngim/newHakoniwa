import { useState, useRef, useEffect } from 'react';

export type IslandSearchOption = {
    value: string;
    label: string;
};

type IslandSearchSelectProps = {
    label: string;
    options: IslandSearchOption[];
    value: string | null;
    onChange: (value: string) => void;
    commandId: string;
    labelSuffix?: string;
};

/**
 * 島・アイテム・艦隊選択用の検索付きドロップダウン。
 * React 標準フック + Tailwind CSS の軽量な独自実装。
 */
export function IslandSearchSelect({
    label,
    options,
    value,
    onChange,
    commandId,
    labelSuffix,
}: IslandSearchSelectProps) {
    const inputId = `island-search-${commandId}${labelSuffix ? `-${labelSuffix}` : ''}`;
    const selectedLabel = options.find((opt) => opt.value === value || opt.label === value)?.label ?? '選択...';

    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter((opt) => opt.label.includes(query));

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !(e.target instanceof Node && containerRef.current.contains(e.target))) {
                setIsOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setQuery('');
        } else if (e.key === 'Enter') {
            const opt = filteredOptions[highlightedIndex];
            if (opt) {
                onChange(opt.value);
                setIsOpen(false);
                setQuery('');
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (filteredOptions.length === 0) return;
            setHighlightedIndex((i) => (i + 1) % filteredOptions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (filteredOptions.length === 0) return;
            setHighlightedIndex((i) => (i - 1 + filteredOptions.length) % filteredOptions.length);
        }
    };

    return (
        <div ref={containerRef} className="relative flex items-center gap-2 text-left text-xs">
            <label htmlFor={inputId} className="shrink-0 text-xs">
                {label}
            </label>
            <div className="relative inline-block w-auto max-w-55 min-w-30">
                <button
                    type="button"
                    id={inputId}
                    aria-label={label}
                    onClick={() => setIsOpen(!isOpen)}
                    className="min-h-0 w-full cursor-pointer rounded border border-white/30 bg-black/20 px-1.5 py-0.5 text-left text-xs text-white"
                >
                    {selectedLabel}
                </button>
                {isOpen && (
                    <div className="absolute top-full left-0 z-50 mt-1 w-full rounded border border-slate-700 bg-slate-900 shadow-xl">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="検索..."
                            className="w-full border-b border-slate-700 bg-transparent px-2 py-1 text-xs text-white outline-none"
                            autoFocus
                        />
                        <ul className="max-h-60 overflow-y-auto py-1">
                            {filteredOptions.map((opt, i) => (
                                <li
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                        setQuery('');
                                    }}
                                    className={`cursor-pointer px-2 py-1 text-xs ${i === highlightedIndex ? 'bg-slate-700' : 'hover:bg-slate-800'}`}
                                >
                                    {opt.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
