import { SpecGradientWallpaper } from './SpecGradientWallpaper.js';
import { specGradientProperties } from './properties.js';

export const specGradientDefinition = {
    id: 'spec-gradient',
    title: 'Spec Gradient',
    audioBinCount: 128,
    properties: specGradientProperties,
    createWallpaper(context) {
        return new SpecGradientWallpaper(context);
    },
};
