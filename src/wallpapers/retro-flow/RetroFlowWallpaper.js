import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { applyBackground } from '../../shared/features/background.js';
import { createClockOverlay } from '../../shared/features/clockOverlay.js';
import { createToastOverlay } from '../../shared/features/toastOverlay.js';
import { RetroFlowPass } from '../../shared/three/RetroFlowPass.js';
import { RetroRadialWarpPass } from '../../shared/three/RetroRadialWarpPass.js';
import { createThreeCanvasApp } from '../../shared/three/createThreeCanvasApp.js';
import { rgbTripletToCss } from '../../shared/utils/color.js';
import { createCycleState, resetCycleState, resolveCycleTypes, updateCycleState } from './cycle.js';
import { IDLE_COUNTDOWN_FRAMES } from './constants.js';
import { computeEnergyBands, computeSelectedEnergy, getGeometryScale } from './energy.js';
import { buildGeometryPoints, createBarEntry, getSampleForGeometryPhase, mixGeometrySet, setBarGeometry } from './geometry.js';

function parseRgbTriplet(value) {
    const channels = String(value ?? '1 1 1')
        .trim()
        .split(/\s+/)
        .map((channel) => Number.parseFloat(channel))
        .map((channel) => (Number.isFinite(channel) ? THREE.MathUtils.clamp(channel, 0, 1) : 1));
    const [r = 1, g = 1, b = 1] = channels;
    return { r, g, b };
}

const CYCLE_SELECTION_KEYS = [
    'cyclegeometryjustbars',
    'cyclegeometrycircle',
    'cyclegeometrydoublecircle',
    'cyclegeometryslab',
    'cyclegeometrycircleslab',
    'cyclegeometrydoublecircleslab',
    'cycleflowswirl',
    'cycleflowgrid',
    'cycleflowsaddle',
    'cycleflowpolygon',
    'cyclerandomcolor',
    'cyclewarpnone',
    'cyclewarpradial',
    'cyclewarptwist',
    'cyclewarpgrid',
    'cyclewarpwave',
    'cyclewarpflower',
    'cyclewarptriangular',
];

const CYCLE_TIMING_KEYS = ['cycleinterval', 'cycleinterpolateduration'];
const MIN_RANDOM_COLOR_SATURATION = 0.06;
const MAX_RANDOM_COLOR_SATURATION = 0.8;
const MIN_RANDOM_COLOR_LIGHTNESS = 0.05;
const MAX_RANDOM_COLOR_LIGHTNESS = 0.7;
const LARGE_HUE_DIFF_THRESHOLD = 0.25;

function cloneHsl(hsl) {
    return { h: hsl.h, s: hsl.s, l: hsl.l };
}

function makeRandomCycleHsl() {
    return {
        h: Math.random(),
        s: MIN_RANDOM_COLOR_SATURATION + Math.random() * (MAX_RANDOM_COLOR_SATURATION - MIN_RANDOM_COLOR_SATURATION),
        l: MIN_RANDOM_COLOR_LIGHTNESS + Math.random() * (MAX_RANDOM_COLOR_LIGHTNESS - MIN_RANDOM_COLOR_LIGHTNESS),
    };
}

function lerpHue(fromHue, toHue, mix) {
    let delta = toHue - fromHue;
    if (delta > 0.5) {
        delta -= 1;
    } else if (delta < -0.5) {
        delta += 1;
    }
    return (fromHue + delta * mix + 1) % 1;
}

function getHueDiff(fromHue, toHue) {
    return Math.abs((((toHue - fromHue + 0.5) % 1) + 1) % 1 - 0.5);
}

function interpolateCycleHsl(fromHsl, toHsl, mix) {
    if (getHueDiff(fromHsl.h, toHsl.h) <= LARGE_HUE_DIFF_THRESHOLD) {
        return {
            h: lerpHue(fromHsl.h, toHsl.h, mix),
            s: THREE.MathUtils.lerp(fromHsl.s, toHsl.s, mix),
            l: THREE.MathUtils.lerp(fromHsl.l, toHsl.l, mix),
        };
    }

    const pivotLightness = 0.5 * (fromHsl.l + toHsl.l);
    if (mix <= 0.5) {
        const localMix = mix / 0.5;
        return {
            h: fromHsl.h,
            s: THREE.MathUtils.lerp(fromHsl.s, 0, localMix),
            l: THREE.MathUtils.lerp(fromHsl.l, pivotLightness, localMix),
        };
    }

    const localMix = (mix - 0.5) / 0.5;
    return {
        h: toHsl.h,
        s: THREE.MathUtils.lerp(0, toHsl.s, localMix),
        l: THREE.MathUtils.lerp(pivotLightness, toHsl.l, localMix),
    };
}

function getBarsGroupRotation(currentValues, frame) {
    const direction = currentValues.geometryreverse ? -1 : 1;
    const spin = direction * frame * ((2 * Math.PI * currentValues.geometryrotationhz) / 60);
    const thetaShift = THREE.MathUtils.degToRad(currentValues.geometrythetashift ?? 0);
    return spin + thetaShift;
}

export class RetroFlowWallpaper {
    constructor({ host, audioBinCount }) {
        this.host = host;
        this.sampleSize = audioBinCount;
        this.canvas = createThreeCanvasApp(host, {
            cameraType: 'orthographic',
            viewZ: 60,
            showHalf: false,
        });
        this.scene = this.canvas.scene;
        this.camera = this.canvas.camera;
        this.renderer = this.canvas.renderer;
        this.clock = createClockOverlay(host);
        this.toast = createToastOverlay(host);
        this.composer = new EffectComposer(this.renderer);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.flowPass = new RetroFlowPass(1, 1);
        this.postWarpPass = new RetroRadialWarpPass(1, 1);
        this.composer.addPass(this.renderPass);
        this.composer.addPass(this.flowPass);
        this.composer.addPass(this.postWarpPass);

        this.currentValues = {};
        this.idleCountdown = IDLE_COUNTDOWN_FRAMES;
        this.energyBands = { all: 0 };
        this.selectedEnergy = 0;
        this.currentBarColor = new THREE.Color(1, 1, 1);
        this.currentBarHsl = { h: 0, s: 0, l: 1 };
        this.colorCycle = {
            currentHsl: cloneHsl(this.currentBarHsl),
            fromHsl: cloneHsl(this.currentBarHsl),
            targetHsl: cloneHsl(this.currentBarHsl),
            fromToken: 0,
            toToken: 0,
        };
        this.cycleState = createCycleState();
        this.resolvedCycleTypes = resolveCycleTypes({});
        this.lastFrame = 0;
        this.bars = [];
        this.barsGroup = new THREE.Group();
        this.light = new THREE.HemisphereLight(0xffffff, 0x080808, 1);
        this.scene.add(this.light);
        this.scene.add(this.barsGroup);

        for (let index = 0; index < this.sampleSize; index += 1) {
            const bar = createBarEntry();
            this.barsGroup.add(bar.primary);
            this.barsGroup.add(bar.secondary);
            this.bars.push(bar);
        }
    }

    updateClock() {
        this.clock.update({
            visible: this.currentValues.showclock,
            sizePrimary: this.currentValues.clocksizea,
            sizeSecondary: this.currentValues.clocksizeb,
            positionX: this.currentValues.clockpositionx,
            positionY: this.currentValues.clockpositiony,
            twentyFourHour: this.currentValues._24hourclock,
            color: rgbTripletToCss(this.currentValues.clockcolor),
            shadowColor: rgbTripletToCss(this.currentValues.clockshadowcolor),
            backdropColor: rgbTripletToCss(this.currentValues.clockbackdropcolor),
            backdropOpacity: this.currentValues.clockbackdropopacity,
        });
    }

    updateBackground() {
        applyBackground(this.host, {
            color: rgbTripletToCss(this.currentValues.backgroundcolor),
            image: this.currentValues.usecustomimage && this.currentValues.customimage ? this.currentValues.customimage : '',
        });
    }

    updateSceneTransform() {
        this.barsGroup.position.x = this.currentValues._2doffsetx * 20;
        this.barsGroup.position.y = this.currentValues._2doffsety * 20 * 0.73;
        this.updatePassCenters();
    }

    updatePassCenters() {
        const cameraWidth = this.camera.right - this.camera.left;
        const cameraHeight = this.camera.top - this.camera.bottom;
        const centerX = THREE.MathUtils.clamp(0.5 + this.barsGroup.position.x / cameraWidth, 0, 1);
        const centerY = THREE.MathUtils.clamp(0.5 + this.barsGroup.position.y / cameraHeight, 0, 1);
        this.flowPass.setCenter(centerX, centerY);
        this.postWarpPass.setCenter(centerX, centerY);
    }

    updateFlowSettings() {
        this.flowPass.setFilter(this.currentValues.antialiasingwillcauseblur ? THREE.LinearFilter : THREE.NearestFilter);
        this.flowPass.setFadeAmount(this.currentValues.fade / 255);
        this.flowPass.setMoveVelocity(this.currentValues.flowvelocity / 5);
        this.flowPass.setFlowOpacityLimit(this.currentValues.flowopacitylimit);
        this.flowPass.setShadeFront(false);
        this.flowPass.setSwirlBlend(this.currentValues.flowfieldmix);
        this.flowPass.setSwirlDensity(this.currentValues.flowswirldensity);
        this.flowPass.setSwirlTheta(THREE.MathUtils.degToRad(this.currentValues.flowswirltheta));
        this.flowPass.setSwirlStrength(this.currentValues.flowswirlstrength);
        this.flowPass.setGridXFrequency(this.currentValues.flowgridxfrequency);
        this.flowPass.setGridYFrequency(this.currentValues.flowgridyfrequency);
        this.flowPass.setGridSharpness(this.currentValues.flowgridsharpness);
        this.flowPass.setGridStrength(this.currentValues.flowgridstrength);
        this.flowPass.setSaddleFrequency(this.currentValues.flowsaddlefrequency);
        this.flowPass.setSaddleStrength(this.currentValues.flowsaddlestrength);
        this.flowPass.setPolygonSides(this.currentValues.flowpolygonsides);
        this.flowPass.setPolygonThetaShift(THREE.MathUtils.degToRad(this.currentValues.flowpolygonthetashift));
        this.flowPass.setStripThetaShift(THREE.MathUtils.degToRad(this.currentValues.flowpolygonstripthetashift));
        this.flowPass.setPolygonReverse(this.currentValues.flowpolygonreverse);
        this.flowPass.setPolygonTwistStrength(this.currentValues.flowpolygontwiststrength);
        this.flowPass.setPolygonTwistFrequency(this.currentValues.flowpolygontwistfrequency);
        this.flowPass.setPolygonConcaveStrength(this.currentValues.flowpolygonconcavestrength);

        this.postWarpPass.setRadialFrequency(this.currentValues.warpradialfrequency);
        this.postWarpPass.setThetaFrequency(this.currentValues.warpthetafrequency);
        this.postWarpPass.setTwistAmount(this.currentValues.warptwistamount);
        this.postWarpPass.setTwistDecay(this.currentValues.warptwistdecay);
        this.postWarpPass.setTwistRadialFrequency(this.currentValues.warptwistradialfrequency);
        this.postWarpPass.setTwistRadialAmplitude(this.currentValues.warptwistradialamplitude);
        this.postWarpPass.setGridXFrequency(this.currentValues.warpgridxfrequency);
        this.postWarpPass.setGridYFrequency(this.currentValues.warpgridyfrequency);
        this.postWarpPass.setGridSharpness(this.currentValues.warpgridsharpness);
        this.postWarpPass.setGridXAmplitude(this.currentValues.warpgridxamplitude);
        this.postWarpPass.setGridYAmplitude(this.currentValues.warpgridyamplitude);
        this.postWarpPass.setWaveXFrequency(this.currentValues.warpwavexfrequency);
        this.postWarpPass.setWaveYFrequency(this.currentValues.warpwaveyfrequency);
        this.postWarpPass.setWaveXAmplitude(this.currentValues.warpwavexamplitude);
        this.postWarpPass.setWaveYAmplitude(this.currentValues.warpwaveyamplitude);
        this.postWarpPass.setFlowerPetals(this.currentValues.warpflowerpetals);
        this.postWarpPass.setFlowerAmplitude(this.currentValues.warpfloweramplitude);
        this.postWarpPass.setFlowerDecay(this.currentValues.warpflowerdecay);
        this.postWarpPass.setTriangularWidth(this.currentValues.warptriangularwidth);
        this.postWarpPass.setTriangularHeight(this.currentValues.warptriangularheight);
    }

    resetColorCycle() {
        const baseHsl = cloneHsl(this.currentBarHsl);
        this.colorCycle = {
            currentHsl: baseHsl,
            fromHsl: cloneHsl(baseHsl),
            targetHsl: cloneHsl(baseHsl),
            fromToken: 0,
            toToken: 0,
        };
    }

    getActiveBaseHsl(colorPhase) {
        if (!this.currentValues.cyclerandomcolor) {
            this.resetColorCycle();
            return this.currentBarHsl;
        }

        if (colorPhase.fromToken === colorPhase.toToken) {
            return this.colorCycle.currentHsl;
        }

        if (this.colorCycle.fromToken !== colorPhase.fromToken || this.colorCycle.toToken !== colorPhase.toToken) {
            this.colorCycle.fromToken = colorPhase.fromToken;
            this.colorCycle.toToken = colorPhase.toToken;
            this.colorCycle.fromHsl = cloneHsl(this.colorCycle.currentHsl);
            this.colorCycle.targetHsl = makeRandomCycleHsl();
        }

        const nextHsl = {
            ...interpolateCycleHsl(this.colorCycle.fromHsl, this.colorCycle.targetHsl, colorPhase.mix),
        };

        if (colorPhase.mix >= 1) {
            this.colorCycle.currentHsl = cloneHsl(this.colorCycle.targetHsl);
            return this.colorCycle.currentHsl;
        }

        return nextHsl;
    }

    updateCanvas() {
        const metrics = this.canvas.resize({
            pixelated: this.currentValues.pixelated * 2,
            canvasScale: this.currentValues.canvasshrink + 1,
            offsetX: this.currentValues.offsetx,
            offsetY: this.currentValues.offsety,
            viewAngle: 0,
        });
        this.composer.setSize(metrics.renderWidth, metrics.renderHeight);
        this.flowPass.setSize(metrics.renderWidth, metrics.renderHeight);
        this.postWarpPass.setSize(metrics.renderWidth, metrics.renderHeight);
        this.updatePassCenters();
    }

    updateResolvedCycleTypes() {
        this.resolvedCycleTypes = resolveCycleTypes(this.currentValues);
    }

    notifyCycleFallbacks() {
        const messages = [];
        if (this.resolvedCycleTypes.geometry.fallbackUsed) {
            messages.push('No bars geometry type selected. Using default Circle.');
        }
        if (this.resolvedCycleTypes.flow.fallbackUsed) {
            messages.push('No flow type selected. Using default Swirl.');
        }
        if (this.resolvedCycleTypes.warp.fallbackUsed) {
            messages.push('No warp type selected. Using default Radial.');
        }
        if (messages.length > 0) {
            this.toast.show(messages.join('\n'), 3000);
        }
    }

    resetCycleState() {
        resetCycleState(
            this.cycleState,
            this.resolvedCycleTypes,
            this.currentValues.cycleinterval ?? 8,
            this.lastFrame / 60,
        );
    }

    applyProperties(nextValues) {
        const previousValues = this.currentValues;
        const shouldRefreshAll = Object.keys(previousValues).length === 0;
        const hasChanged = (...keys) => shouldRefreshAll || keys.some((key) => previousValues[key] !== nextValues[key]);

        this.currentValues = { ...nextValues };
        if (hasChanged(...CYCLE_SELECTION_KEYS, ...CYCLE_TIMING_KEYS)) {
            this.updateResolvedCycleTypes();
            this.resetCycleState();
        }
        if (hasChanged(...CYCLE_SELECTION_KEYS)) {
            this.notifyCycleFallbacks();
        }
        if (hasChanged('barcolor')) {
            const { r, g, b } = parseRgbTriplet(this.currentValues.barcolor);
            this.currentBarColor = new THREE.Color().setRGB(r, g, b);
            const nextHsl = { h: 0, s: 0, l: 0 };
            this.currentBarColor.getHSL(nextHsl);
            this.currentBarHsl = nextHsl;
            this.resetColorCycle();
        }
        if (hasChanged('cyclerandomcolor')) {
            this.resetColorCycle();
        }

        if (hasChanged('backgroundcolor', 'usecustomimage', 'customimage')) {
            this.updateBackground();
        }
        if (hasChanged('_2doffsetx', '_2doffsety')) {
            this.updateSceneTransform();
        }
        if (
            hasChanged(
                'antialiasingwillcauseblur',
                'fade',
                'flowvelocity',
                'flowopacitylimit',
                'flowfieldmix',
                'flowswirldensity',
                'flowswirltheta',
                'flowswirlstrength',
                'flowgridxfrequency',
                'flowgridyfrequency',
                'flowgridsharpness',
                'flowgridstrength',
                'flowsaddlefrequency',
                'flowsaddlestrength',
                'flowpolygonsides',
                'flowpolygonthetashift',
                'flowpolygonstripthetashift',
                'flowpolygonreverse',
                'flowpolygontwiststrength',
                'flowpolygontwistfrequency',
                'flowpolygonconcavestrength',
                'warpradialfrequency',
                'warpthetafrequency',
                'warptwistamount',
                'warptwistdecay',
                'warptwistradialfrequency',
                'warptwistradialamplitude',
                'warpgridxfrequency',
                'warpgridyfrequency',
                'warpgridsharpness',
                'warpgridxamplitude',
                'warpgridyamplitude',
                'warpwavexfrequency',
                'warpwaveyfrequency',
                'warpwavexamplitude',
                'warpwaveyamplitude',
                'warpflowerpetals',
                'warpfloweramplitude',
                'warpflowerdecay',
                'warptriangularwidth',
                'warptriangularheight',
            )
        ) {
            this.updateFlowSettings();
        }
        if (
            hasChanged(
                'showclock',
                'clocksizea',
                'clocksizeb',
                'clockpositionx',
                'clockpositiony',
                '_24hourclock',
                'clockcolor',
                'clockshadowcolor',
                'clockbackdropcolor',
                'clockbackdropopacity',
            )
        ) {
            this.updateClock();
        }
        if (hasChanged('pixelated', 'canvasshrink', 'offsetx', 'offsety')) {
            this.updateCanvas();
        }
        this.idleCountdown = IDLE_COUNTDOWN_FRAMES;
    }

    resize() {
        this.updateCanvas();
    }

    colorForBar(baseHsl, value) {
        const hue = (baseHsl.h * 360 + value * 9000 * this.currentValues.huechangebysound) % 360;
        const saturation = THREE.MathUtils.clamp(
            baseHsl.s * 100 + value * 100 * this.currentValues.saturationchangebysound,
            0,
            100,
        );
        const lightness = THREE.MathUtils.clamp(
            baseHsl.l * 100 + value * 100 * this.currentValues.lightnesschangebysound,
            0,
            100,
        );
        const wrappedHue = ((hue % 360) + 360) % 360;
        return new THREE.Color().setHSL(wrappedHue / 360, saturation / 100, lightness / 100);
    }

    render(frame, incomingAudioSamples) {
        this.lastFrame = frame;
        this.scene.rotation.z = 0;

        const allZero = incomingAudioSamples.every((value) => value === 0);
        let audioSamples = incomingAudioSamples;
        this.energyBands = computeEnergyBands(incomingAudioSamples);
        this.selectedEnergy = computeSelectedEnergy(this.currentValues, this.energyBands);

        if (allZero && this.currentValues.reduceframerate) {
            if (this.idleCountdown === 0) {
                return;
            }
            this.idleCountdown -= 1;
        } else {
            audioSamples = audioSamples.map((value) => value * this.currentValues.overallmagnitude);
        }

        if (!allZero) {
            this.idleCountdown = IDLE_COUNTDOWN_FRAMES;
        }

        this.barsGroup.scale.setScalar(getGeometryScale(this.currentValues, this.selectedEnergy));
        this.barsGroup.rotation.z = getBarsGroupRotation(this.currentValues, frame);
        const cyclePhases = updateCycleState(this.cycleState, this.resolvedCycleTypes, this.currentValues, frame);
        const activeBaseHsl = this.getActiveBaseHsl(cyclePhases.color);
        this.flowPass.setFlowInterpolation(cyclePhases.flow.fromType, cyclePhases.flow.toType, cyclePhases.flow.mix);
        this.postWarpPass.setWarpInterpolation(cyclePhases.warp.fromType, cyclePhases.warp.toType, cyclePhases.warp.mix);

        for (let index = 0; index < this.sampleSize; index += 1) {
            const sample = getSampleForGeometryPhase(audioSamples, index, cyclePhases.geometry);
            const bar = this.bars[index];
            const primaryMaterial = bar.primary.material;
            const secondaryMaterial = bar.secondary.material;

            const nextColor = this.colorForBar(activeBaseHsl, sample);
            primaryMaterial.color.copy(nextColor);
            secondaryMaterial.color.copy(nextColor);
            const opacity = THREE.MathUtils.clamp(
                this.currentValues.opacityinitial + sample * 100 * this.currentValues.opacitychangebysound,
                0,
                1,
            );
            primaryMaterial.opacity = opacity;
            secondaryMaterial.opacity = opacity;
            primaryMaterial.needsUpdate = true;
            secondaryMaterial.needsUpdate = true;

            const fromGeometry = buildGeometryPoints(
                this.currentValues,
                this.sampleSize,
                index,
                sample,
                cyclePhases.geometry.fromType,
            );
            const geometry = cyclePhases.geometry.mix > 0
                ? mixGeometrySet(
                    fromGeometry,
                    buildGeometryPoints(
                        this.currentValues,
                        this.sampleSize,
                        index,
                        sample,
                        cyclePhases.geometry.toType,
                    ),
                    cyclePhases.geometry.mix,
                )
                : fromGeometry;
            setBarGeometry(bar, geometry.primary, geometry.secondary);
        }

        this.composer.render();
    }

    destroy() {
        this.clock.destroy();
        this.toast.destroy();
        this.composer.dispose();
        this.flowPass.dispose();
        this.postWarpPass.dispose();
        this.bars.forEach((bar) => {
            bar.primary.geometry.dispose();
            bar.primary.material.dispose();
            bar.secondary.geometry.dispose();
            bar.secondary.material.dispose();
            this.barsGroup.remove(bar.primary);
            this.barsGroup.remove(bar.secondary);
        });
        this.scene.remove(this.barsGroup);
        this.canvas.dispose();
    }
}
