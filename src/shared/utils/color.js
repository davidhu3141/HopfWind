export function rgbTripletToCss(value) {
    const channels = String(value ?? '0 0 0')
        .trim()
        .split(/\s+/)
        .map((channel) => Number.parseFloat(channel) || 0)
        .map((channel) => Math.round(Math.min(1, Math.max(0, channel)) * 255));

    const [r = 0, g = 0, b = 0] = channels;
    return `rgb(${r} ${g} ${b})`;
}

export function rgbTripletToHex(value) {
    const css = rgbTripletToCss(value);
    const matches = css.match(/\d+/g) ?? ['0', '0', '0'];
    return `#${matches.map((channel) => Number(channel).toString(16).padStart(2, '0')).join('')}`;
}

export function hexToRgbTriplet(value) {
    const normalized = String(value ?? '#000000').replace('#', '').padStart(6, '0').slice(0, 6);
    const channels = normalized.match(/.{1,2}/g) ?? ['00', '00', '00'];
    return channels
        .map((channel) => (Number.parseInt(channel, 16) / 255).toFixed(3).replace(/0+$/, '').replace(/\.$/, ''))
        .join(' ');
}
