import { hopfWindDefinition } from './hopf-wind/definition.js';
import { retroFlowDefinition } from './retro-flow/definition.js';
import { specEntityDefinition } from './spec-entity/definition.js';
import { windTorusDefinition } from './wind-torus/definition.js';

const definitions = [
    specEntityDefinition,
    retroFlowDefinition,
    hopfWindDefinition,
    windTorusDefinition,
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
