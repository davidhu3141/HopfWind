export function createClockOverlay(host) {
    let element = null;
    let backdropElement = null;
    let contentElement = null;
    let intervalId = 0;
    let currentOptions = {
        visible: true,
        sizePrimary: 3,
        sizeSecondary: 1,
        positionX: 50,
        positionY: 50,
        twentyFourHour: false,
        color: '#ffffff',
        shadowColor: '#000000',
        backdropColor: 'rgb(0 0 0)',
        backdropOpacity: 0.6,
    };

    const toRgba = (color, alpha) => {
        const channels = String(color ?? 'rgb(0 0 0)').match(/\d+/g) ?? ['0', '0', '0'];
        const [r = '0', g = '0', b = '0'] = channels;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const renderClock = () => {
        if (!contentElement) {
            return;
        }

        const now = new Date();
        const pad = (value) => value.toString().padStart(2, '0');
        const hours = currentOptions.twentyFourHour ? now.getHours() : (now.getHours() % 12 || 12);
        const hhmm = `${pad(hours)}:${pad(now.getMinutes())}`;
        const yyyy = now.getFullYear();
        const mm = pad(now.getMonth() + 1);
        const dd = pad(now.getDate());
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const day = days[now.getDay()];

        contentElement.innerHTML =
            `<span style="font-size:${currentOptions.sizePrimary}em;line-height:1.2;">${hhmm}</span><br>` +
            `<span style="font-size:${currentOptions.sizeSecondary}em;line-height:1;">${yyyy}.${mm}.${dd} ${day}</span>`;
    };

    const ensureElement = () => {
        if (!element) {
            element = document.createElement('div');
            element.style.position = 'absolute';
            element.style.zIndex = '10';
            element.style.pointerEvents = 'none';
            element.style.fontFamily = 'monospace';
            element.style.textAlign = 'center';
            element.style.display = 'inline-block';

            backdropElement = document.createElement('div');
            backdropElement.style.position = 'absolute';
            backdropElement.style.left = '50%';
            backdropElement.style.top = '50%';
            backdropElement.style.transform = 'translate(-50%, -50%)';
            backdropElement.style.borderRadius = '50%';
            backdropElement.style.pointerEvents = 'none';
            backdropElement.style.zIndex = '0';

            contentElement = document.createElement('div');
            contentElement.style.position = 'relative';
            contentElement.style.zIndex = '1';

            element.appendChild(backdropElement);
            element.appendChild(contentElement);
            host.overlayMount.appendChild(element);
        }
    };

    const stopTimer = () => {
        if (intervalId) {
            window.clearInterval(intervalId);
            intervalId = 0;
        }
    };

    const startTimer = () => {
        stopTimer();
        renderClock();
        intervalId = window.setInterval(renderClock, 1000);
    };

    return {
        update(options) {
            currentOptions = { ...currentOptions, ...options };
            if (!currentOptions.visible) {
                stopTimer();
                element?.remove();
                element = null;
                backdropElement = null;
                contentElement = null;
                return;
            }

            ensureElement();
            element.style.left = `${currentOptions.positionX}%`;
            element.style.top = `${currentOptions.positionY}%`;
            element.style.transform = 'translate(-50%, -50%)';
            contentElement.style.color = currentOptions.color;
            contentElement.style.textShadow = `0 0 8px ${currentOptions.shadowColor}`;

            const backdropWidth = Math.max(currentOptions.sizePrimary * 4.2, currentOptions.sizeSecondary * 12);
            const backdropHeight = currentOptions.sizePrimary * 2.2 + currentOptions.sizeSecondary * 1.6;
            const opacity = Math.max(0, Math.min(1, currentOptions.backdropOpacity));
            backdropElement.style.width = `${backdropWidth}em`;
            backdropElement.style.height = `${backdropHeight}em`;
            backdropElement.style.opacity = `${opacity}`;
            backdropElement.style.background = `radial-gradient(closest-side, ${toRgba(currentOptions.backdropColor, 1.0)} 0%, ${toRgba(currentOptions.backdropColor, 0.82)} 18%, ${toRgba(currentOptions.backdropColor, 0.62)} 38%, ${toRgba(currentOptions.backdropColor, 0.42)} 58%, ${toRgba(currentOptions.backdropColor, 0.14)} 78%, ${toRgba(currentOptions.backdropColor, 0.05)} 90%, ${toRgba(currentOptions.backdropColor, 0.01)} 100%)`;

            startTimer();
        },
        destroy() {
            stopTimer();
            element?.remove();
            element = null;
            backdropElement = null;
            contentElement = null;
        },
    };
}
