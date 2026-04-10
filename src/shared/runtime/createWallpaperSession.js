import { createWallpaperHost } from '../dom/createWallpaperHost.js';
import { extractWpePropertyValues, getDefaultPropertyValues, mergePropertyValues } from '../utils/propertySchema.js';

export function createWallpaperSession({ definition, mountTarget, mode = 'web', maxInitAttempts = 3 }) {
    const host = createWallpaperHost(mountTarget);
    const defaultValues = getDefaultPropertyValues(definition.properties);
    const audioBinCount = definition.audioBinCount ?? 128;
    let propertyValues = { ...defaultValues };
    let generalValues = { fps: 0 };
    let audioSamples = Array(audioBinCount).fill(0);
    let frame = 0;
    let animationFrameId = 0;
    let destroyed = false;
    let wallpaper = null;
    let lastTickSeconds = performance.now() / 1000;
    let fpsAccumulator = 0;
    let pendingDeltaFrames = 0;

    for (let attempt = 1; attempt <= maxInitAttempts; attempt += 1) {
        try {
            wallpaper = definition.createWallpaper({
                host,
                mode,
                audioBinCount,
            });
            break;
        } catch (error) {
            console.error(`Wallpaper init attempt ${attempt} failed`, error);
            if (attempt === maxInitAttempts) {
                host.showError(`Initialization failed after ${maxInitAttempts} attempts.\n${error instanceof Error ? error.message : String(error)}`);
                throw error;
            }
        }
    }

    const renderLoop = () => {
        if (destroyed) {
            return;
        }

        const nowSeconds = performance.now() / 1000;
        const dt = Math.min(nowSeconds - lastTickSeconds, 1);
        lastTickSeconds = nowSeconds;
        pendingDeltaFrames += dt * 60;

        const fpsLimit = propertyValues.respectwpeframelimit ? Number(generalValues.fps ?? 0) : 0;
        if (fpsLimit > 0) {
            fpsAccumulator += dt;
            const frameInterval = 1 / fpsLimit;
            if (fpsAccumulator < frameInterval) {
                animationFrameId = window.requestAnimationFrame(renderLoop);
                return;
            }
            fpsAccumulator -= frameInterval;
        }

        try {
            const deltaFrames = Math.max(0.0001, pendingDeltaFrames);
            pendingDeltaFrames = 0;
            wallpaper.render(frame, audioSamples, deltaFrames);
            host.clearError();
            frame += deltaFrames;
        } catch (error) {
            console.error('Wallpaper render failed', error);
            host.showError(`Render error\n${error instanceof Error ? error.message : String(error)}`);
        }
        animationFrameId = window.requestAnimationFrame(renderLoop);
    };

    const resize = () => {
        try {
            wallpaper.resize();
            host.clearError();
        } catch (error) {
            console.error('Wallpaper resize failed', error);
            host.showError(`Resize error\n${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const setProperties = (patchValues) => {
        propertyValues = mergePropertyValues(definition.properties, propertyValues, patchValues);
        try {
            wallpaper.applyProperties(propertyValues);
            host.clearError();
        } catch (error) {
            console.error('Property update failed', error);
            host.showError(`Property update error\n${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const setWpeProperties = (payload) => {
        setProperties(extractWpePropertyValues(payload));
    };

    const setAudioSamples = (samples) => {
        const next = Array.from(samples ?? []).slice(0, audioBinCount);
        if (next.length < audioBinCount) {
            next.push(...Array(audioBinCount - next.length).fill(0));
        }
        audioSamples = next;
    };

    const setMediaState = (patchState) => {
        try {
            wallpaper.applyMediaState?.(patchState ?? {});
            host.clearError();
        } catch (error) {
            console.error('Media update failed', error);
            host.showError(`Media update error\n${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const setGeneralProperties = (patchValues) => {
        generalValues = { ...generalValues, ...patchValues };
    };

    wallpaper.applyProperties(propertyValues);
    resize();
    animationFrameId = window.requestAnimationFrame(renderLoop);

    return {
        host,
        resize,
        setProperties,
        setWpeProperties,
        setGeneralProperties,
        setAudioSamples,
        setMediaState,
        getProperties() {
            return { ...propertyValues };
        },
        destroy() {
            destroyed = true;
            window.cancelAnimationFrame(animationFrameId);
            wallpaper.destroy?.();
            host.destroy();
        },
    };
}
