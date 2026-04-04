import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { applyBackground } from '../../shared/features/background.js';
import { createClockOverlay } from '../../shared/features/clockOverlay.js';
import { RetroFlowPass } from '../../shared/three/RetroFlowPass.js';
import { RetroRadialWarpPass } from '../../shared/three/RetroRadialWarpPass.js';
import { createThreeCanvasApp } from '../../shared/three/createThreeCanvasApp.js';
import { rgbTripletToCss } from '../../shared/utils/color.js';
import { createGeometryCycleState, updateGeometryCycleState } from './geometryCycle.js';
import { DEFAULT_FLOW_DIRECTION, IDLE_COUNTDOWN_FRAMES, JUST_BARS_TYPE } from './constants.js';
import { computeEnergyBands, computeSelectedEnergy, getGeometryScale } from './energy.js';
import { buildGeometryPoints, createBarEntry, getMirroredIndex, mixGeometrySet, setBarGeometry } from './geometry.js';

function makeHslColor(hue, saturation, lightness) {
    const wrapped = hue >= 0 ? hue : hue + 360;
    return `hsl(${wrapped}, ${saturation}%, ${lightness}%)`;
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
        this.currentColor = new THREE.Color(1, 1, 1);
        this.geometryCycleState = createGeometryCycleState(JUST_BARS_TYPE);
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
        this.flowPass.setApplyFadingPerNFrames(this.currentValues.applyfadingpernframes);
        this.flowPass.setFadeAmount(this.currentValues.fade / 255);
        this.flowPass.setMoveDir(DEFAULT_FLOW_DIRECTION);
        this.flowPass.setMoveVelocity(this.currentValues.flowvelocity / 5);
        this.flowPass.setFieldMix(this.currentValues.flowfieldmix);
        this.flowPass.setFlowOpacityLimit(this.currentValues.flowopacitylimit);
        this.flowPass.setShadeFront(false);
        this.postWarpPass.enabled = this.currentValues.usepostwarp;
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

    applyProperties(nextValues) {
        const previousValues = this.currentValues;
        const shouldRefreshAll = Object.keys(previousValues).length === 0;
        const hasChanged = (...keys) => shouldRefreshAll || keys.some((key) => previousValues[key] !== nextValues[key]);

        this.currentValues = { ...nextValues };
        if (
            hasChanged(
                'barsgeometrytype',
                'enablegeometrycycle',
                'geometrycycleinterval',
                'geometryinterpolateduration',
                'cyclejustbars',
                'cyclecircle',
                'cycleslab',
                'cyclecircleslab',
            )
        ) {
            this.geometryCycleState.selectedType = this.currentValues.barsgeometrytype;
            this.geometryCycleState.enabledSignature = '';
            this.geometryCycleState = createGeometryCycleState(this.currentValues.barsgeometrytype);
        }
        if (hasChanged('barcolor')) {
            this.currentColor = new THREE.Color(rgbTripletToCss(this.currentValues.barcolor));
        }

        if (hasChanged('barcolor', 'usesinglecolor') && this.currentValues.usesinglecolor) {
            this.bars.forEach((bar) => {
                bar.primary.material.color = this.currentColor;
                bar.secondary.material.color = this.currentColor;
            });
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
                'applyfadingpernframes',
                'fade',
                'flowvelocity',
                'flowfieldmix',
                'flowopacitylimit',
                'usepostwarp',
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
        const hue = (this.currentValues.hueinitial + value * 9000 * this.currentValues.huechangebysound) % 360;
        const lightness = THREE.MathUtils.clamp(
            this.currentValues.lightness + value * 100 * this.currentValues.lightnesschangebysound,
            0,
            100,
        );
        return makeHslColor(hue, this.currentValues.saturation, lightness);
    }

    render(frame, incomingAudioSamples) {
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
        const geometryState = updateGeometryCycleState(this.geometryCycleState, this.currentValues, frame);

        for (let index = 0; index < this.sampleSize; index += 1) {
            const mirroredIndex = getMirroredIndex(index);
            const sample = audioSamples[mirroredIndex] ?? 0;
            const bar = this.bars[index];
            const primaryMaterial = bar.primary.material;
            const secondaryMaterial = bar.secondary.material;

            if (!this.currentValues.usesinglecolor) {
                const nextColor = new THREE.Color(this.colorForBar(sample));
                primaryMaterial.color = nextColor;
                secondaryMaterial.color = nextColor;
            }
            const opacity = THREE.MathUtils.clamp(
                this.currentValues.opacityinitial + sample * 100 * this.currentValues.opacitychangebysound,
                0,
                1,
            );
            primaryMaterial.opacity = opacity;
            secondaryMaterial.opacity = opacity;
            primaryMaterial.needsUpdate = true;
            secondaryMaterial.needsUpdate = true;

            const fromGeometry = buildGeometryPoints(this.currentValues, this.sampleSize, index, sample, frame, geometryState.fromType);
            const geometry = geometryState.mix > 0
                ? mixGeometrySet(
                    fromGeometry,
                    buildGeometryPoints(this.currentValues, this.sampleSize, index, sample, frame, geometryState.toType),
                    geometryState.mix,
                )
                : fromGeometry;
            setBarGeometry(bar, geometry.primary, geometry.secondary);
        }

        this.composer.render();
    }

    destroy() {
        this.clock.destroy();
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
