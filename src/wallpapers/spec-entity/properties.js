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

const text = (id, label, defaultValue, extra = {}) => ({
    id,
    label,
    type: 'text',
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

export const specEntityProperties = [
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

    group('bars', 'Bar Geometry'),
    slider('barwidth', 'Bar Width', 0.05, 1.2, 0.2, { step: 0.01, fraction: true, precision: 2 }),
    slider('bardistance', 'Bar Distance', 0.05, 1.5, 0.25, { step: 0.01, fraction: true, precision: 2 }),
    bool('barsflip', 'Flip Bars', false),
    slider('barslengthchangebysound', 'Bar Length By Sound', 0, 6, 1, { step: 0.1, fraction: true, precision: 2 }),
    slider('barslengthinitial', 'Bar Length Initial', 0, 10, 0, { step: 0.1, fraction: true, precision: 2 }),

    group('transform', 'Transforms'),
    slider('_2doffsetx', '2D Offset X', -1, 1, 0, { step: 0.01, fraction: true, precision: 2 }),
    slider('_2doffsety', '2D Offset Y', -1, 1, 0, { step: 0.01, fraction: true, precision: 2 }),
    slider('_2drotation', '2D Rotation', -180, 180, 0),
    slider('_3drotation', '3D Rotation X', -180, 180, 0),
    slider('_3drotationy', '3D Rotation Y', -89, 89, 0),

    group('colors', 'Bar Colors'),
    color('backgroundcolor', 'Background Color', '0 0 0'),
    color('barcolor', 'Bar Color', '1 1 1'),
    bool('usesinglecolor', 'Use Single Color', false),
    slider('huechangebysound', 'Hue By Sound', 0, 2, 0, { step: 0.01, fraction: true, precision: 2 }),
    slider('hueinitial', 'Hue Initial', -360, 360, 40),
    slider('saturation', 'Saturation', 0, 100, 50),
    slider('lightness', 'Lightness', 0, 100, 50),
    slider('opacitychangebysound', 'Opacity By Sound', 0, 5, 1, { step: 0.01, fraction: true, precision: 2 }),
    slider('opacityinitial', 'Opacity Initial', 0, 1, 1, { step: 0.01, fraction: true, precision: 2 }),

    group('flow', 'Flow'),
    bool('antialiasingwillcauseblur', 'Allow Blur Filter', false),
    slider('applyfadingpernframes', 'Fade Every N Frames', 1, 8, 1),
    slider('fade', 'Trail Fade', 0, 32, 1, { step: 0.1, fraction: true, precision: 2 }),
    slider('flowdirection', 'Flow Direction', 0, 360, 0),
    slider('flowvelocity', 'Flow Velocity', 0, 10, 1, { step: 0.1, fraction: true, precision: 2 }),
    slider('flowopacitylimit', 'Flow Opacity Limit', 0, 1, 0.9, { step: 0.01, fraction: true, precision: 2 }),
    bool('flowbeforebars', 'Flow Before Bars', false),
    bool('usewaterfallsettings', 'Use Waterfall Flow', false),
    slider('waterfallgravity', 'Waterfall Gravity', 0, 3, 0, { step: 0.01, fraction: true, precision: 2 }),
    slider('bluepxxshiftfactor', 'Blue Pixel Shift', 0, 3, 0, { step: 0.01, fraction: true, precision: 2 }),
    slider('whitepixelsdropspeedfactor', 'White Pixel Drop', 0, 3, 0, { step: 0.01, fraction: true, precision: 2 }),

    group('clock', 'Clock'),
    bool('showclock', 'Show Clock', true),
    slider('clocksizea', 'Clock Size A', 0.5, 6, 3, { step: 0.1, fraction: true, precision: 1 }),
    slider('clocksizeb', 'Clock Size B', 0.5, 4, 1, { step: 0.1, fraction: true, precision: 1 }),
    slider('clockpositionx', 'Clock Position X', 0, 100, 50),
    slider('clockpositiony', 'Clock Position Y', 0, 100, 50),
    bool('_24hourclock', '24 Hour Clock', false),
    color('clockcolor', 'Clock Color', '1 1 1'),
    color('clockshadowcolor', 'Clock Shadow Color', '0 0 0'),

    group('text', 'Fallback Text'),
    text('text', 'Fallback Text', ' '),
    bool('textflip', 'Flip Text', false),
    slider('textmagnitude', 'Text Magnitude', 0, 12, 1, { step: 0.1, fraction: true, precision: 1 }),
    bool('showtext', 'Show Text', true),
];
