import { getWallpaperDefinition } from '../wallpapers/registry.js';
import { startWpeWallpaper } from '../shared/runtime/startWpeWallpaper.js';

startWpeWallpaper(getWallpaperDefinition(__WALLPAPER_ID__));
