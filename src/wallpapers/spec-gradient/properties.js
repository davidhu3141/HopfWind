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
    group('view', 'View'),
    slider('offsetx', 'Offset X', -1, 1, 0, { step: 0.05, fraction: true, precision: 2 }),
    slider('offsety', 'Offset Y', -1, 1, 0, { step: 0.05, fraction: true, precision: 2 }),
    slider('pixelated', 'Pixelated', 1, 8, 1),
    slider('canvasportion', 'Canvas Portion', 1, 4, 1.2, { step: 0.1, fraction: true, precision: 2 }),
];
