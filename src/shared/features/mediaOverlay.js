export function createMediaOverlay(host) {
    let element = null;
    let artElement = null;
    let titleElement = null;
    let artistElement = null;
    let timelineElement = null;
    let timelineIntervalId = 0;
    let displayPosition = null;
    let currentState = {
        visible: true,
        size: 1,
        positionX: 50,
        positionY: 50,
        enabled: true,
        title: '',
        artist: '',
        thumbnail: '',
        backgroundColor: '',
        textColor: '#111111',
        playbackState: null,
        playbackPlayingValue: null,
        position: null,
        duration: null,
        playbackStoppedValue: null,
    };

    const formatTime = (value) => {
        if (!Number.isFinite(value) || value < 0) {
            return '--:--';
        }
        const minutes = Math.floor(value / 60);
        const seconds = Math.floor(value % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const ensureElement = () => {
        if (element) {
            return;
        }

        element = document.createElement('div');
        element.style.position = 'absolute';
        element.style.zIndex = '12';
        element.style.pointerEvents = 'none';
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.gap = '1em';
        element.style.padding = '0.9em 1em';
        element.style.borderRadius = '1.2em';
        element.style.background = 'rgba(255, 255, 255, 0.84)';
        element.style.boxShadow = '0 0.4em 2em rgba(0, 0, 0, 0.18)';
        element.style.backdropFilter = 'blur(6px)';
        element.style.transform = 'translate(-50%, -50%)';
        element.style.maxWidth = '42em';
        element.style.boxSizing = 'border-box';

        artElement = document.createElement('img');
        artElement.style.width = '6em';
        artElement.style.height = '6em';
        artElement.style.objectFit = 'cover';
        artElement.style.borderRadius = '0.8em';
        artElement.style.flex = '0 0 auto';
        artElement.style.display = 'none';

        const textWrap = document.createElement('div');
        textWrap.style.display = 'flex';
        textWrap.style.flexDirection = 'column';
        textWrap.style.minWidth = '0';

        titleElement = document.createElement('div');
        titleElement.style.fontFamily = 'system-ui, sans-serif';
        titleElement.style.fontWeight = '700';
        titleElement.style.fontSize = '1.3em';
        titleElement.style.lineHeight = '1.2';
        titleElement.style.whiteSpace = 'nowrap';
        titleElement.style.overflow = 'hidden';
        titleElement.style.textOverflow = 'ellipsis';

        artistElement = document.createElement('div');
        artistElement.style.fontFamily = 'system-ui, sans-serif';
        artistElement.style.fontWeight = '500';
        artistElement.style.fontSize = '0.95em';
        artistElement.style.lineHeight = '1.25';
        artistElement.style.opacity = '0.82';
        artistElement.style.marginTop = '0.28em';
        artistElement.style.whiteSpace = 'nowrap';
        artistElement.style.overflow = 'hidden';
        artistElement.style.textOverflow = 'ellipsis';

        timelineElement = document.createElement('div');
        timelineElement.style.fontFamily = 'monospace';
        timelineElement.style.fontSize = '0.82em';
        timelineElement.style.lineHeight = '1.2';
        timelineElement.style.opacity = '0.68';
        timelineElement.style.marginTop = '0.55em';

        textWrap.append(titleElement, artistElement, timelineElement);
        element.append(artElement, textWrap);
        host.overlayMount.appendChild(element);
    };

    const toRgba = (color, alpha, fallback) => {
        const source = String(color || fallback || '').trim();
        if (!source) {
            return fallback;
        }

        const rgbMatch = source.match(/\d+(?:\.\d+)?/g);
        if (rgbMatch && rgbMatch.length >= 3) {
            const [r, g, b] = rgbMatch;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        const hex = source.replace(/^#/, '');
        if (/^[\da-f]{6}$/i.test(hex)) {
            const r = Number.parseInt(hex.slice(0, 2), 16);
            const g = Number.parseInt(hex.slice(2, 4), 16);
            const b = Number.parseInt(hex.slice(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        if (/^[\da-f]{3}$/i.test(hex)) {
            const r = Number.parseInt(hex[0] + hex[0], 16);
            const g = Number.parseInt(hex[1] + hex[1], 16);
            const b = Number.parseInt(hex[2] + hex[2], 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        return fallback;
    };

    const shouldShow = () => {
        const hasContent = Boolean(currentState.thumbnail || currentState.title || currentState.artist);
        const isStopped = currentState.playbackStoppedValue != null && currentState.playbackState === currentState.playbackStoppedValue;
        return currentState.visible && hasContent && !isStopped;
    };

    const stopTimelineTimer = () => {
        if (timelineIntervalId) {
            window.clearInterval(timelineIntervalId);
            timelineIntervalId = 0;
        }
    };

    const shouldAdvanceTimeline = () => (
        currentState.playbackPlayingValue != null
        && currentState.playbackState === currentState.playbackPlayingValue
        && Number.isFinite(displayPosition)
        && Number.isFinite(currentState.duration)
    );

    const updateTimelineText = () => {
        if (!timelineElement) {
            return;
        }

        const hasTimeline = Number.isFinite(displayPosition) && Number.isFinite(currentState.duration);
        timelineElement.textContent = hasTimeline
            ? `${formatTime(displayPosition)} / ${formatTime(currentState.duration)}`
            : '';
        timelineElement.style.display = hasTimeline ? '' : 'none';
    };

    const startTimelineTimer = () => {
        if (timelineIntervalId || !shouldAdvanceTimeline()) {
            return;
        }

        timelineIntervalId = window.setInterval(() => {
            if (!shouldAdvanceTimeline()) {
                stopTimelineTimer();
                return;
            }

            displayPosition = Math.min(displayPosition + 1, currentState.duration);
            updateTimelineText();
        }, 1000);
    };

    const syncTimelineTimer = () => {
        if (shouldAdvanceTimeline()) {
            startTimelineTimer();
            return;
        }
        stopTimelineTimer();
    };

    return {
        update(nextState) {
            currentState = { ...currentState, ...nextState };
            if (Object.prototype.hasOwnProperty.call(nextState, 'position')) {
                displayPosition = Number.isFinite(nextState.position) ? nextState.position : null;
            }
            syncTimelineTimer();

            if (!shouldShow()) {
                stopTimelineTimer();
                element?.remove();
                element = null;
                artElement = null;
                titleElement = null;
                artistElement = null;
                timelineElement = null;
                return;
            }

            ensureElement();
            element.style.left = `${currentState.positionX}%`;
            element.style.top = `${currentState.positionY}%`;
            element.style.fontSize = `${currentState.size}em`;
            element.style.color = currentState.textColor || '#111111';
            element.style.background = toRgba(currentState.backgroundColor, 0.84, 'rgba(255, 255, 255, 0.84)');

            if (currentState.thumbnail) {
                artElement.src = currentState.thumbnail;
                artElement.style.display = '';
            } else {
                artElement.removeAttribute('src');
                artElement.style.display = 'none';
            }

            titleElement.textContent = currentState.title || 'Unknown Title';
            artistElement.textContent = currentState.artist || '';
            artistElement.style.display = currentState.artist ? '' : 'none';
            updateTimelineText();
        },
        destroy() {
            stopTimelineTimer();
            element?.remove();
            element = null;
            artElement = null;
            titleElement = null;
            artistElement = null;
            timelineElement = null;
            displayPosition = null;
        },
    };
}
