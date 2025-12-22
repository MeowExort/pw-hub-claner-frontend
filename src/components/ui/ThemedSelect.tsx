import React, {useEffect, useMemo, useRef, useState} from 'react';
import styles from './ThemedSelect.module.scss';

export type SelectOption = {
    value: string;
    label: string;
    iconUrl?: string;
    iconNode?: React.ReactNode;
    disabled?: boolean;
};

type ThemedSelectProps = {
    value: string | undefined;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
};

function cx(...args: Array<string | undefined | Record<string, boolean> | null>) {
    const out: string[] = [];
    args.forEach(a => {
        if (!a) return;
        if (typeof a === 'string') out.push(a);
        else Object.entries(a).forEach(([k, v]) => v && out.push(k));
    });
    return out.join(' ');
}

export default function ThemedSelect({
                                         value,
                                         onChange,
                                         options,
                                         placeholder = 'Выбрать…',
                                         className
                                     }: ThemedSelectProps) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const listRef = useRef<HTMLUListElement | null>(null);

    const selected = useMemo(() => options.find(o => o.value === value), [options, value]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [open]);

    // Keyboard handling on trigger
    const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(true);
            // set active to current selected or first enabled
            const idx = Math.max(0, options.findIndex(o => o.value === value && !o.disabled));
            const firstEnabled = idx >= 0 ? idx : options.findIndex(o => !o.disabled);
            setActiveIndex(firstEnabled);
            // focus list after open in next tick
            requestAnimationFrame(() => listRef.current?.focus());
        }
    };

    // Keyboard handling on listbox
    const onListKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && !options[activeIndex]?.disabled) {
                onChange(options[activeIndex].value);
                setOpen(false);
            }
            return;
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
            e.preventDefault();
            let next = activeIndex;
            if (e.key === 'Home') next = 0;
            else if (e.key === 'End') next = options.length - 1;
            else if (e.key === 'ArrowDown') next = Math.min(options.length - 1, activeIndex + 1);
            else if (e.key === 'ArrowUp') next = Math.max(0, activeIndex - 1);

            // skip disabled
            let guard = 0;
            while (options[next]?.disabled && guard < options.length) {
                next = e.key === 'ArrowUp' ? Math.max(0, next - 1) : Math.min(options.length - 1, next + 1);
                guard++;
            }
            setActiveIndex(next);

            // ensure visible
            const el = listRef.current?.children[next] as HTMLElement | undefined;
            el?.scrollIntoView({block: 'nearest'});
            return;
        }
        // close on Tab naturally
    };

    const handleSelect = (idx: number) => {
        const opt = options[idx];
        if (!opt || opt.disabled) return;
        onChange(opt.value);
        setOpen(false);
    };

    return (
        <div ref={rootRef} className={styles.root}>
            <button
                type="button"
                className={cx(styles.trigger, {[styles.open]: open}, className)}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen(o => !o)}
                onKeyDown={onTriggerKeyDown}
            >
                {selected ? (
                    <>
                        {selected.iconNode ?? (selected.iconUrl && (
                            <img className={styles.icon} src={selected.iconUrl} alt="" aria-hidden="true"/>
                        ))}
                        <span className={styles.label}>{selected.label}</span>
                    </>
                ) : (
                    placeholder
                )}
            </button>

            {open && (
                <div className={styles.panel} role="dialog" aria-modal="false">
                    <ul
                        className={styles.list}
                        role="listbox"
                        tabIndex={-1}
                        ref={listRef}
                        onKeyDown={onListKeyDown}
                    >
                        {options.map((opt, idx) => (
                            <li
                                key={opt.value}
                                role="option"
                                aria-selected={opt.value === value}
                                className={cx(styles.option, {
                                    [styles.optionActive]: idx === activeIndex,
                                    [styles.optionSelected]: opt.value === value,
                                })}
                                onMouseEnter={() => setActiveIndex(idx)}
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => handleSelect(idx)}
                                aria-disabled={opt.disabled}
                            >
                                {opt.iconNode ?? (opt.iconUrl && (
                                    <img className={styles.icon} src={opt.iconUrl} alt="" aria-hidden="true"/>
                                ))}
                                <span className={styles.label}>{opt.label}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
