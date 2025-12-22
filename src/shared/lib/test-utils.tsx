import React, {ReactElement} from 'react';
import {render, RenderOptions, RenderResult} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {AuthProvider} from '@/app/providers/AuthContext';
import {ThemeProvider} from '@/app/providers/ThemeContext';
import {ToastProvider} from '@/app/providers/ToastContext';

const AllTheProviders = ({children}: { children: React.ReactNode }) => {
    return (
        <MemoryRouter>
            <ToastProvider>
                <AuthProvider>
                    <ThemeProvider>
                        {children}
                    </ThemeProvider>
                </AuthProvider>
            </ToastProvider>
        </MemoryRouter>
    );
};

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult => render(ui, {wrapper: AllTheProviders, ...options});

export * from '@testing-library/react';
export {customRender as render};
