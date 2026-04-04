export function createToastOverlay(host) {
    let element = null;
    let hideTimerId = 0;

    const ensureElement = () => {
        if (element) {
            return element;
        }

        element = document.createElement('div');
        element.style.position = 'absolute';
        element.style.left = '50%';
        element.style.bottom = '32px';
        element.style.transform = 'translateX(-50%)';
        element.style.maxWidth = 'min(560px, calc(100% - 32px))';
        element.style.padding = '10px 14px';
        element.style.borderRadius = '12px';
        element.style.background = 'rgba(14, 14, 14, 0.86)';
        element.style.color = '#f2f2f2';
        element.style.fontFamily = 'monospace';
        element.style.fontSize = '12px';
        element.style.lineHeight = '1.5';
        element.style.textAlign = 'center';
        element.style.whiteSpace = 'pre-wrap';
        element.style.boxShadow = '0 10px 28px rgba(0, 0, 0, 0.28)';
        element.style.opacity = '0';
        element.style.transition = 'opacity 160ms ease';
        element.style.zIndex = '20';
        host.overlayMount.appendChild(element);
        return element;
    };

    const clearTimer = () => {
        if (hideTimerId) {
            window.clearTimeout(hideTimerId);
            hideTimerId = 0;
        }
    };

    return {
        show(message, durationMs = 3000) {
            const toast = ensureElement();
            clearTimer();
            toast.textContent = message;
            toast.style.opacity = '1';
            hideTimerId = window.setTimeout(() => {
                toast.style.opacity = '0';
                hideTimerId = 0;
            }, durationMs);
        },
        destroy() {
            clearTimer();
            element?.remove();
            element = null;
        },
    };
}
