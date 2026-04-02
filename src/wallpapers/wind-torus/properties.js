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

export const windTorusProperties = [
    group('general', 'General'),
    slider('overallmagnitude', 'Overall Magnitude', 0, 20, 8, { step: 0.1, fraction: true, precision: 1 }),
    slider('majorradius', 'Major Radius', 0.5, 20, 7, { step: 0.1, fraction: true, precision: 1 }),
    slider('minorradius', 'Minor Radius', 0.01, 4, 0.1, { step: 0.01, fraction: true, precision: 2 }),

    group('view', 'View'),
    slider('offsetx', 'Canvas Offset X', -1, 1, 0, { step: 0.05, fraction: true, precision: 2 }),
    slider('offsety', 'Canvas Offset Y', -1, 1, 0, { step: 0.05, fraction: true, precision: 2 }),
    slider('pixelated', 'Pixelated', 1, 8, 1),
    slider('canvasportion', 'Canvas Portion', 1, 4, 1.2, { step: 0.1, fraction: true, precision: 2 }),
];
