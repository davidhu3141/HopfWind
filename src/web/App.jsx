import { useEffect, useMemo, useRef, useState } from 'react';
import { createMockAudioSpectrum } from '../shared/audio/createMockAudioSpectrum.js';
import { createWallpaperSession } from '../shared/runtime/createWallpaperSession.js';
import { getDefaultPropertyValues, mergePropertyValues } from '../shared/utils/propertySchema.js';
import { listWallpaperDefinitions } from '../wallpapers/registry.js';
import { PropertyField } from './components/PropertyField.jsx';
import defaultAudioUrl from './assets/audio/a-memory-away.mp3';

const definitions = listWallpaperDefinitions();
const DEFAULT_WALLPAPER_ID = 'spec-entity';
const SELECTED_WALLPAPER_STORAGE_KEY = 'hopfwind:selected-wallpaper';
const PROPERTY_STORAGE_KEY_PREFIX = 'hopfwind:properties:';
const AUDIO_VOLUME_STORAGE_KEY = 'hopfwind:audio-volume';

function isBlobUrl(url) {
    return typeof url === 'string' && url.startsWith('blob:');
}

function getPropertyStorageKey(wallpaperId) {
    return `${PROPERTY_STORAGE_KEY_PREFIX}${wallpaperId}`;
}

function getDefaultWallpaperId() {
    return definitions.some((definition) => definition.id === DEFAULT_WALLPAPER_ID)
        ? DEFAULT_WALLPAPER_ID
        : definitions[0]?.id ?? '';
}

function getPersistedWallpaperId() {
    try {
        const wallpaperId = window.localStorage.getItem(SELECTED_WALLPAPER_STORAGE_KEY);
        return definitions.some((definition) => definition.id === wallpaperId)
            ? wallpaperId
            : getDefaultWallpaperId();
    } catch {
        return getDefaultWallpaperId();
    }
}

function getPersistedAudioVolume() {
    try {
        const raw = window.localStorage.getItem(AUDIO_VOLUME_STORAGE_KEY);
        const volume = Number.parseFloat(raw ?? '');
        return Number.isFinite(volume)
            ? Math.min(1, Math.max(0, volume))
            : 0.15;
    } catch {
        return 0.15;
    }
}

function getPlaybackLabel(paused, audioSourceUrl) {
    const sourceLabel = audioSourceUrl === defaultAudioUrl ? 'Default Music' : 'Selected Music';
    return paused ? `Play ${sourceLabel}` : 'Pause';
}

function loadPersistedProperties(definition) {
    const defaults = getDefaultPropertyValues(definition.properties);

    try {
        const raw = window.localStorage.getItem(getPropertyStorageKey(definition.id));
        if (!raw) {
            return defaults;
        }

        const parsed = JSON.parse(raw);
        const values = mergePropertyValues(definition.properties, defaults, parsed);
        for (const descriptor of definition.properties) {
            if (descriptor.type === 'file' && String(values[descriptor.id] ?? '').startsWith('blob:')) {
                values[descriptor.id] = descriptor.default;
            }
        }
        return values;
    } catch {
        return defaults;
    }
}

function groupPropertyDescriptors(descriptors) {
    const sections = [];
    let currentSection = {
        id: 'default',
        label: 'General',
        items: [],
    };

    for (const descriptor of descriptors) {
        if (descriptor.type === 'group') {
            if (currentSection.items.length > 0 || currentSection.id !== 'default') {
                sections.push(currentSection);
            }
            currentSection = {
                id: descriptor.id,
                label: descriptor.label,
                items: [],
            };
            continue;
        }

        currentSection.items.push(descriptor);
    }

    if (currentSection.items.length > 0 || currentSection.id !== 'default') {
        sections.push(currentSection);
    }

    return sections;
}

function formatTime(seconds) {
    if (!Number.isFinite(seconds)) {
        return '00:00';
    }

    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

export function App() {
    const [selectedWallpaperId, setSelectedWallpaperId] = useState(() => getPersistedWallpaperId());
    const definition = useMemo(
        () => definitions.find((item) => item.id === selectedWallpaperId) ?? definitions[0],
        [selectedWallpaperId],
    );
    const propertySections = useMemo(
        () => groupPropertyDescriptors(definition.properties),
        [definition],
    );
    const [properties, setProperties] = useState(() => loadPersistedProperties(definition));
    const [audioInfo, setAudioInfo] = useState({ currentTime: 0, duration: 0, paused: true, hasFile: false });
    const [audioSourceUrl, setAudioSourceUrl] = useState(defaultAudioUrl);
    const [audioVolume, setAudioVolume] = useState(() => getPersistedAudioVolume());
    const previewRef = useRef(null);
    const audioRef = useRef(null);
    const sessionRef = useRef(null);
    const spectrumRef = useRef(null);

    useEffect(() => {
        setProperties(loadPersistedProperties(definition));
    }, [definition]);

    useEffect(() => {
        try {
            window.localStorage.setItem(SELECTED_WALLPAPER_STORAGE_KEY, selectedWallpaperId);
        } catch {
            // Ignore storage failures in restricted environments.
        }
    }, [selectedWallpaperId]);

    useEffect(() => {
        try {
            window.localStorage.setItem(
                getPropertyStorageKey(definition.id),
                JSON.stringify(properties),
            );
        } catch {
            // Ignore storage failures in restricted environments.
        }
    }, [definition.id, properties]);

    useEffect(() => {
        try {
            window.localStorage.setItem(AUDIO_VOLUME_STORAGE_KEY, String(audioVolume));
        } catch {
            // Ignore storage failures in restricted environments.
        }
    }, [audioVolume]);

    useEffect(() => {
        if (!previewRef.current) {
            return undefined;
        }

        const session = createWallpaperSession({
            definition,
            mountTarget: previewRef.current,
            mode: 'web',
        });
        sessionRef.current = session;
        session.setProperties(properties);

        return () => {
            session.destroy();
            sessionRef.current = null;
        };
    }, [definition]);

    useEffect(() => {
        sessionRef.current?.setProperties(properties);
    }, [properties]);

    useEffect(() => {
        const handleResize = () => sessionRef.current?.resize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const audioElement = audioRef.current;
        if (!audioElement) {
            return undefined;
        }

        audioElement.volume = audioVolume;

        spectrumRef.current?.destroy();
        spectrumRef.current = createMockAudioSpectrum({
            audioElement,
            binCount: definition.audioBinCount,
            onSamples: (samples) => sessionRef.current?.setAudioSamples(samples),
        });

        const syncAudioState = () => {
            setAudioInfo({
                currentTime: audioElement.currentTime,
                duration: audioElement.duration,
                paused: audioElement.paused,
                hasFile: Boolean(audioElement.currentSrc),
            });
        };

        const events = ['timeupdate', 'durationchange', 'play', 'pause', 'loadeddata', 'ended'];
        events.forEach((eventName) => audioElement.addEventListener(eventName, syncAudioState));
        syncAudioState();

        return () => {
            spectrumRef.current?.destroy();
            spectrumRef.current = null;
            events.forEach((eventName) => audioElement.removeEventListener(eventName, syncAudioState));
        };
    }, [definition.audioBinCount]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = audioVolume;
        }
    }, [audioVolume]);

    useEffect(() => () => {
        if (isBlobUrl(audioSourceUrl)) {
            URL.revokeObjectURL(audioSourceUrl);
        }
    }, [audioSourceUrl]);

    const updateProperty = (propertyId, value) => {
        setProperties((current) => ({
            ...current,
            [propertyId]: value,
        }));
    };

    const handleWallpaperChange = (event) => {
        setSelectedWallpaperId(event.target.value);
    };

    const handleAudioFile = async (event) => {
        const file = event.target.files?.[0];
        if (!file || !audioRef.current) {
            return;
        }

        if (isBlobUrl(audioSourceUrl)) {
            URL.revokeObjectURL(audioSourceUrl);
        }

        const nextUrl = URL.createObjectURL(file);
        setAudioSourceUrl(nextUrl);
        audioRef.current.src = nextUrl;
        audioRef.current.volume = audioVolume;
        audioRef.current.load();
        setAudioInfo({ currentTime: 0, duration: 0, paused: true, hasFile: true });

        try {
            await audioRef.current.play();
        } catch (error) {
            console.warn('Auto-play failed after selecting audio file.', error);
        }
    };

    const handleVolumeChange = (event) => {
        setAudioVolume(Number(event.target.value));
    };

    const togglePlayback = async () => {
        const audioElement = audioRef.current;
        if (!audioElement) {
            return;
        }

        if (audioElement.paused) {
            await audioElement.play();
        } else {
            audioElement.pause();
        }
    };

    const restartAudio = () => {
        const audioElement = audioRef.current;
        if (!audioElement) {
            return;
        }
        audioElement.currentTime = 0;
    };

    const seekAudio = (event) => {
        const audioElement = audioRef.current;
        if (!audioElement || !Number.isFinite(audioElement.duration)) {
            return;
        }
        const nextTime = Number(event.target.value);
        audioElement.currentTime = nextTime;
    };

    const resetProperties = () => {
        setProperties(getDefaultPropertyValues(definition.properties));
    };

    return (
        <div className="app-shell">
            <aside className="control-panel">
                <div className="panel-block panel-block-hero">
                    <h1>HopfWind Preview</h1>
                </div>

                <div className="panel-block">
                    <div className="section-head">
                        <h2>Wallpaper</h2>
                    </div>
                    <label className="field">
                        <span>Selection</span>
                        <select value={selectedWallpaperId} onChange={handleWallpaperChange}>
                            {definitions.map((item) => (
                                <option key={item.id} value={item.id}>{item.title}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="panel-block">
                    <div className="section-head">
                        <h2>Audio</h2>
                    </div>
                    <label className="field">
                        <span>Source</span>
                        <input type="file" accept="audio/*" onChange={handleAudioFile} />
                    </label>
                    <div className="transport-row">
                        <button type="button" onClick={togglePlayback} disabled={!audioInfo.hasFile}>
                            {getPlaybackLabel(audioInfo.paused, audioSourceUrl)}
                        </button>
                        <button type="button" onClick={restartAudio} disabled={!audioInfo.hasFile}>Restart</button>
                    </div>
                    <label className="field seek-field">
                        <span>{formatTime(audioInfo.currentTime)} / {formatTime(audioInfo.duration)}</span>
                        <input
                            type="range"
                            min="0"
                            max={Number.isFinite(audioInfo.duration) ? audioInfo.duration : 0}
                            step="0.01"
                            value={Number.isFinite(audioInfo.currentTime) ? audioInfo.currentTime : 0}
                            onChange={seekAudio}
                            disabled={!audioInfo.hasFile}
                        />
                    </label>
                    <label className="field volume-field">
                        <span>Volume {Math.round(audioVolume * 100)}%</span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={audioVolume}
                            onChange={handleVolumeChange}
                        />
                    </label>
                    <audio ref={audioRef} preload="auto" src={audioSourceUrl} />
                </div>

                <div className="panel-block panel-block-grow">
                    <div className="section-head">
                        <h2>Properties</h2>
                        <button type="button" className="ghost-button" onClick={resetProperties}>Reset</button>
                    </div>
                    <div className="property-grid">
                        {propertySections.map((section, index) => (
                            <details key={section.id} className="property-group" open={index === 0}>
                                <summary className="property-group-summary">{section.label}</summary>
                                <div className="property-group-body">
                                    {section.items.map((descriptor) => (
                                        <PropertyField
                                            key={descriptor.id}
                                            descriptor={descriptor}
                                            value={properties[descriptor.id]}
                                            onChange={(value) => updateProperty(descriptor.id, value)}
                                        />
                                    ))}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </aside>

            <main className="preview-panel">
                <div className="preview-card">
                    <div className="preview-header">
                        <div>
                            <p className="eyebrow">Live Preview</p>
                            <h2>{definition.title}</h2>
                        </div>
                        <p className="preview-note">WPE lifecycle and audio callbacks are simulated here.</p>
                    </div>
                    <div className="preview-surface" ref={previewRef} />
                </div>
            </main>
        </div>
    );
}
