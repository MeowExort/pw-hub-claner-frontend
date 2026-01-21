import React, { useState, useRef, useEffect } from 'react';
import styles from './Select.module.scss';

export interface SelectOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

export interface SelectGroup {
    label: string;
    options: SelectOption[];
}

interface Props {
    value: string;
    onChange: (value: string) => void;
    options?: SelectOption[];
    groups?: SelectGroup[];
    placeholder?: string;
    className?: string;
    name?: string;
    icon?: React.ReactNode;
}

export const Select: React.FC<Props> = ({ 
    value, 
    onChange, 
    options, 
    groups, 
    placeholder, 
    className,
    name 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchStringRef = useRef<string>('');

    const allOptions = groups 
        ? groups.flatMap(g => g.options) 
        : (options || []);

    const selectedOption = allOptions.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
            return;
        }

        if (e.key === 'Escape') {
            setIsOpen(false);
            return;
        }

        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
                return;
            }
            
            const currentIndex = allOptions.findIndex(opt => opt.value === value);
            let nextIndex = currentIndex;
            
            if (e.key === 'ArrowDown') {
                nextIndex = (currentIndex + 1) % allOptions.length;
            } else {
                nextIndex = (currentIndex - 1 + allOptions.length) % allOptions.length;
            }
            
            onChange(allOptions[nextIndex].value);
            return;
        }

        // Поиск по символам
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }

            searchStringRef.current += e.key.toLowerCase();
            
            const found = allOptions.find(opt => 
                opt.label.toLowerCase().startsWith(searchStringRef.current)
            );

            if (found) {
                onChange(found.value);
            }

            searchTimeoutRef.current = setTimeout(() => {
                searchStringRef.current = '';
            }, 1000);
        }
    };

    const handleBlur = (e: React.FocusEvent) => {
        // Если фокус переходит внутрь контейнера (например, на скроллбар в некоторых браузерах или если мы добавим элементы)
        // Но в данном случае у нас нет фокусируемых элементов внутри кроме самого контейнера
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setIsOpen(false);
        }
    };

    return (
        <div 
            className={`${styles.container} ${className || ''}`} 
            ref={containerRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={name ? `${name}-listbox` : undefined}
            aria-label={placeholder}
        >
            <div 
                className={`${styles.header} ${isOpen ? styles.open : ''}`} 
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className={styles.selectedContent}>
                    {selectedOption?.icon && (
                        <span className={styles.icon}>{selectedOption.icon}</span>
                    )}
                    <span className={`${styles.selectedLabel} ${selectedOption ? '' : styles.placeholder}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <span className={styles.arrow} aria-hidden="true">▼</span>
            </div>

            {isOpen && (
                <div className={styles.dropdown} role="listbox" id={name ? `${name}-listbox` : undefined}>
                    {options && options.map(opt => (
                        <div 
                            key={opt.value} 
                            className={`${styles.option} ${value === opt.value ? styles.selected : ''}`}
                            onClick={() => handleSelect(opt.value)}
                            role="option"
                            aria-selected={value === opt.value}
                        >
                            {opt.icon && <span className={styles.icon}>{opt.icon}</span>}
                            {opt.label}
                        </div>
                    ))}
                    {groups && groups.map(group => (
                        <div key={group.label} className={styles.group} role="group" aria-label={group.label}>
                            <div className={styles.groupLabel} aria-hidden="true">{group.label}</div>
                            {group.options.map(opt => (
                                <div 
                                    key={opt.value} 
                                    className={`${styles.option} ${value === opt.value ? styles.selected : ''}`}
                                    onClick={() => handleSelect(opt.value)}
                                    role="option"
                                    aria-selected={value === opt.value}
                                >
                                    {opt.icon && <span className={styles.icon}>{opt.icon}</span>}
                                    {opt.label}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
            <input type="hidden" name={name} value={value} />
        </div>
    );
};
