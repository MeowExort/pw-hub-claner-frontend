import React, {ReactNode, useEffect} from 'react';
import {createPortal} from 'react-dom';
import s from './Modal.module.scss';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    maxWidth?: string;
}

export const Modal = ({isOpen, onClose, title, children, footer, maxWidth}: ModalProps) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className={s.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div 
                className={s.modal} 
                onMouseDown={e => e.stopPropagation()} 
                style={{maxWidth: maxWidth || '640px'}}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? "modal-title" : undefined}
            >
                <div className={s.header}>
                    {title && <h2 id="modal-title" className={s.title}>{title}</h2>}
                    <button className={s.closeBtn} onClick={onClose} aria-label="Закрыть">
                        &times;
                    </button>
                </div>
                <div className={s.content}>
                    {children}
                </div>
                {footer && (
                    <div className={s.footer}>
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
