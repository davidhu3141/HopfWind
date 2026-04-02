import { WindTorusWallpaper } from './WindTorusWallpaper.js';
import { windTorusProperties } from './properties.js';

export const windTorusDefinition = {
    id: 'wind-torus',
    title: 'Wind Torus',
    audioBinCount: 128,
    properties: windTorusProperties,
    createWallpaper(context) {
        return new WindTorusWallpaper(context);
    },
};
