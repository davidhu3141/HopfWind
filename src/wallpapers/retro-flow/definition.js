import { specEntityProperties } from '../spec-entity/properties.js';
import { RetroFlowWallpaper } from './RetroFlowWallpaper.js';

export const retroFlowDefinition = {
    id: 'retro-flow',
    title: 'RetroFlow',
    audioBinCount: 128,
    properties: specEntityProperties,
    createWallpaper(context) {
        return new RetroFlowWallpaper(context);
    },
};
