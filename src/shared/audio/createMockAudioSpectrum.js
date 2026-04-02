const graphStore = new WeakMap();

function normalizeSample(decibelValue, kOverHalf) {
    const wpeScaleAdjust = (kOverHalf * 2 + 1) * 0.03
    const lowerBound = kOverHalf * 0.07 + 0.33
    const clamped = Math.max(0, Math.atan((decibelValue + 50) / 20) / Math.PI + lowerBound);
    return clamped * wpeScaleAdjust
}

function sampleFrequencyBin(data, frequencyHz, sampleRate, fftSize) {
    const binWidth = sampleRate / fftSize;
    const binIndex = Math.round(frequencyHz / binWidth);
    const clampedIndex = Math.max(0, Math.min(data.length - 1, binIndex));
    return data[clampedIndex];
}

function sampleAverageForFrequencyRange(data, startHz, endHz, sampleCount, sampleRate, fftSize) {
    if (sampleCount <= 0) {
        return -100;
    }

    let sum = 0;
    for (let index = 0; index < sampleCount; index += 1) {
        const frequencyHz = startHz + ((endHz - startHz) * index) / Math.max(1, sampleCount - 1);
        sum += sampleFrequencyBin(data, frequencyHz, sampleRate, fftSize);
    }
    return sum / sampleCount;
}

function createWpeLikeSpectrum(data, binCount, sampleRate, fftSize) {
    const halfBinCount = Math.max(1, Math.floor(binCount / 2));
    const spectrum = Array(binCount).fill(0);

    for (let k = 0; k < halfBinCount; k += 1) {
        let average;
        if (k <= 30) {
            const startHz = 23.57 * k;
            average = sampleAverageForFrequencyRange(data, startHz, startHz + 22, 12, sampleRate, fftSize);
        } else {
            const startHz = 772 * Math.pow(1.085, k - 31);
            const endHz = 772 * Math.pow(1.085, k - 30);
            average = sampleAverageForFrequencyRange(data, startHz, endHz, 30, sampleRate, fftSize);
        }

        const normalized = normalizeSample(average, k / halfBinCount);
        spectrum[k] = normalized;
        if (halfBinCount + k < binCount) {
            spectrum[halfBinCount + k] = normalized;
        }
    }

    if (binCount % 2 === 1) {
        spectrum[halfBinCount] = spectrum[halfBinCount - 1] ?? 0;
    }

    return spectrum;
}

function getOrCreateAudioGraph(audioElement) {
    const existing = graphStore.get(audioElement);
    if (existing) {
        return existing;
    }

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor || !audioElement) {
        return null;
    }

    const audioContext = new AudioContextCtor();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.72;

    const track = audioContext.createMediaElementSource(audioElement);
    track.connect(analyser);
    analyser.connect(audioContext.destination);

    const graph = {
        audioContext,
        analyser,
        track,
    };
    graphStore.set(audioElement, graph);
    return graph;
}

export function createMockAudioSpectrum({ audioElement, onSamples, binCount = 128 }) {
    const graph = getOrCreateAudioGraph(audioElement);
    if (!graph) {
        return {
            destroy() { },
        };
    }

    const { audioContext, analyser } = graph;
    const buffer = new Float32Array(analyser.frequencyBinCount);
    let animationFrameId = 0;
    let destroyed = false;

    const ensureRunning = async () => {
        if (audioContext.state === 'suspended') {
            try {
                await audioContext.resume();
            } catch (error) {
                console.error('Failed to resume audio context', error);
            }
        }
    };

    const frame = async () => {
        if (destroyed) {
            return;
        }

        if (!audioElement.paused && !audioElement.ended) {
            await ensureRunning();
            analyser.getFloatFrequencyData(buffer);
            onSamples(createWpeLikeSpectrum(buffer, binCount, audioContext.sampleRate, analyser.fftSize));
        } else {
            onSamples(Array(binCount).fill(0));
        }

        animationFrameId = window.requestAnimationFrame(frame);
    };

    audioElement.addEventListener('play', ensureRunning);
    animationFrameId = window.requestAnimationFrame(frame);

    return {
        destroy() {
            destroyed = true;
            window.cancelAnimationFrame(animationFrameId);
            audioElement.removeEventListener('play', ensureRunning);
        },
    };
}
