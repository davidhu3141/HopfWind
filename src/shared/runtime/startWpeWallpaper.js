import { createWallpaperSession } from './createWallpaperSession.js';

function bootstrap(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
        return;
    }

    callback();
}

export function startWpeWallpaper(definition) {
    bootstrap(() => {
        const session = createWallpaperSession({
            definition,
            mountTarget: document.body,
            mode: 'wpe',
        });

        const applyAudio = (audioArray) => {
            try {
                session.setAudioSamples(audioArray);
            } catch (error) {
                console.error('Audio listener failed', error);
            }
        };

        if (typeof window.wallpaperRegisterAudioListener === 'function') {
            window.wallpaperRegisterAudioListener(applyAudio);
        } else {
            console.warn('Wallpaper Engine audio listener API is unavailable.');
        }

        window.wallpaperPropertyListener = {
            applyUserProperties(payload) {
                session.setWpeProperties(payload);
            },
        };

        window.addEventListener('resize', () => session.resize());
        window.addEventListener('beforeunload', () => session.destroy(), { once: true });
    });
}
