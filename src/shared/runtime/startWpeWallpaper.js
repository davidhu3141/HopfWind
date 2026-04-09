import { createWallpaperSession } from './createWallpaperSession.js';
import { createToastOverlay } from '../features/toastOverlay.js';

const LISTENER_RETRY_INTERVAL_MS = 500;
const LISTENER_RETRY_ATTEMPTS = 20;

function bootstrap(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
        return;
    }

    callback();
}

function registerListenerWithRetry({
    name,
    getRegister,
    register,
    notify,
    maxAttempts = LISTENER_RETRY_ATTEMPTS,
    intervalMs = LISTENER_RETRY_INTERVAL_MS,
}) {
    let attempt = 0;

    const tryRegister = () => {
        attempt += 1;
        const registerFn = getRegister();

        if (typeof registerFn !== 'function') {
            if (attempt >= maxAttempts) {
                const message = `${name} API is unavailable after ${maxAttempts} attempts.`;
                console.warn(message);
                notify?.(message, 5000);
                return;
            }

            window.setTimeout(tryRegister, intervalMs);
            return;
        }

        try {
            register(registerFn);
        } catch (error) {
            if (attempt >= maxAttempts) {
                const message = `${name} registration failed after ${maxAttempts} attempts.`;
                console.error(message, error);
                notify?.(message, 5000);
                return;
            }

            const message = `${name} registration attempt ${attempt} failed. Retrying...`;
            console.warn(message, error);
            notify?.(message, 2500);
            window.setTimeout(tryRegister, intervalMs);
        }
    };

    tryRegister();
}

export function startWpeWallpaper(definition) {
    let session = null;
    let runtimeToast = null;
    let pendingToast = null;
    let pendingAudio = null;
    let pendingMedia = {};

    const showRuntimeToast = (message, durationMs = 3000) => {
        if (!message) {
            return;
        }

        if (!runtimeToast) {
            pendingToast = { message, durationMs };
            return;
        }

        runtimeToast.show(message, durationMs);
    };

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

    registerListenerWithRetry({
        name: 'Wallpaper Engine audio listener',
        getRegister: () => window.wallpaperRegisterAudioListener,
        register: (registerFn) => registerFn(applyAudio),
        notify: showRuntimeToast,
    });

    registerListenerWithRetry({
        name: 'Wallpaper Engine media status listener',
        getRegister: () => window.wallpaperRegisterMediaStatusListener,
        register: (registerFn) => registerFn((event) => {
            applyMedia({ enabled: Boolean(event?.enabled) });
        }),
    });

    registerListenerWithRetry({
        name: 'Wallpaper Engine media properties listener',
        getRegister: () => window.wallpaperRegisterMediaPropertiesListener,
        register: (registerFn) => registerFn((event) => {
            applyMedia({
                title: event?.title ?? '',
                artist: event?.artist || event?.subTitle || event?.albumArtist || '',
            });
        }),
    });

    registerListenerWithRetry({
        name: 'Wallpaper Engine media thumbnail listener',
        getRegister: () => window.wallpaperRegisterMediaThumbnailListener,
        register: (registerFn) => registerFn((event) => {
            applyMedia({
                thumbnail: event?.thumbnail ?? '',
                backgroundColor: event?.primaryColor ?? '',
                textColor: event?.textColor ?? event?.highContrastColor ?? '#111111',
            });
        }),
    });

    registerListenerWithRetry({
        name: 'Wallpaper Engine media playback listener',
        getRegister: () => window.wallpaperRegisterMediaPlaybackListener,
        register: (registerFn) => registerFn((event) => {
            applyMedia({
                playbackState: event?.state ?? null,
                playbackPlayingValue: window.wallpaperMediaIntegration?.PLAYBACK_PLAYING ?? null,
                playbackStoppedValue: window.wallpaperMediaIntegration?.PLAYBACK_STOPPED ?? null,
            });
        }),
    });

    registerListenerWithRetry({
        name: 'Wallpaper Engine media timeline listener',
        getRegister: () => window.wallpaperRegisterMediaTimelineListener,
        register: (registerFn) => registerFn((event) => {
            applyMedia({
                position: Number.isFinite(event?.position) ? event.position : null,
                duration: Number.isFinite(event?.duration) ? event.duration : null,
            });
        }),
    });

    bootstrap(() => {
        session = createWallpaperSession({
            definition,
            mountTarget: document.body,
            mode: 'wpe',
        });
        runtimeToast = createToastOverlay(session.host);

        if (pendingToast) {
            runtimeToast.show(pendingToast.message, pendingToast.durationMs);
            pendingToast = null;
        }

        if (pendingAudio) {
            applyAudio(pendingAudio);
        }
        if (Object.keys(pendingMedia).length > 0) {
            applyMedia(pendingMedia);
        }

        window.wallpaperPropertyListener = {
            applyGeneralProperties(payload) {
                if (payload && Object.prototype.hasOwnProperty.call(payload, 'fps')) {
                    session.setGeneralProperties({ fps: payload.fps });
                }
            },
            applyUserProperties(payload) {
                session.setWpeProperties(payload);
            },
        };

        window.addEventListener('resize', () => session.resize());
        window.addEventListener('beforeunload', () => {
            runtimeToast?.destroy();
            session.destroy();
        }, { once: true });
    });
}
