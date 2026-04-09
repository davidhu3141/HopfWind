import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import glsl from 'vite-plugin-glsl';

const [, , wallpaperId, destinationArg] = process.argv;
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const tempDir = path.resolve(repoRoot, '.tmp');

if (!wallpaperId) {
    console.error('Usage: npm run build:wallpaper -- <wallpaper-id> [destination]');
    process.exit(1);
}

const definitionModulePath = path.resolve(repoRoot, 'src', 'wallpapers', wallpaperId, 'definition.js');
await ensureDefinitionModuleExists(definitionModulePath, wallpaperId);
const configPath = path.resolve(repoRoot, 'wallpaper-configs', wallpaperId, 'config.json');
let buildDestination = destinationArg;

try {
    const raw = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(raw.replace(/^\uFEFF/, ''));
    buildDestination ||= config.buildDestination;
} catch {
    // Optional local config.
}

const outDir = buildDestination
    ? path.resolve(buildDestination)
    : path.resolve(repoRoot, 'dist', 'wallpapers', wallpaperId);
await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(path.join(outDir, 'dist'), { recursive: true });
await fs.mkdir(tempDir, { recursive: true });

const entryPath = await createTempWallpaperEntry({
    definitionModulePath,
    wallpaperId,
    outputDir: tempDir,
});

try {
    await build({
        configFile: false,
        plugins: [glsl({ compress: true })],
        build: {
            emptyOutDir: false,
            outDir: path.join(outDir, 'dist'),
            sourcemap: false,
            minify: 'oxc',
            modulePreload: false,
            rollupOptions: {
                input: entryPath,
                output: {
                    format: 'es',
                    entryFileNames: 'main.js',
                    chunkFileNames: 'chunks/[name]-[hash].js',
                    assetFileNames: 'assets/[name]-[hash][extname]',
                },
            },
        },
    });
} finally {
    await fs.rm(entryPath, { force: true });
}

await fs.copyFile(path.resolve(repoRoot, 'templates/wallpaper-index.html'), path.join(outDir, 'index.html'));
console.log(`Wallpaper built: ${wallpaperId}`);
console.log(`Output: ${outDir}`);

function toImportPath(fromDir, targetPath) {
    let relativePath = path.relative(fromDir, targetPath);
    relativePath = relativePath.split(path.sep).join('/');
    if (!relativePath.startsWith('.')) {
        relativePath = `./${relativePath}`;
    }
    return relativePath;
}

async function ensureDefinitionModuleExists(modulePath, requestedWallpaperId) {
    try {
        await fs.access(modulePath);
    } catch (error) {
        console.error(`Unable to find wallpaper definition for "${requestedWallpaperId}" at: ${modulePath}`);
        throw error;
    }
}

async function createTempWallpaperEntry({ definitionModulePath, wallpaperId, outputDir }) {
    const entryPath = path.join(outputDir, `wallpaper-entry-${wallpaperId}-${Date.now()}.mjs`);
    const entryDir = path.dirname(entryPath);
    const definitionImportPath = toImportPath(entryDir, definitionModulePath);
    const runtimeImportPath = toImportPath(
        entryDir,
        path.resolve(repoRoot, 'src', 'shared', 'runtime', 'startWpeWallpaper.js')
    );
    const entrySource = [
        `import * as definitionModule from '${definitionImportPath}';`,
        `import { startWpeWallpaper } from '${runtimeImportPath}';`,
        '',
        `const wallpaperDefinition = Object.values(definitionModule).find((value) => {`,
        `    return Boolean(`,
        `        value`,
        `            && typeof value === 'object'`,
        `            && value.id === '${wallpaperId}'`,
        `            && typeof value.createWallpaper === 'function'`,
        `    );`,
        `});`,
        '',
        `if (!wallpaperDefinition) {`,
        `    throw new Error('Wallpaper definition export not found for id: ${wallpaperId}');`,
        `}`,
        '',
        'startWpeWallpaper(wallpaperDefinition);',
        '',
    ].join('\n');
    await fs.writeFile(entryPath, entrySource, 'utf8');
    return entryPath;
}
