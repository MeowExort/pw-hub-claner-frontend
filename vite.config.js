/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        host: true
    },
    css: {
        modules: {
            localsConvention: 'camelCaseOnly'
        }
    },
    resolve: {
        alias: {
            '@': '/src'
        }
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',
    }
});
