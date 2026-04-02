import { retroFlowProperties } from './properties.js';
import { RetroFlowWallpaper } from './RetroFlowWallpaper.js';

export const retroFlowDefinition = {
    id: 'retro-flow',
    title: 'RetroFlow',
    audioBinCount: 128,
    properties: retroFlowProperties,
    createWallpaper(context) {
        return new RetroFlowWallpaper(context);
    },
};
