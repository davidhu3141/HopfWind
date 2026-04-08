export function resolveBackgroundImage(image) {
    if (!image) {
        return '';
    }

    const raw = String(image).trim();
    if (!raw) {
        return '';
    }

    if (/^(blob:|data:|https?:)/i.test(raw)) {
        return raw;
    }

    const decoded = (() => {
        try {
            return decodeURIComponent(raw);
        } catch {
            return raw;
        }
    })();

    if (/^file:/i.test(decoded)) {
        return encodeURI(decoded.replace(/\\/g, '/'));
    }

    const normalized = decoded.replace(/\\/g, '/');
    return encodeURI(`file:///${normalized.replace(/^\/+/, '')}`);
}

export function applyBackground(host, { color, image }) {
    host.stage.style.backgroundColor = color;
    const resolvedImage = resolveBackgroundImage(image);
    host.stage.style.backgroundImage = resolvedImage ? `url("${resolvedImage}")` : '';
}
