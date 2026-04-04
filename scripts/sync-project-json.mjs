import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildWpeProjectProperties } from '../src/shared/utils/propertySchema.js';
import { getWallpaperDefinition } from '../src/wallpapers/registry.js';

const [, , wallpaperId, projectPathArg] = process.argv;
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

if (!wallpaperId) {
    console.error('Usage: npm run sync:project -- <wallpaper-id> [project-path]');
    process.exit(1);
}

const definition = getWallpaperDefinition(wallpaperId);
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
project.general.properties = buildWpeProjectProperties(definition.properties);
project.general.supportsaudioprocessing = true;
await fs.writeFile(projectJsonPath, `${JSON.stringify(project, null, 4)}\n`);
console.log(`Updated ${projectJsonPath}`);
