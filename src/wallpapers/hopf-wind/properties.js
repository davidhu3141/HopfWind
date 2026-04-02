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

export const hopfWindProperties = [
    group('general', 'General'),
    bool('customimage', 'Use Custom Image', false),
    file('customimagepath', 'Custom Image Path', '', { accept: 'image/*' }),
    slider('magfy', 'Size', 2, 8, 5),
    bool('usefour', 'Use Four Tori', false),
    bool('showonlyhalf', 'Show Not Only Half', false),

    group('rotation', 'Rotation'),
    slider('rot_is', 'Spin Initial Speed', 0, 25, 2, { step: 1, fraction: true, precision: 1 }),
    slider('rot_sg', 'Spin Speed Gain By Loudness', 0, 10, 5, { step: 1, fraction: true, precision: 1 }),
    bool('cliffordrotationauto', 'Clifford Rotation Auto', false),
    bool('cliffordrotation45', 'Clifford Rotation 90', false),
    slider('_4drotationspeed', '4D Rotation Speed', 0, 0.25, 0, { step: 0.001, fraction: true, precision: 3 }),
    slider('_3drotationspeed', '3D Rotation Speed', 0, 0.25, 0, { step: 0.001, fraction: true, precision: 3 }),

    group('magnitude', 'Magnitude'),
    slider('sm_fac', 'Circle-Sound Factor', 0, 2, 1.8, { step: 0.1, fraction: true, precision: 2 }),
    slider('sm_dec', 'Circle Size Decay', 0, 10, 0),
    slider('soundmagnitudecap', 'Circle Size Cap', 0, 1, 1, { step: 0.1, fraction: true, precision: 2 }),
    slider('opacitydefault', 'Lightness Initial', 0, 1, 0.3, { step: 0.1, fraction: true, precision: 2 }),
    slider('opa_gbs', 'Light Gain By Sound', 0, 5, 1.3, { step: 0.1, fraction: true, precision: 2 }),
    slider('opa_sc', 'Light Scale', 0, 1, 1, { step: 0.1, fraction: true, precision: 2 }),

    group('hopf', 'Hopf Geometry'),
    bool('capouterlight', 'Light Reduce Outer', true),
    slider('hopf_lat', 'Hopf Latitude', 0, 89, 15),
    slider('hopflatitudecap', 'Hopf Lat Outer Cap', 1, 89, 25),
    slider('magloud', 'Hopf Lat By Loudness', 0, 10, 0),
    slider('atancap', 'Atan Cap', 0, 10, 0),

    group('view', 'View'),
    slider('offsetx', 'Offset X', -1, 1, 0, { step: 0.1, fraction: true, precision: 2 }),
    slider('offsety', 'Offset Y', -1, 1, 0, { step: 0.1, fraction: true, precision: 2 }),
    slider('view', 'View Angle', 0, 90, 0),
    slider('canvasportion', 'Canvas Portion', 1, 8, 1),
    slider('pixelated', 'Pixelated', 1, 5, 1),

    group('style', 'Style'),
    color('toruscolor', 'Tori Color', '1 1 1'),
    bool('toricgotoparty', 'Tori Go To Party', false),
    slider('fiberresolution', 'Fiber Resolution', 16, 300, 150),
    slider('overallmagnitude', 'Overall Magnitude', 0, 20, 8, { step: 0.1, fraction: true, precision: 1 }),
];
