import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildWpeProjectProperties } from '../src/shared/utils/propertySchema.js';

const [, , wallpaperId, projectPathArg] = process.argv;
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

if (!wallpaperId) {
    console.error('Usage: npm run sync:project -- <wallpaper-id> [project-path]');
    process.exit(1);
}

const properties = await loadWallpaperProperties(wallpaperId);
const configPath = path.resolve(repoRoot, 'wallpaper-configs', wallpaperId, 'config.json');
let projectPath = projectPathArg;

try {
    const raw = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(raw.replace(/^\uFEFF/, ''));
    projectPath ||= config.buildDestination;
} catch {
    // Optional local config.
}

if (!projectPath) {
    console.error('No project path configured. Pass one explicitly or create wallpaper-configs/<id>/config.json.');
    process.exit(1);
}

const resolvedProjectPath = path.resolve(projectPath);
const projectJsonPath = path.join(resolvedProjectPath, 'project.json');
const project = JSON.parse(await fs.readFile(projectJsonPath, 'utf8'));
project.general ??= {};
project.general.properties = buildWpeProjectProperties(properties);
project.general.supportsaudioprocessing = true;
await fs.writeFile(projectJsonPath, `${JSON.stringify(project, null, 4)}\n`);
console.log(`Updated ${projectJsonPath}`);

async function loadWallpaperProperties(id) {
    const modulePath = path.resolve(repoRoot, 'src', 'wallpapers', id, 'properties.js');

    try {
        await fs.access(modulePath);
    } catch {
        throw new Error(`Unable to find properties module for "${id}" at: ${modulePath}`);
    }

    const propertyModule = await import(pathToFileURL(modulePath).href);
    const properties = Object.values(propertyModule).find((value) => {
        return Array.isArray(value) && value.every((item) => item && typeof item === 'object' && 'type' in item);
    });

    if (!properties) {
        throw new Error(`No property schema export found in: ${modulePath}`);
    }

    return properties;
}
