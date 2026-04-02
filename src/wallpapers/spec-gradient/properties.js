const slider = (id, label, min, max, defaultValue, extra = {}) => ({
    id,
    label,
    type: 'slider',
    min,
    max,
    default: defaultValue,
    step: extra.step,
    fraction: extra.fraction,
    precision: extra.precision,
    condition: extra.condition,
});

const group = (id, label) => ({
    id,
    label,
    type: 'group',
    default: '',
});

export const specGradientProperties = [
    group('geometry', 'Geometry'),
    slider('bandwidth', 'Band Width', 1, 80, 20, { step: 0.1, fraction: true, precision: 1 }),

    group('colors', 'Colors'),
    slider('basehue', 'Base Hue', -360, 360, 240),
    slider('huegainbysound', 'Hue By Sound', 0, 20000, 10000, { step: 50, fraction: true, precision: 0 }),
    slider('saturation', 'Saturation', 0, 100, 100),
    slider('lightness', 'Lightness', 0, 100, 50),

    group('view', 'View'),
    slider('offsetx', 'Offset X', -1, 1, 0, { step: 0.05, fraction: true, precision: 2 }),
    slider('offsety', 'Offset Y', -1, 1, 0, { step: 0.05, fraction: true, precision: 2 }),
    slider('pixelated', 'Pixelated', 1, 8, 1),
    slider('canvasportion', 'Canvas Portion', 1, 4, 1.2, { step: 0.1, fraction: true, precision: 2 }),
];
