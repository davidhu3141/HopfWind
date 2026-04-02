import { specEntityDefinition } from './spec-entity/definition.js';

const definitions = [
    specEntityDefinition,
];

const definitionMap = new Map(definitions.map((definition) => [definition.id, definition]));

export function listWallpaperDefinitions() {
    return definitions;
}

export function getWallpaperDefinition(id) {
    const definition = definitionMap.get(id);
    if (!definition) {
        throw new Error(`Unknown wallpaper id: ${id}`);
    }
    return definition;
}
