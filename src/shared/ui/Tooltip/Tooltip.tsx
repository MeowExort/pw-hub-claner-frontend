import React, {useState, useRef, ReactNode} from 'react';
import {createPortal} from 'react-dom';
import s from './Tooltip.module.scss';

interface TooltipProps {
    content: ReactNode;
    children: ReactNode;
    className?: string;
}

export const Tooltip = ({content, children, className}: TooltipProps) => {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({left: 0, top: 0});
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                left: rect.left + rect.width / 2,
                top: rect.top - 8
            });
            setVisible(true);
        }
    };

    const handleFocus = () => {
        handleMouseEnter();
    };

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={() => setVisible(false)}
                onFocus={handleFocus}
                onBlur={() => setVisible(false)}
                className={`${s.trigger} ${className || ''}`}
                tabIndex={0}
                aria-haspopup="true"
            >
                {children}
            </div>
            {visible && createPortal(
                <div
                    className={s.tooltip}
                    style={{left: coords.left, top: coords.top}}
                    role="tooltip"
                >
                    {content}
                </div>,
                document.body
            )}
        </>
    );
};
