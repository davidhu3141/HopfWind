import { createWallpaperSession } from './createWallpaperSession.js';

function bootstrap(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
        return;
    }

    callback();
}

export function startWpeWallpaper(definition) {
    let session = null;
    let pendingAudio = null;
    let pendingMedia = {};

    const applyAudio = (audioArray) => {
        pendingAudio = audioArray;
        if (!session) {
            return;
        }

        try {
            session.setAudioSamples(audioArray);
        } catch (error) {
            console.error('Audio listener failed', error);
        }
    };

    const applyMedia = (patchState) => {
        pendingMedia = { ...pendingMedia, ...patchState };
        if (!session) {
            return;
        }

        try {
            session.setMediaState(patchState);
        } catch (error) {
            console.error('Media listener failed', error);
        }
    };

    if (typeof window.wallpaperRegisterAudioListener === 'function') {
        window.wallpaperRegisterAudioListener(applyAudio);
    } else {
        console.warn('Wallpaper Engine audio listener API is unavailable.');
    }

    if (typeof window.wallpaperRegisterMediaStatusListener === 'function') {
        window.wallpaperRegisterMediaStatusListener((event) => {
            applyMedia({ enabled: Boolean(event?.enabled) });
        });
    }

    if (typeof window.wallpaperRegisterMediaPropertiesListener === 'function') {
        window.wallpaperRegisterMediaPropertiesListener((event) => {
            applyMedia({
                title: event?.title ?? '',
                artist: event?.artist || event?.subTitle || event?.albumArtist || '',
            });
        });
    }

    if (typeof window.wallpaperRegisterMediaThumbnailListener === 'function') {
        window.wallpaperRegisterMediaThumbnailListener((event) => {
            applyMedia({
                thumbnail: event?.thumbnail ?? '',
                backgroundColor: event?.primaryColor ?? '',
                textColor: event?.textColor ?? event?.highContrastColor ?? '#111111',
            });
        });
    }

    if (typeof window.wallpaperRegisterMediaPlaybackListener === 'function') {
        window.wallpaperRegisterMediaPlaybackListener((event) => {
            applyMedia({
                playbackState: event?.state ?? null,
                playbackPlayingValue: window.wallpaperMediaIntegration?.PLAYBACK_PLAYING ?? null,
                playbackStoppedValue: window.wallpaperMediaIntegration?.PLAYBACK_STOPPED ?? null,
            });
        });
    }

    if (typeof window.wallpaperRegisterMediaTimelineListener === 'function') {
        window.wallpaperRegisterMediaTimelineListener((event) => {
            applyMedia({
                position: Number.isFinite(event?.position) ? event.position : null,
                duration: Number.isFinite(event?.duration) ? event.duration : null,
            });
        });
    }

    bootstrap(() => {
        session = createWallpaperSession({
            definition,
            mountTarget: document.body,
            mode: 'wpe',
        });

        if (pendingAudio) {
            applyAudio(pendingAudio);
        }
        if (Object.keys(pendingMedia).length > 0) {
            applyMedia(pendingMedia);
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
