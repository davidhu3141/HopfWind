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

const bool = (id, label, defaultValue, extra = {}) => ({
    id,
    label,
    type: 'bool',
    default: defaultValue,
    condition: extra.condition,
});

const color = (id, label, defaultValue, extra = {}) => ({
    id,
    label,
    type: 'color',
    default: defaultValue,
    condition: extra.condition,
});

const file = (id, label, defaultValue, extra = {}) => ({
    id,
    label,
    type: 'file',
    default: defaultValue,
    accept: extra.accept,
    condition: extra.condition,
});

const group = (id, label) => ({
    id,
    label,
    type: 'group',
    default: '',
});

const combo = (id, label, defaultValue, options, extra = {}) => ({
    id,
    label,
    type: 'combo',
    default: defaultValue,
    options,
    condition: extra.condition,
});

export const retroFlowProperties = [
    group('general', 'General'),
    slider('overallmagnitude', 'Overall Magnitude', 0, 20, 8, { step: 0.1, fraction: true, precision: 1 }),
    bool('reduceframerate', 'Reduce Framerate When Idle', true),

    group('canvas', 'Canvas'),
    slider('offsetx', 'Canvas Offset X', -1, 1, 0, { step: 0.05, fraction: true, precision: 2 }),
    slider('offsety', 'Canvas Offset Y', -1, 1, 0, { step: 0.05, fraction: true, precision: 2 }),
    slider('pixelated', 'Pixelated', 1, 8, 1),
    slider('canvasshrink', 'Canvas Shrink', 0, 4, 0, { step: 0.1, fraction: true, precision: 2 }),
    bool('usecustomimage', 'Use Custom Image', false),
    file('customimage', 'Custom Image', '', { accept: 'image/*' }),

    group('barsgroup', 'Bars Group'),
    combo('barsgeometrytype', 'Geometry Type', 'just-bars', [
        { label: 'Just Bars', value: 'just-bars' },
        { label: 'Circle', value: 'circle' },
    ]),
    slider('geometryrotationhz', 'Geometry Rotation Speed (Hz)', 0, 1, 0.05, { step: 0.01, fraction: true, precision: 2 }),
    bool('geometryreverse', 'Reverse Rotation', false),
    slider('geometrysizebyenergy', 'Size By Energy', -100, 100, 0, { step: 0.1, fraction: true, precision: 1 }),
    slider('_2doffsetx', '2D Offset X', -1, 1, 0, { step: 0.01, fraction: true, precision: 2 }),
    slider('_2doffsety', '2D Offset Y', -1, 1, 0, { step: 0.01, fraction: true, precision: 2 }),

    group('justbars', 'Just Bars'),
    combo('justbarsshape', 'Just Bars Shape', 'shapeE', [
        { label: 'Single Up / Down', value: 'shapeA' },
        { label: 'Single Down / Up', value: 'shapeB' },
        { label: 'Single Up / Up', value: 'shapeC' },
        { label: 'Single Down / Down', value: 'shapeD' },
        { label: 'Two-Sided', value: 'shapeE' },
    ], { condition: "barsgeometrytype.value == 'just-bars'" }),
    slider('justbarsdistance', 'Bar Distance', 0.05, 1.5, 0.25, {
        step: 0.01,
        fraction: true,
        precision: 2,
        condition: "barsgeometrytype.value == 'just-bars'",
    }),
    slider('justbarswidth', 'Bar Width', 0, 150, 100, {
        step: 1,
        precision: 0,
        condition: "barsgeometrytype.value == 'just-bars'",
    }),
    slider('justbarslengthchangebysound', 'Bar Length By Sound', 0, 6, 1, {
        step: 0.1,
        fraction: true,
        precision: 2,
        condition: "barsgeometrytype.value == 'just-bars'",
    }),
    slider('justbarslengthinitial', 'Bar Length Initial', 0, 10, 0, {
        step: 0.1,
        fraction: true,
        precision: 2,
        condition: "barsgeometrytype.value == 'just-bars'",
    }),

    group('circle', 'Circle'),
    combo('circleshape', 'Circle Shape', 'two-sided', [
        { label: 'Single-Sided', value: 'single-sided' },
        { label: 'Two-Sided', value: 'two-sided' },
    ], { condition: "barsgeometrytype.value == 'circle'" }),
    slider('circleradius', 'Circle Radius', 1, 40, 12, {
        step: 0.1,
        fraction: true,
        precision: 1,
        condition: "barsgeometrytype.value == 'circle'",
    }),
    slider('circlebarwidth', 'Bar Width', 0, 150, 100, {
        step: 1,
        precision: 0,
        condition: "barsgeometrytype.value == 'circle'",
    }),
    slider('circlelengthchangebysound', 'Bar Length By Sound', 0, 12, 1, {
        step: 0.1,
        fraction: true,
        precision: 2,
        condition: "barsgeometrytype.value == 'circle'",
    }),
    slider('circlelengthinitial', 'Bar Length Initial', 0, 10, 0, {
        step: 0.1,
        fraction: true,
        precision: 2,
        condition: "barsgeometrytype.value == 'circle'",
    }),
    slider('circlethetashift', 'Circle Theta Shift', 0, 359, 0, {
        condition: "barsgeometrytype.value == 'circle'",
    }),

    group('colors', 'Bar Colors'),
    color('backgroundcolor', 'Background Color', '0 0 0'),
    color('barcolor', 'Bar Color', '1 1 1'),
    bool('usesinglecolor', 'Use Single Color', false),
    slider('huechangebysound', 'Hue By Sound', -2, 2, 0, { step: 0.01, fraction: true, precision: 2 }),
    slider('hueinitial', 'Hue Initial', 0, 360, 40),
    slider('saturation', 'Saturation', 0, 100, 50),
    slider('lightness', 'Lightness', 0, 100, 50),
    slider('lightnesschangebysound', 'Lightness By Sound', -10, 10, 0, { step: 0.01, fraction: true, precision: 2 }),
    slider('opacitychangebysound', 'Opacity By Sound', 0, 5, 1, { step: 0.01, fraction: true, precision: 2 }),
    slider('opacityinitial', 'Opacity Initial', 0, 1, 1, { step: 0.01, fraction: true, precision: 2 }),

    group('flow', 'Flow'),
    bool('antialiasingwillcauseblur', 'Allow Blur Filter', false),
    slider('applyfadingpernframes', 'Fade Every N Frames', 1, 8, 1),
    slider('fade', 'Trail Fade', 0, 32, 1, { step: 0.1, fraction: true, precision: 2 }),
    slider('flowvelocity', 'Flow Velocity', 0, 100, 1, { step: 0.1, fraction: true, precision: 2 }),
    slider('flowfieldmix', 'Flow Field Mix', 0, 1, 0, { step: 0.01, fraction: true, precision: 2 }),
    slider('flowopacitylimit', 'Flow Opacity Limit', 0, 1, 0.9, { step: 0.01, fraction: true, precision: 2 }),
    bool('usepostwarp', 'Use Post Warp', true),

    group('energy', 'Energy'),
    bool('useenergylow', 'Use Low Energy', true),
    bool('useenergymid', 'Use Mid Energy', true),
    bool('useenergyhigh', 'Use High Energy', true),

    group('clock', 'Clock'),
    bool('showclock', 'Show Clock', true),
    slider('clocksizea', 'Clock Size A', 0.5, 6, 3, { step: 0.1, fraction: true, precision: 1 }),
    slider('clocksizeb', 'Clock Size B', 0.5, 4, 1, { step: 0.1, fraction: true, precision: 1 }),
    slider('clockpositionx', 'Clock Position X', 0, 100, 50),
    slider('clockpositiony', 'Clock Position Y', 0, 100, 50),
    bool('_24hourclock', '24 Hour Clock', false),
    color('clockcolor', 'Clock Color', '1 1 1'),
    color('clockshadowcolor', 'Clock Shadow Color', '0 0 0'),
];
