import { SpecEntityWallpaper } from './SpecEntityWallpaper.js';
import { specEntityProperties } from './properties.js';

export const specEntityDefinition = {
    id: 'spec-entity',
    title: 'Spectrum Entity',
    audioBinCount: 128,
    properties: specEntityProperties,
    createWallpaper(context) {
        return new SpecEntityWallpaper(context);
    },
};
