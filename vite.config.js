import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'dist/web',
        emptyOutDir: true,
    },
    resolve: {
        alias: {
            '@': path.resolve(process.cwd(), 'src'),
        },
    },
});
