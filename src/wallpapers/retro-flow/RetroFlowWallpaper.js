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
    'cycleflowsine',
    'cycleflowvortex',
    'cyclewarpnone',
    'cyclewarpradial',
    'cyclewarptwist',
    'cyclewarpwave',
    'cyclewarpflower',
];

const CYCLE_TIMING_KEYS = ['cycleinterval', 'cycleinterpolateduration'];

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
        this.energyBands = { low: 0, mid: 0, high: 0 };
        this.selectedEnergy = 0;
        this.currentBarColor = new THREE.Color(1, 1, 1);
        this.currentBarHsl = { h: 0, s: 0, l: 1 };
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
        this.flowPass.setSineXFrequency(this.currentValues.flowsinexfrequency);
        this.flowPass.setSineYFrequency(this.currentValues.flowsineyfrequency);
        this.flowPass.setSineStrength(this.currentValues.flowsinestrength);
        this.flowPass.setVortexFrequency(this.currentValues.flowvortexfrequency);
        this.flowPass.setVortexStrength(this.currentValues.flowvortexstrength);

        this.postWarpPass.enabled = this.currentValues.usepostwarp;
        this.postWarpPass.setRadialFrequency(this.currentValues.warpradialfrequency);
        this.postWarpPass.setThetaFrequency(this.currentValues.warpthetafrequency);
        this.postWarpPass.setTwistAmount(this.currentValues.warptwistamount);
        this.postWarpPass.setTwistDecay(this.currentValues.warptwistdecay);
        this.postWarpPass.setTwistRadialFrequency(this.currentValues.warptwistradialfrequency);
        this.postWarpPass.setTwistRadialAmplitude(this.currentValues.warptwistradialamplitude);
        this.postWarpPass.setWaveXFrequency(this.currentValues.warpwavexfrequency);
        this.postWarpPass.setWaveYFrequency(this.currentValues.warpwaveyfrequency);
        this.postWarpPass.setWaveXAmplitude(this.currentValues.warpwavexamplitude);
        this.postWarpPass.setWaveYAmplitude(this.currentValues.warpwaveyamplitude);
        this.postWarpPass.setFlowerPetals(this.currentValues.warpflowerpetals);
        this.postWarpPass.setFlowerAmplitude(this.currentValues.warpfloweramplitude);
        this.postWarpPass.setFlowerDecay(this.currentValues.warpflowerdecay);
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
                'flowsinexfrequency',
                'flowsineyfrequency',
                'flowsinestrength',
                'flowvortexfrequency',
                'flowvortexstrength',
                'usepostwarp',
                'warpradialfrequency',
                'warpthetafrequency',
                'warptwistamount',
                'warptwistdecay',
                'warptwistradialfrequency',
                'warptwistradialamplitude',
                'warpwavexfrequency',
                'warpwaveyfrequency',
                'warpwavexamplitude',
                'warpwaveyamplitude',
                'warpflowerpetals',
                'warpfloweramplitude',
                'warpflowerdecay',
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

    colorForBar(value) {
        const hue = (this.currentBarHsl.h * 360 + value * 9000 * this.currentValues.huechangebysound) % 360;
        const saturation = THREE.MathUtils.clamp(
            this.currentBarHsl.s * 100 + value * 100 * this.currentValues.saturationchangebysound,
            0,
            100,
        );
        const lightness = THREE.MathUtils.clamp(
            this.currentBarHsl.l * 100 + value * 100 * this.currentValues.lightnesschangebysound,
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
        this.flowPass.setFlowInterpolation(cyclePhases.flow.fromType, cyclePhases.flow.toType, cyclePhases.flow.mix);
        this.postWarpPass.setWarpInterpolation(cyclePhases.warp.fromType, cyclePhases.warp.toType, cyclePhases.warp.mix);

        for (let index = 0; index < this.sampleSize; index += 1) {
            const sample = getSampleForGeometryPhase(audioSamples, index, cyclePhases.geometry);
            const bar = this.bars[index];
            const primaryMaterial = bar.primary.material;
            const secondaryMaterial = bar.secondary.material;

            const nextColor = this.colorForBar(sample);
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
