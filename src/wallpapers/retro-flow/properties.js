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

const BAR_TYPE_OPTIONS = [
    { label: 'Just Bars', value: 'just-bars' },
    { label: 'Circle', value: 'circle' },
    { label: 'Double Circle', value: 'double-circle' },
    { label: 'Slab', value: 'slab' },
    { label: 'Circle-Slab', value: 'circle-slab' },
    { label: 'Double Circle-Slab', value: 'double-circle-slab' },
];

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

    group('clock', 'Clock'),
    bool('showclock', 'Show Clock', true),
    slider('clocksizea', 'Clock Size A', 0.5, 18, 3, { step: 0.1, fraction: true, precision: 1 }),
    slider('clocksizeb', 'Clock Size B', 0.5, 12, 1, { step: 0.1, fraction: true, precision: 1 }),
    slider('clockpositionx', 'Clock Position X', 0, 100, 50),
    slider('clockpositiony', 'Clock Position Y', 0, 100, 50),
    bool('_24hourclock', '24 Hour Clock', false),
    color('clockcolor', 'Clock Color', '1 1 1'),
    color('clockshadowcolor', 'Clock Shadow Color', '0 0 0'),
    color('clockbackdropcolor', 'Clock Backdrop Color', '0 0 0'),
    slider('clockbackdropopacity', 'Clock Backdrop Opacity', 0, 1, 0.6, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),

    group('colors', 'Colors'),
    color('backgroundcolor', 'Background Color', '0 0 0'),
    color('barcolor', 'Bar Color', '1 1 1'),
    slider('huechangebysound', 'Hue By Sound', -2, 2, 0, { step: 0.01, fraction: true, precision: 2 }),
    slider('saturationchangebysound', 'Saturation By Sound', -10, 10, 0, { step: 0.01, fraction: true, precision: 2 }),
    slider('lightnesschangebysound', 'Lightness By Sound', -10, 10, 0, { step: 0.01, fraction: true, precision: 2 }),
    slider('opacityinitial', 'Opacity Initial', 0, 1, 1, { step: 0.01, fraction: true, precision: 2 }),
    slider('opacitychangebysound', 'Opacity By Sound', 0, 5, 1, { step: 0.01, fraction: true, precision: 2 }),

    group('cycle', 'Cycle'),
    slider('cycleinterval', 'Cycle Interval (sec)', 1, 60, 8, { step: 0.1, fraction: true, precision: 1 }),
    slider('cycleinterpolateduration', 'Interpolate Duration (sec)', 0, 10, 1, { step: 0.1, fraction: true, precision: 1 }),
    bool('cyclerandomcolor', 'Cycle Random Color', false),
    bool('cyclegeometryjustbars', 'Cycle Bar Just Bars', false),
    bool('cyclegeometrycircle', 'Cycle Bar Circle', true),
    bool('cyclegeometrydoublecircle', 'Cycle Bar Double Circle', false),
    bool('cyclegeometryslab', 'Cycle Bar Slab', false),
    bool('cyclegeometrycircleslab', 'Cycle Bar Circle-Slab', false),
    bool('cyclegeometrydoublecircleslab', 'Cycle Bar Double Circle-Slab', false),
    bool('cyclegeometrycustom', 'Cycle Bar Custom', false),
    bool('cycleflowswirl', 'Cycle Flow Swirl', true),
    bool('cycleflowgrid', 'Cycle Flow Grid', false),
    bool('cycleflowsaddle', 'Cycle Flow Saddle', false),
    bool('cycleflowpolygon', 'Cycle Flow Polygon', false),
    bool('cycleflowdualcore', 'Cycle Flow Dual Core', false),
    bool('cycleflowcustom', 'Cycle Flow Custom', false),
    bool('cyclewarpnone', 'Cycle Warp None', false),
    bool('cyclewarpradial', 'Cycle Warp Radial', true),
    bool('cyclewarptwist', 'Cycle Warp Twist', false),
    bool('cyclewarpgrid', 'Cycle Warp Grid', false),
    bool('cyclewarpwave', 'Cycle Warp Wave', false),
    bool('cyclewarpflower', 'Cycle Warp Flower', false),
    bool('cyclewarptriangular', 'Cycle Warp Triangular', false),
    bool('cyclewarpcustom', 'Cycle Warp Custom', false),

    group('barsgroup', 'Bars'),
    slider('geometrythetashift', 'Theta Shift', 0, 359, 0),
    slider('geometryrotationhz', 'Rotation Speed (Hz)', 0, 1, 0.05, { step: 0.01, fraction: true, precision: 2 }),
    bool('geometryreverse', 'Reverse Rotation', false),
    slider('geometrysizebyenergy', 'Size By Energy', -700, 700, 0, { step: 0.1, fraction: true, precision: 1 }),
    slider('_2doffsetx', '2D Offset X', -1, 1, 0, { step: 0.01, fraction: true, precision: 2 }),
    slider('_2doffsety', '2D Offset Y', -1, 1, 0, { step: 0.01, fraction: true, precision: 2 }),

    group('justbars', 'Bars: Just Bars'),
    combo('justbarsshape', 'Just Bars Shape', 'shapeE', [
        { label: 'Single Up / Down', value: 'shapeA' },
        { label: 'Single Down / Up', value: 'shapeB' },
        { label: 'Single Up / Up', value: 'shapeC' },
        { label: 'Single Down / Down', value: 'shapeD' },
        { label: 'Two-Sided', value: 'shapeE' },
    ]),
    slider('justbarsdistance', 'Bar Distance', 0.05, 1.5, 0.25, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),
    slider('justbarswidth', 'Bar Width', 0, 150, 100, {
        step: 1,
        precision: 0,
    }),
    slider('justbarslengthchangebysound', 'Bar Length By Sound', 0, 25, 1, {
        step: 0.1,
        fraction: true,
        precision: 2,
    }),
    slider('justbarslengthinitial', 'Bar Length Initial', 0, 10, 0, {
        step: 0.1,
        fraction: true,
        precision: 2,
    }),

    group('circle', 'Bars: Circle'),
    combo('circleshape', 'Circle Shape', 'two-sided', [
        { label: 'Single-Sided', value: 'single-sided' },
        { label: 'Two-Sided', value: 'two-sided' },
    ]),
    slider('circleradius', 'Circle Radius', 1, 40, 12, {
        step: 0.1,
        fraction: true,
        precision: 1,
    }),
    slider('circlebarwidth', 'Bar Width', 0, 150, 100, {
        step: 1,
        precision: 0,
    }),
    slider('circlelengthchangebysound', 'Bar Length By Sound', 0, 25, 1, {
        step: 0.1,
        fraction: true,
        precision: 2,
    }),
    slider('circlelengthinitial', 'Bar Length Initial', 0, 10, 0, {
        step: 0.1,
        fraction: true,
        precision: 2,
    }),

    group('doublecircle', 'Bars: Double Circle'),
    combo('doublecircleshape', 'Double Circle Shape', 'two-sided', [
        { label: 'Single-Sided', value: 'single-sided' },
        { label: 'Two-Sided', value: 'two-sided' },
    ]),
    slider('doublecircleradius', 'Circle Radius', 1, 40, 12, {
        step: 0.1,
        fraction: true,
        precision: 1,
    }),
    slider('doublecirclecenterdistanceratio', 'Center Distance (x Radius)', 0, 6, 2.2, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),
    slider('doublecirclebarwidth', 'Bar Width', 0, 150, 100, {
        step: 1,
        precision: 0,
    }),
    slider('doublecirclelengthchangebysound', 'Bar Length By Sound', 0, 25, 1, {
        step: 0.1,
        fraction: true,
        precision: 2,
    }),
    slider('doublecirclelengthinitial', 'Bar Length Initial', 0, 10, 0, {
        step: 0.1,
        fraction: true,
        precision: 2,
    }),
    slider('doublecircleminorthetashift', 'Minor Theta Shift', 0, 359, 0),

    group('slab', 'Bars: Slab'),
    combo('slabshape', 'Slab Shape', 'shapeE', [
        { label: 'Single Up / Down', value: 'shapeA' },
        { label: 'Single Down / Up', value: 'shapeB' },
        { label: 'Single Up / Up', value: 'shapeC' },
        { label: 'Single Down / Down', value: 'shapeD' },
        { label: 'Two-Sided', value: 'shapeE' },
    ]),
    slider('slabdistance', 'Bar Distance', 0.05, 1.5, 0.25, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),
    slider('slabwidth', 'Bar Width', 0, 150, 100, {
        step: 1,
        precision: 0,
    }),
    slider('slabheightchangebysound', 'Bar Height By Sound', 0, 25, 1, {
        step: 0.1,
        fraction: true,
        precision: 2,
    }),
    slider('slabheightinitial', 'Bar Height Initial', 0, 10, 0, {
        step: 0.1,
        fraction: true,
        precision: 2,
    }),
    slider('slabthickness', 'Thickness', 0, 5, 0.2, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),

    group('circleslab', 'Bars: Circle-Slab'),
    combo('circleslabshape', 'Circle-Slab Shape', 'two-sided', [
        { label: 'Single-Sided', value: 'single-sided' },
        { label: 'Two-Sided', value: 'two-sided' },
    ]),
    slider('circleslabradius', 'Circle Radius', 1, 40, 25, {
        step: 0.1,
        fraction: true,
        precision: 1,
    }),
    slider('circleslabbarwidth', 'Bar Width', 0, 150, 100, {
        step: 1,
        precision: 0,
    }),
    slider('circleslabheightchangebysound', 'Bar Height By Sound', 0, 25, 1, {
        step: 0.1,
        fraction: true,
        precision: 2,
    }),
    slider('circleslabthickness', 'Thickness', 0, 5, 0.2, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),

    group('doublecircleslab', 'Bars: Double Circle-Slab'),
    combo('doublecircleslabshape', 'Double Circle-Slab Shape', 'two-sided', [
        { label: 'Single-Sided', value: 'single-sided' },
        { label: 'Two-Sided', value: 'two-sided' },
    ]),
    slider('doublecircleslabradius', 'Circle Radius', 1, 40, 25, {
        step: 0.1,
        fraction: true,
        precision: 1,
    }),
    slider('doublecircleslabcenterdistanceratio', 'Center Distance (x Radius)', 0, 6, 2.2, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),
    slider('doublecircleslabbarwidth', 'Bar Width', 0, 150, 100, {
        step: 1,
        precision: 0,
    }),
    slider('doublecircleslabheightchangebysound', 'Bar Height By Sound', 0, 25, 1, {
        step: 0.1,
        fraction: true,
        precision: 2,
    }),
    slider('doublecircleslabthickness', 'Thickness', 0, 5, 0.2, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),
    slider('doublecircleslabminorthetashift', 'Minor Theta Shift', 0, 359, 0),

    group('custombars', 'Bars: Custom'),
    combo('custombarsfromtype', 'From Type', 'circle', BAR_TYPE_OPTIONS),
    combo('custombarstotype', 'To Type', 'slab', BAR_TYPE_OPTIONS),
    slider('custombarsmix', 'Mix', 0, 1, 0.5, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),

    group('flow', 'Flow'),
    bool('antialiasingwillcauseblur', 'Allow Blur Filter', false),
    slider('fade', 'Trail Fade', 0, 32, 1, { step: 0.1, fraction: true, precision: 2 }),
    slider('flowvelocity', 'Flow Velocity', 0, 100, 1, { step: 0.1, fraction: true, precision: 2 }),
    slider('flowopacitylimit', 'Flow Opacity Limit', 0, 1, 0.9, { step: 0.01, fraction: true, precision: 2 }),

    group('flowswirl', 'Flow: Swirl'),
    slider('flowfieldmix', 'Swirl Blend', 0, 1, 0, { step: 0.01, fraction: true, precision: 2 }),
    slider('flowswirldensity', 'Swirl Density', 0, 10, 5, { step: 0.1, fraction: true, precision: 1 }),
    slider('flowswirltheta', 'Swirl Theta (deg)', -180, 180, 5.73, { step: 0.1, fraction: true, precision: 1 }),
    slider('flowswirlstrength', 'Swirl Strength', 0, 4, 1, { step: 0.01, fraction: true, precision: 2 }),

    group('flowgrid', 'Flow: Grid'),
    slider('flowgridxfrequency', 'Grid X Frequency', 0, 8, 1.7, { step: 0.01, fraction: true, precision: 2 }),
    slider('flowgridyfrequency', 'Grid Y Frequency', 0, 8, 1.7, { step: 0.01, fraction: true, precision: 2 }),
    slider('flowgridsharpness', 'Grid Sharpness', 0.05, 2, 0.22, { step: 0.01, fraction: true, precision: 2 }),
    slider('flowgridstrength', 'Grid Strength', 0, 2, 0.45, { step: 0.01, fraction: true, precision: 2 }),

    group('flowsaddle', 'Flow: Saddle'),
    slider('flowsaddlefrequency', 'Saddle Frequency', 0, 8, 1.6, { step: 0.01, fraction: true, precision: 2 }),
    slider('flowsaddlestrength', 'Saddle Strength', 0, 2, 0.5, { step: 0.01, fraction: true, precision: 2 }),

    group('flowdualcore', 'Flow: Dual Core'),
    slider('flowdualcoredirection', 'Dual Core Direction', 0, 360, 24.1, {
        step: 0.1,
        fraction: true,
        precision: 1,
    }),
    slider('flowdualcorestrength', 'Dual Core Strength', 0, 2, 0.18, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),
    slider('flowdualcoredistance', 'Dual Core Distance', 0.1, 60, 15, {
        step: 0.1,
        fraction: true,
        precision: 1,
    }),

    group('flowpolygon', 'Flow: Polygon'),
    slider('flowpolygonsides', 'Polygon Sides', 1, 64, 6, { step: 1, precision: 0 }),
    slider('flowpolygonthetashift', 'Polygon Theta Shift', 0, 360, 0, { step: 1, precision: 0 }),
    slider('flowpolygonstripthetashift', 'Strip Theta Shift', 0, 360, 0, { step: 1, precision: 0 }),
    bool('flowpolygonreverse', 'Reverse Polygon Flow', false),
    slider('flowpolygontwiststrength', 'Polygon Twist Strength', -2, 2, 0.4, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),
    slider('flowpolygontwistfrequency', 'Polygon Twist Frequency', 0, 10, 1, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),
    slider('flowpolygonconcavestrength', 'Flow Inward Strength', -5, 5, 0.4, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),

    group('flowcustom', 'Flow: Custom'),
    combo('flowcustomfromtype', 'From Type', 'swirl', FLOW_TYPE_OPTIONS),
    combo('flowcustomtotype', 'To Type', 'grid', FLOW_TYPE_OPTIONS),
    slider('flowcustommix', 'Mix', 0, 1, 0.5, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),

    group('warpradial', 'Warp: Radial'),
    slider('warpradialfrequency', 'Radial Frequency', 0, 40, 27, { step: 0.1, fraction: true, precision: 1 }),
    slider('warpthetafrequency', 'Theta Frequency', 0, 40, 27, { step: 0.1, fraction: true, precision: 1 }),

    group('warptwist', 'Warp: Twist'),
    slider('warptwistamount', 'Twist Amount', 0, 3, 0.9, { step: 0.01, fraction: true, precision: 2 }),
    slider('warptwistdecay', 'Twist Decay', 0, 5, 1.8, { step: 0.01, fraction: true, precision: 2 }),
    slider('warptwistradialfrequency', 'Twist Radial Frequency', 0, 20, 8, { step: 0.1, fraction: true, precision: 1 }),
    slider('warptwistradialamplitude', 'Twist Radial Amplitude', 0, 1, 0.08, { step: 0.01, fraction: true, precision: 2 }),

    group('warpgrid', 'Warp: Grid'),
    slider('warpgridxfrequency', 'Grid X Frequency', 0, 60, 6, { step: 0.1, fraction: true, precision: 1 }),
    slider('warpgridyfrequency', 'Grid Y Frequency', 0, 60, 6, { step: 0.1, fraction: true, precision: 1 }),
    slider('warpgridsharpness', 'Grid Sharpness', 0.05, 2, 0.25, { step: 0.01, fraction: true, precision: 2 }),
    slider('warpgridxamplitude', 'Grid X Amplitude', 0, 1, 0.12, { step: 0.01, fraction: true, precision: 2 }),
    slider('warpgridyamplitude', 'Grid Y Amplitude', 0, 1, 0.12, { step: 0.01, fraction: true, precision: 2 }),

    group('warpwave', 'Warp: Wave'),
    slider('warpwavexfrequency', 'Wave X Frequency', 0, 20, 4, { step: 0.1, fraction: true, precision: 1 }),
    slider('warpwaveyfrequency', 'Wave Y Frequency', 0, 20, 5, { step: 0.1, fraction: true, precision: 1 }),
    slider('warpwavexamplitude', 'Wave X Amplitude', 0, 1, 0.18, { step: 0.01, fraction: true, precision: 2 }),
    slider('warpwaveyamplitude', 'Wave Y Amplitude', 0, 1, 0.12, { step: 0.01, fraction: true, precision: 2 }),

    group('warpflower', 'Warp: Flower'),
    slider('warpflowerpetals', 'Flower Petals', 0, 20, 6, { step: 0.1, fraction: true, precision: 1 }),
    slider('warpfloweramplitude', 'Flower Amplitude', 0, 1, 0.22, { step: 0.01, fraction: true, precision: 2 }),
    slider('warpflowerdecay', 'Flower Decay', 0, 5, 0.9, { step: 0.01, fraction: true, precision: 2 }),

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
    combo('warpcustomfromtype', 'From Type', 'radial', WARP_TYPE_OPTIONS),
    combo('warpcustomtotype', 'To Type', 'twist', WARP_TYPE_OPTIONS),
    slider('warpcustommix', 'Mix', 0, 1, 0.5, {
        step: 0.01,
        fraction: true,
        precision: 2,
    }),
];
