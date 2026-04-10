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

const FLOW_TYPE_OPTIONS = [
    { label: 'Swirl', value: 'swirl' },
    { label: 'Grid', value: 'grid' },
    { label: 'Saddle', value: 'saddle' },
    { label: 'Polygon', value: 'polygon' },
    { label: 'Dual Core', value: 'dual-core' },
];

const WARP_TYPE_OPTIONS = [
    { label: 'None', value: 'none' },
    { label: 'Radial', value: 'radial' },
    { label: 'Twist', value: 'twist' },
    { label: 'Grid', value: 'grid' },
    { label: 'Wave', value: 'wave' },
    { label: 'Flower', value: 'flower' },
    { label: 'Triangular', value: 'triangular' },
];

export const retroFlowProperties = [
    slider('overallmagnitude', 'Overall Magnitude', 0, 30, 1, { step: 0.001, fraction: true, precision: 4 }),
    bool('respectwpeframelimit', 'Respect WPE FPS Limit', false),
    bool('reduceframerate', 'Stop Animation When Idle', false),

    group('canvas', 'Canvas'),
    slider('offsetx', 'Canvas Offset X', -1, 1, 0, { step: 0.05, fraction: true, precision: 2 }),
    slider('offsety', 'Canvas Offset Y', -1, 1, 0, { step: 0.05, fraction: true, precision: 2 }),
    slider('pixelated', 'Pixelated', 1, 16, 1),
    slider('canvasshrink', 'Canvas Shrink', 0, 4, 0, { step: 0.1, fraction: true, precision: 2 }),
    bool('usecustomimage', 'Use Custom Image', false),
    file('customimage', 'Custom Image', '', { accept: 'image/*' }),

    group('clock', 'Clock'),
    bool('showclock', 'Show Clock', true),
    slider('clocksizea', 'Clock Size A', 0.5, 18, 5.6, { step: 0.1, fraction: true, precision: 1 }),
    slider('clocksizeb', 'Clock Size B', 0.5, 12, 2.1, { step: 0.1, fraction: true, precision: 1 }),
    slider('clockpositionx', 'Clock Position X', 0, 100, 50),
    slider('clockpositiony', 'Clock Position Y', 0, 100, 50),
    bool('_24hourclock', '24 Hour Clock', true),
    color('clockcolor', 'Clock Color', '1 1 1'),
    color('clockshadowcolor', 'Clock Shadow Color', '0 0 0'),
    color('clockbackdropcolor', 'Clock Backdrop Color', '0 0 0'),
    slider('clockbackdropopacity', 'Clock Backdrop Opacity', 0, 1, 0.13, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),

    group('media', 'Media Info'),
    bool('showmedia', 'Show Media Overlay', false),
    slider('mediasize', 'Media Size', 0.5, 4, 1, { step: 0.1, fraction: true, precision: 1 }),
    slider('mediapositionx', 'Media Position X', 0, 100, 50),
    slider('mediapositiony', 'Media Position Y', 0, 100, 80),
    slider('mediabackdropopacity', 'Media Backdrop Opacity', 0, 1, 0.84, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),

    group('colors', 'Colors'),
    color('backgroundcolor', 'Background Color', '0.2 0.2 0.2'),
    color('barcolor', 'Bar Color', '0.2235294117647059 0.5411764705882353 0.6705882352941176'),
    slider('huechangebysound', 'Hue By Sound', -2, 2, 0, { step: 0.01, fraction: true, precision: 2 }),
    slider('saturationchangebysound', 'Saturation By Sound', -10, 10, 0, { step: 0.01, fraction: true, precision: 2 }),
    slider('lightnesschangebysound', 'Lightness By Sound', -30, 30, 7, { step: 0.01, fraction: true, precision: 2 }),
    slider('opacityinitial', 'Opacity Initial', 0, 1, 1, { step: 0.01, fraction: true, precision: 2 }),
    slider('opacitychangebysound', 'Opacity By Sound', 0, 5, 0, { step: 0.01, fraction: true, precision: 2 }),

    group('cycle', 'Main Feature Cycle 🔁'),
    slider('cycleinterval', 'Cycle Interval (sec)', 1, 60, 3, { step: 0.1, fraction: true, precision: 1 }),
    slider('cycleinterpolateduration', 'Interpolate Duration (sec)', 0, 10, 2, { step: 0.1, fraction: true, precision: 1 }),
    bool('cyclerandomcolor', 'Include Random Color', false),
    bool('cyclegeometryjustbars', 'Include Bar Just Bars', true),
    bool('cyclegeometrycircle', 'Include Bar Circle', true),
    bool('cyclegeometrydoublecircle', 'Include Bar Double Circle', false),
    bool('cyclegeometryslab', 'Include Bar Slab', false),
    bool('cyclegeometrycircleslab', 'Include Bar Circle-Slab', false),
    bool('cyclegeometrydoublecircleslab', 'Include Bar Double Circle-Slab', false),
    bool('cycleflowswirl', 'Include Flow Swirl', true),
    bool('cycleflowgrid', 'Include Flow Grid', false),
    bool('cycleflowsaddle', 'Include Flow Saddle', false),
    bool('cycleflowpolygon', 'Include Flow Polygon', false),
    bool('cycleflowdualcore', 'Include Flow Dual Core', false),
    bool('cycleflowcustom', 'Include Flow Custom', false),
    bool('cyclewarpnone', 'Include Warp None', true),
    bool('cyclewarpradial', 'Include Warp Radial', true),
    bool('cyclewarptwist', 'Include Warp Twist', true),
    bool('cyclewarpgrid', 'Include Warp Grid', true),
    bool('cyclewarpwave', 'Include Warp Wave', false),
    bool('cyclewarpflower', 'Include Warp Flower', false),
    bool('cyclewarptriangular', 'Include Warp Triangular', false),
    bool('cyclewarpcustom', 'Include Warp Custom', false),

    group('barsgroup', 'Bars'),
    slider('geometrythetashift', 'Theta Shift', 0, 359, 0),
    slider('geometryrotationhz', 'Rotation Speed (Hz)', 0, 1, 0.06, { step: 0.01, fraction: true, precision: 2 }),
    bool('geometryreverse', 'Reverse Rotation', false),
    slider('geometrysizebyenergy', 'Size By Energy', -700, 700, 200, { step: 0.1, fraction: true, precision: 1 }),
    slider('_2doffsetx', '2D Offset X', -1, 1, 0, { step: 0.01, fraction: true, precision: 2 }),
    slider('_2doffsety', '2D Offset Y', -1, 1, 0, { step: 0.01, fraction: true, precision: 2 }),

    group('justbars', 'Bars: Just Bars'),
    combo('justbarsshape', 'Just Bars Shape', 'shapeB', [
        { label: 'Single Up / Down', value: 'shapeA' },
        { label: 'Single Down / Up', value: 'shapeB' },
        { label: 'Single Up / Up', value: 'shapeC' },
        { label: 'Single Down / Down', value: 'shapeD' },
        { label: 'Two-Sided', value: 'shapeE' },
    ]),
    slider('justbarsdistance', 'Bar Distance', 0.05, 1.5, 0.21, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),
    slider('justbarswidth', 'Bar Width', 0, 150, 100, {
        step: 1,
        precision: 0,
    }),
    slider('justbarslengthchangebysound', 'Bar Length By Sound', 0, 25, 7, {
        step: 0.1,
        fraction: true,
        precision: 2,
    }),
    slider('justbarslengthinitial', 'Bar Length Initial', 0, 10, 0.2, {
        step: 0.1,
        fraction: true,
        precision: 2,
    }),

    group('circle', 'Bars: Circle'),
    combo('circleshape', 'Circle Shape', 'two-sided', [
        { label: 'Single-Sided', value: 'single-sided' },
        { label: 'Two-Sided', value: 'two-sided' },
    ]),
    slider('circleradius', 'Circle Radius', 1, 40, 6.7, {
        step: 0.1,
        fraction: true,
        precision: 1,
    }),
    slider('circlebarwidth', 'Bar Width', 0, 150, 100, {
        step: 1,
        precision: 0,
    }),
    slider('circlelengthchangebysound', 'Bar Length By Sound', 0, 25, 5, {
        step: 0.1,
        fraction: true,
        precision: 2,
    }),
    slider('circlelengthinitial', 'Bar Length Initial', 0, 10, 0.2, {
        step: 0.1,
        fraction: true,
        precision: 2,
    }),

    group('doublecircle', 'Bars: Double Circle'),
    combo('doublecircleshape', 'Double Circle Shape', 'two-sided', [
        { label: 'Single-Sided', value: 'single-sided' },
        { label: 'Two-Sided', value: 'two-sided' },
    ]),
    slider('doublecircleradius', 'Circle Radius', 1, 40, 2, {
        step: 0.1,
        fraction: true,
        precision: 1,
    }),
    slider('doublecirclecenterdistanceratio', 'Center Distance (x Radius)', 0, 6, 4, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),
    slider('doublecirclebarwidth', 'Bar Width', 0, 150, 100, {
        step: 1,
        precision: 0,
    }),
    slider('doublecirclelengthchangebysound', 'Bar Length By Sound', 0, 25, 5, {
        step: 0.1,
        fraction: true,
        precision: 2,
    }),
    slider('doublecirclelengthinitial', 'Bar Length Initial', 0, 10, 0.2, {
        step: 0.1,
        fraction: true,
        precision: 2,
    }),
    slider('doublecircleminorthetashift', 'Minor Theta Shift', 0, 359, 0),

    group('slab', 'Bars: Slab'),
    combo('slabshape', 'Slab Shape', 'shapeB', [
        { label: 'Single Up / Down', value: 'shapeA' },
        { label: 'Single Down / Up', value: 'shapeB' },
        { label: 'Single Up / Up', value: 'shapeC' },
        { label: 'Single Down / Down', value: 'shapeD' },
        { label: 'Two-Sided', value: 'shapeE' },
    ]),
    slider('slabdistance', 'Bar Distance', 0.05, 1.5, 0.2, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),
    slider('slabwidth', 'Bar Width', 0, 150, 150, {
        step: 1,
        precision: 0,
    }),
    slider('slabheightchangebysound', 'Bar Height By Sound', 0, 25, 25, {
        step: 0.1,
        fraction: true,
        precision: 2,
    }),
    slider('slabheightinitial', 'Bar Height Initial', 0, 10, 2, {
        step: 0.1,
        fraction: true,
        precision: 2,
    }),
    slider('slabthickness', 'Thickness', 0, 5, 0.05, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),

    group('circleslab', 'Bars: Circle-Slab'),
    combo('circleslabshape', 'Circle-Slab Shape', 'two-sided', [
        { label: 'Single-Sided', value: 'single-sided' },
        { label: 'Two-Sided', value: 'two-sided' },
    ]),
    slider('circleslabradius', 'Circle Radius', 1, 40, 5, {
        step: 0.1,
        fraction: true,
        precision: 1,
    }),
    slider('circleslabbarwidth', 'Bar Width', 0, 150, 110, {
        step: 1,
        precision: 0,
    }),
    slider('circleslabheightchangebysound', 'Bar Height By Sound', 0, 25, 25, {
        step: 0.1,
        fraction: true,
        precision: 2,
    }),
    slider('circleslabthickness', 'Thickness', 0, 5, 0.5, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),

    group('doublecircleslab', 'Bars: Double Circle-Slab'),
    combo('doublecircleslabshape', 'Double Circle-Slab Shape', 'two-sided', [
        { label: 'Single-Sided', value: 'single-sided' },
        { label: 'Two-Sided', value: 'two-sided' },
    ]),
    slider('doublecircleslabradius', 'Circle Radius', 1, 40, 2.5, {
        step: 0.1,
        fraction: true,
        precision: 1,
    }),
    slider('doublecircleslabcenterdistanceratio', 'Center Distance (x Radius)', 0, 6, 5, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),
    slider('doublecircleslabbarwidth', 'Bar Width', 0, 150, 100, {
        step: 1,
        precision: 0,
    }),
    slider('doublecircleslabheightchangebysound', 'Bar Height By Sound', 0, 25, 2, {
        step: 0.1,
        fraction: true,
        precision: 2,
    }),
    slider('doublecircleslabthickness', 'Thickness', 0, 5, 0.5, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),
    slider('doublecircleslabminorthetashift', 'Minor Theta Shift', 0, 359, 152),

    group('flow', 'Flow'),
    bool('antialiasingwillcauseblur', 'Allow Blur Filter', true),
    slider('fade', 'Trail Fade', 0, 32, 0.9, { step: 0.1, fraction: true, precision: 2 }),
    slider('flowvelocity', 'Flow Velocity', 0, 100, 30, { step: 0.1, fraction: true, precision: 2 }),
    slider('flowopacitylimit', 'Flow Opacity Limit', 0, 1, 0.8, { step: 0.01, fraction: true, precision: 2 }),

    group('flowswirl', 'Flow: Swirl'),
    slider('flowfieldmix', 'Swirl Blend', 0, 1, 0.2, { step: 0.01, fraction: true, precision: 2 }),
    slider('flowswirldensity', 'Swirl Density', 0, 10, 3, { step: 0.1, fraction: true, precision: 1 }),
    slider('flowswirltheta', 'Swirl Theta (deg)', -180, 180, 66, { step: 0.1, fraction: true, precision: 1 }),
    slider('flowswirlstrength', 'Swirl Strength', 0, 1, 0.04, { step: 0.01, fraction: true, precision: 2 }),

    group('flowgrid', 'Flow: Grid'),
    slider('flowgridxfrequency', 'Grid X Frequency', 0, 8, 8, { step: 0.01, fraction: true, precision: 2 }),
    slider('flowgridyfrequency', 'Grid Y Frequency', 0, 8, 0.65, { step: 0.01, fraction: true, precision: 2 }),
    slider('flowgridsharpness', 'Grid Sharpness', 0.05, 2, 2, { step: 0.01, fraction: true, precision: 2 }),
    slider('flowgridstrength', 'Grid Strength', 0, 2, 2, { step: 0.01, fraction: true, precision: 2 }),

    group('flowsaddle', 'Flow: Saddle'),
    slider('flowsaddlefrequency', 'Saddle Frequency', 0, 8, 8, { step: 0.01, fraction: true, precision: 2 }),
    slider('flowsaddlestrength', 'Saddle Strength', 0, 2, 1.17, { step: 0.01, fraction: true, precision: 2 }),

    group('flowdualcore', 'Flow: Dual Core'),
    slider('flowdualcoredirection', 'Dual Core Direction', 0, 360, 261.3, {
        step: 0.1,
        fraction: true,
        precision: 1,
    }),
    slider('flowdualcorestrength', 'Dual Core Strength', 0, 2, 0.7, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),
    slider('flowdualcoredistance', 'Dual Core Distance', 0.1, 60, 18, {
        step: 0.1,
        fraction: true,
        precision: 1,
    }),

    group('flowpolygon', 'Flow: Polygon'),
    slider('flowpolygonsides', 'Polygon Sides', 1, 64, 5, { step: 1, precision: 0 }),
    slider('flowpolygonthetashift', 'Polygon Theta Shift', 0, 360, 54, { step: 1, precision: 0 }),
    slider('flowpolygonstripthetashift', 'Strip Theta Shift', 0, 360, 110, { step: 1, precision: 0 }),
    bool('flowpolygonreverse', 'Reverse Polygon Flow', false),
    slider('flowpolygontwiststrength', 'Polygon Twist Strength', -2, 2, 0.8, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),
    slider('flowpolygontwistfrequency', 'Polygon Twist Frequency', 0, 10, 3, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),
    slider('flowpolygonconcavestrength', 'Flow Inward Strength', -5, 5, -2.08, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),

    group('flowcustom', 'Flow: Custom'),
    combo('flowcustomfromtype', 'From Type', 'swirl', FLOW_TYPE_OPTIONS),
    combo('flowcustomtotype', 'To Type', 'grid', FLOW_TYPE_OPTIONS),
    slider('flowcustommix', 'Mix', 0, 1, 0.3, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),

    group('warpradial', 'Warp: Radial'),
    slider('warpradialfrequency', 'Radial Frequency', 0, 40, 26.5, { step: 1, precision: 0 }),
    slider('warpthetafrequency', 'Theta Frequency', 0, 50, 33, { step: 1, precision: 0 }),
    slider('warpradialsharpness', 'Radial Sharpness', 0.05, 2, 1.6, { step: 0.01, fraction: true, precision: 2 }),
    slider('warpthetasharpness', 'Theta Sharpness', 0.05, 2, 0.45, { step: 0.01, fraction: true, precision: 2 }),
    slider('warpradialamplitude', 'Radial Amplitude', 0, 1, 0.12, { step: 0.01, fraction: true, precision: 2 }),
    slider('warpthetaamplitude', 'Theta Amplitude', 0, 1, 0.12, { step: 0.01, fraction: true, precision: 2 }),

    group('warptwist', 'Warp: Twist'),
    slider('warptwistamount', 'Twist Amount', 0, 3, 2.34, { step: 0.01, fraction: true, precision: 2 }),
    slider('warptwistdecay', 'Twist Decay', 0, 5, 1.53, { step: 0.01, fraction: true, precision: 2 }),
    slider('warptwistradialfrequency', 'Twist Radial Frequency', 0, 40, 20, { step: 1, precision: 0 }),
    slider('warptwistradialamplitude', 'Twist Radial Amplitude', 0, 1, 0.12, { step: 0.01, fraction: true, precision: 2 }),

    group('warpgrid', 'Warp: Grid'),
    slider('warpgridxfrequency', 'Grid X Frequency', 0, 80, 60, { step: 1, precision: 0 }),
    slider('warpgridyfrequency', 'Grid Y Frequency', 0, 80, 60, { step: 0.1, fraction: true, precision: 1 }),
    slider('warpgridsharpness', 'Grid Sharpness', 0.05, 2, 2, { step: 0.01, fraction: true, precision: 2 }),
    slider('warpgridxamplitude', 'Grid X Amplitude', 0, 1, 0.05, { step: 0.01, fraction: true, precision: 2 }),
    slider('warpgridyamplitude', 'Grid Y Amplitude', 0, 1, 0.05, { step: 0.01, fraction: true, precision: 2 }),

    group('warpwave', 'Warp: Wave'),
    slider('warpwavexfrequency', 'Wave X Frequency', 0, 80, 20, { step: 0.1, fraction: true, precision: 1 }),
    slider('warpwaveyfrequency', 'Wave Y Frequency', 0, 80, 20, { step: 0.1, fraction: true, precision: 1 }),
    slider('warpwavexamplitude', 'Wave X Amplitude', 0, 1, 0.07, { step: 0.01, fraction: true, precision: 2 }),
    slider('warpwaveyamplitude', 'Wave Y Amplitude', 0, 1, 0.07, { step: 0.01, fraction: true, precision: 2 }),

    group('warpflower', 'Warp: Flower'),
    slider('warpflowerpetals', 'Flower Petals', 0, 20, 20, { step: 0.1, fraction: true, precision: 1 }),
    slider('warpfloweramplitude', 'Flower Amplitude', 0, 1, 0.07, { step: 0.01, fraction: true, precision: 2 }),
    slider('warpflowerdecay', 'Flower Decay', 0, 5, 5, { step: 0.01, fraction: true, precision: 2 }),

    group('warptriangular', 'Warp: Triangular'),
    slider('warptriangularwidth', 'Triangle Width', 0.001, 0.5, 0.04, {
        step: 0.001,
        fraction: true,
        precision: 3,
    }),
    slider('warptriangularheight', 'Triangle Height', 0.001, 0.5, 0.04, {
        step: 0.001,
        fraction: true,
        precision: 3,
    }),

    group('warpcustom', 'Warp: Custom'),
    combo('warpcustomfromtype', 'From Type', 'grid', WARP_TYPE_OPTIONS),
    combo('warpcustomtotype', 'To Type', 'twist', WARP_TYPE_OPTIONS),
    slider('warpcustommix', 'Mix', 0, 1, 0.6, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),
];
