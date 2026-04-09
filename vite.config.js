import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import glsl from 'vite-plugin-glsl';
import path from 'node:path';

export default defineConfig({
    plugins: [react(), glsl({ compress: true })],
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
