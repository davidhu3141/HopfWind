import { HopfWindWallpaper } from './HopfWindWallpaper.js';
import { hopfWindProperties } from './properties.js';

export const hopfWindDefinition = {
    id: 'hopf-wind',
    title: 'Hopf Wind',
    audioBinCount: 128,
    properties: hopfWindProperties,
    createWallpaper(context) {
        return new HopfWindWallpaper(context);
    },
};
