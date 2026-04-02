import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from 'vite';
import { getWallpaperDefinition } from '../src/wallpapers/registry.js';

const [, , wallpaperId, destinationArg] = process.argv;

if (!wallpaperId) {
    console.error('Usage: npm run build:wallpaper -- <wallpaper-id> [destination]');
    process.exit(1);
}

const definition = getWallpaperDefinition(wallpaperId);
const configPath = path.resolve('wallpapers', wallpaperId, 'config.json');
let buildDestination = destinationArg;

try {
    const raw = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(raw);
    buildDestination ||= config.buildDestination;
} catch {
    // Optional local config.
}

const outDir = path.resolve(buildDestination || path.join('dist', 'wallpapers', wallpaperId));
await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(path.join(outDir, 'dist'), { recursive: true });

await build({
    configFile: false,
    define: {
        __WALLPAPER_ID__: JSON.stringify(definition.id),
    },
    build: {
        emptyOutDir: false,
        outDir: path.join(outDir, 'dist'),
        sourcemap: false,
        minify: 'esbuild',
        lib: {
            entry: path.resolve('src/entries/wallpaper.js'),
            formats: ['es'],
            fileName: () => 'main.js',
        },
        modulePreload: false,
        rollupOptions: {},
    },
});

await fs.copyFile(path.resolve('templates/wallpaper-index.html'), path.join(outDir, 'index.html'));
console.log(`Wallpaper built: ${definition.id}`);
console.log(`Output: ${outDir}`);
