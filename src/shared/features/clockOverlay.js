export function createClockOverlay(host) {
    let element = null;
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
    };

    const renderClock = () => {
        if (!element) {
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

        element.innerHTML =
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
                return;
            }

            ensureElement();
            element.style.left = `${currentOptions.positionX}%`;
            element.style.top = `${currentOptions.positionY}%`;
            element.style.transform = 'translate(-50%, -50%)';
            element.style.color = currentOptions.color;
            element.style.textShadow = `0 0 8px ${currentOptions.shadowColor}`;
            startTimer();
        },
        destroy() {
            stopTimer();
            element?.remove();
            element = null;
        },
    };
}
