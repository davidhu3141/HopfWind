import { useEffect, useMemo, useRef, useState } from 'react';
import { createMockAudioSpectrum } from '../shared/audio/createMockAudioSpectrum.js';
import { createWallpaperSession } from '../shared/runtime/createWallpaperSession.js';
import { getDefaultPropertyValues } from '../shared/utils/propertySchema.js';
import { listWallpaperDefinitions } from '../wallpapers/registry.js';
import { PropertyField } from './components/PropertyField.jsx';

const definitions = listWallpaperDefinitions();

function formatTime(seconds) {
    if (!Number.isFinite(seconds)) {
        return '00:00';
    }

    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

export function App() {
    const [selectedWallpaperId, setSelectedWallpaperId] = useState(definitions[0]?.id ?? '');
    const definition = useMemo(
        () => definitions.find((item) => item.id === selectedWallpaperId) ?? definitions[0],
        [selectedWallpaperId],
    );
    const [properties, setProperties] = useState(() => getDefaultPropertyValues(definition.properties));
    const [audioInfo, setAudioInfo] = useState({ currentTime: 0, duration: 0, paused: true, hasFile: false });
    const [audioSourceUrl, setAudioSourceUrl] = useState('');
    const previewRef = useRef(null);
    const audioRef = useRef(null);
    const sessionRef = useRef(null);
    const spectrumRef = useRef(null);

    useEffect(() => {
        setProperties(getDefaultPropertyValues(definition.properties));
    }, [definition]);

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

    useEffect(() => () => {
        if (audioSourceUrl) {
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

    const handleAudioFile = (event) => {
        const file = event.target.files?.[0];
        if (!file || !audioRef.current) {
            return;
        }

        if (audioSourceUrl) {
            URL.revokeObjectURL(audioSourceUrl);
        }

        const nextUrl = URL.createObjectURL(file);
        setAudioSourceUrl(nextUrl);
        audioRef.current.src = nextUrl;
        audioRef.current.load();
        setAudioInfo({ currentTime: 0, duration: 0, paused: true, hasFile: true });
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
                    <p className="eyebrow">Wallpaper Studio</p>
                    <h1>HopfWind Refactor Preview</h1>
                    <p className="panel-copy">
                        React 只負責控制台。桌布本體仍然是純 Three.js runtime，這裡只是 web 模擬層。
                    </p>
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
                            {audioInfo.paused ? 'Play' : 'Pause'}
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
                    <audio ref={audioRef} preload="auto" />
                </div>

                <div className="panel-block panel-block-grow">
                    <div className="section-head">
                        <h2>Properties</h2>
                        <button type="button" className="ghost-button" onClick={resetProperties}>Reset</button>
                    </div>
                    <div className="property-grid">
                        {definition.properties.map((descriptor) => (
                            <PropertyField
                                key={descriptor.id}
                                descriptor={descriptor}
                                value={properties[descriptor.id]}
                                onChange={(value) => updateProperty(descriptor.id, value)}
                            />
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
