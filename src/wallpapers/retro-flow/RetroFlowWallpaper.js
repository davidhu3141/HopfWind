import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { applyBackground } from '../../shared/features/background.js';
import { createClockOverlay } from '../../shared/features/clockOverlay.js';
import { RetroFlowPass } from '../../shared/three/RetroFlowPass.js';
import { RetroRadialWarpPass } from '../../shared/three/RetroRadialWarpPass.js';
import { createThreeCanvasApp } from '../../shared/three/createThreeCanvasApp.js';
import { rgbTripletToCss } from '../../shared/utils/color.js';

const IDLE_COUNTDOWN_FRAMES = 600;
const DEFAULT_FLOW_DIRECTION = Math.PI / 2;
const SAMPLE_SIZE_HALF = 64;
const JUST_BARS_TYPE = 'just-bars';
const CIRCLE_TYPE = 'circle';
const SLAB_TYPE = 'slab';
const CIRCLE_SLAB_TYPE = 'circle-slab';

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
        this.geometryCycleState = {
            currentType: JUST_BARS_TYPE,
            targetType: JUST_BARS_TYPE,
            transitionFromType: JUST_BARS_TYPE,
            transitionStartSeconds: 0,
            nextSwitchSeconds: Infinity,
            enabledSignature: '',
            selectedType: JUST_BARS_TYPE,
        };
        this.bars = [];
        this.barsGroup = new THREE.Group();
        this.light = new THREE.HemisphereLight(0xffffff, 0x080808, 1);
        this.scene.add(this.light);
        this.scene.add(this.barsGroup);

        for (let index = 0; index < this.sampleSize; index += 1) {
            const bar = this.createBarEntry();
            this.barsGroup.add(bar.primary);
            this.barsGroup.add(bar.secondary);
            this.bars.push(bar);
        }
    }

    createBarMesh() {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
        geometry.setIndex([0, 1, 2, 0, 2, 3]);
        const material = new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.frustumCulled = false;
        return mesh;
    }

    createBarEntry() {
        const primary = this.createBarMesh();
        const secondary = this.createBarMesh();
        secondary.visible = false;
        return { primary, secondary };
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

    resetGeometryCycleState(currentType = this.currentValues.barsgeometrytype ?? JUST_BARS_TYPE, nowSeconds = 0) {
        this.geometryCycleState.currentType = currentType;
        this.geometryCycleState.targetType = currentType;
        this.geometryCycleState.transitionFromType = currentType;
        this.geometryCycleState.transitionStartSeconds = nowSeconds;
        this.geometryCycleState.nextSwitchSeconds = nowSeconds + (this.currentValues.geometrycycleinterval ?? 8);
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
            this.resetGeometryCycleState(this.currentValues.barsgeometrytype);
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

    computeEnergyBands(audioSamples) {
        const sumStereoRange = (start, end) => {
            let total = 0;
            for (let index = start; index <= end; index += 1) {
                total += (audioSamples[index] ?? 0) + (audioSamples[index + 64] ?? 0);
            }
            return total;
        };

        return {
            low: sumStereoRange(0, 3),
            mid: sumStereoRange(4, 45),
            high: sumStereoRange(46, 63),
        };
    }

    computeSelectedEnergy(energyBands) {
        let total = 0;
        if (this.currentValues.useenergylow) {
            total += energyBands.low;
        }
        if (this.currentValues.useenergymid) {
            total += energyBands.mid;
        }
        if (this.currentValues.useenergyhigh) {
            total += energyBands.high;
        }
        return total;
    }

    getMirroredIndex(index) {
        return index >= SAMPLE_SIZE_HALF
            ? SAMPLE_SIZE_HALF * 3 - index - 1
            : index;
    }

    getActiveEnergySampleCount() {
        let count = 0;
        if (this.currentValues.useenergylow) {
            count += 8;
        }
        if (this.currentValues.useenergymid) {
            count += 84;
        }
        if (this.currentValues.useenergyhigh) {
            count += 36;
        }
        return count;
    }

    getGeometryScale() {
        const activeSampleCount = this.getActiveEnergySampleCount();
        const normalizedEnergy = activeSampleCount > 0 ? this.selectedEnergy / activeSampleCount : 0;
        return Math.max(0.05, 1 + this.currentValues.geometrysizebyenergy * 0.1 * normalizedEnergy);
    }

    getGeometryRotation(frame) {
        const direction = this.currentValues.geometryreverse ? -1 : 1;
        return direction * frame * ((2 * Math.PI * this.currentValues.geometryrotationhz) / 60);
    }

    getJustBarsWidthRatio() {
        return this.currentValues.justbarswidth / 100;
    }

    getCircleWidthRatio() {
        return this.currentValues.circlebarwidth / 100;
    }

    getSlabWidthRatio() {
        return this.currentValues.slabwidth / 100;
    }

    getCircleSlabWidthRatio() {
        return this.currentValues.circleslabbarwidth / 100;
    }

    setQuadPositions(positionAttribute, points) {
        for (let index = 0; index < points.length; index += 1) {
            positionAttribute.setXYZ(index, points[index].x, points[index].y, 0);
        }
        positionAttribute.needsUpdate = true;
    }

    getEnabledGeometryTypes() {
        const enabled = [];
        if (this.currentValues.cyclejustbars) {
            enabled.push(JUST_BARS_TYPE);
        }
        if (this.currentValues.cyclecircle) {
            enabled.push(CIRCLE_TYPE);
        }
        if (this.currentValues.cycleslab) {
            enabled.push(SLAB_TYPE);
        }
        if (this.currentValues.cyclecircleslab) {
            enabled.push(CIRCLE_SLAB_TYPE);
        }
        return enabled.length > 0 ? enabled : [this.currentValues.barsgeometrytype];
    }

    chooseNextGeometryType(enabledTypes, currentType) {
        const candidates = enabledTypes.filter((type) => type !== currentType);
        if (candidates.length === 0) {
            return currentType;
        }
        const index = Math.floor(Math.random() * candidates.length);
        return candidates[index];
    }

    updateGeometryCycle(frame) {
        const nowSeconds = frame / 60;
        const enabledTypes = this.getEnabledGeometryTypes();
        const enabledSignature = enabledTypes.join('|');
        const selectedType = this.currentValues.barsgeometrytype;

        if (
            this.geometryCycleState.enabledSignature !== enabledSignature
            || this.geometryCycleState.selectedType !== selectedType
        ) {
            const nextType = enabledTypes.includes(selectedType) ? selectedType : enabledTypes[0];
            this.geometryCycleState.enabledSignature = enabledSignature;
            this.geometryCycleState.selectedType = selectedType;
            this.resetGeometryCycleState(nextType, nowSeconds);
        }

        if (!this.currentValues.enablegeometrycycle || enabledTypes.length < 2) {
            this.geometryCycleState.currentType = selectedType;
            this.geometryCycleState.targetType = selectedType;
            this.geometryCycleState.transitionFromType = selectedType;
            return {
                fromType: selectedType,
                toType: selectedType,
                mix: 0,
            };
        }

        const duration = Math.max(0, this.currentValues.geometryinterpolateduration);
        if (this.geometryCycleState.currentType !== this.geometryCycleState.targetType) {
            const progress = duration <= 0
                ? 1
                : (nowSeconds - this.geometryCycleState.transitionStartSeconds) / duration;
            const mix = THREE.MathUtils.clamp(progress, 0, 1);
            if (mix >= 1) {
                this.geometryCycleState.currentType = this.geometryCycleState.targetType;
                this.geometryCycleState.transitionFromType = this.geometryCycleState.targetType;
                this.geometryCycleState.transitionStartSeconds = nowSeconds;
                this.geometryCycleState.nextSwitchSeconds = nowSeconds + this.currentValues.geometrycycleinterval;
                return {
                    fromType: this.geometryCycleState.currentType,
                    toType: this.geometryCycleState.currentType,
                    mix: 0,
                };
            }
            return {
                fromType: this.geometryCycleState.transitionFromType,
                toType: this.geometryCycleState.targetType,
                mix,
            };
        }

        if (nowSeconds >= this.geometryCycleState.nextSwitchSeconds) {
            const nextType = this.chooseNextGeometryType(enabledTypes, this.geometryCycleState.currentType);
            this.geometryCycleState.transitionFromType = this.geometryCycleState.currentType;
            this.geometryCycleState.targetType = nextType;
            this.geometryCycleState.transitionStartSeconds = nowSeconds;
            if (duration <= 0) {
                this.geometryCycleState.currentType = nextType;
                this.geometryCycleState.transitionFromType = nextType;
                this.geometryCycleState.nextSwitchSeconds = nowSeconds + this.currentValues.geometrycycleinterval;
                return {
                    fromType: nextType,
                    toType: nextType,
                    mix: 0,
                };
            }
            return {
                fromType: this.geometryCycleState.transitionFromType,
                toType: nextType,
                mix: 0,
            };
        }

        return {
            fromType: this.geometryCycleState.currentType,
            toType: this.geometryCycleState.currentType,
            mix: 0,
        };
    }

    createCollapsedPoints(points) {
        const centroid = points.reduce(
            (sum, point) => sum.add(point),
            new THREE.Vector2(0, 0),
        ).multiplyScalar(1 / points.length);
        return Array.from({ length: 4 }, () => centroid.clone());
    }

    mixPointSets(fromPoints, toPoints, mix) {
        return fromPoints.map((point, index) => point.clone().lerp(toPoints[index], mix));
    }

    mixGeometrySet(fromGeometry, toGeometry, mix) {
        const primary = this.mixPointSets(fromGeometry.primary, toGeometry.primary, mix);

        const hasSecondary = Boolean(fromGeometry.secondary || toGeometry.secondary);
        if (!hasSecondary) {
            return { primary };
        }

        const fromSecondary = fromGeometry.secondary ?? this.createCollapsedPoints(toGeometry.secondary ?? fromGeometry.primary);
        const toSecondary = toGeometry.secondary ?? this.createCollapsedPoints(fromGeometry.secondary ?? toGeometry.primary);
        return {
            primary,
            secondary: this.mixPointSets(fromSecondary, toSecondary, mix),
        };
    }

    setBarGeometry(bar, primaryPoints, secondaryPoints = null) {
        this.setQuadPositions(bar.primary.geometry.attributes.position, primaryPoints);
        bar.primary.visible = true;

        if (secondaryPoints) {
            this.setQuadPositions(bar.secondary.geometry.attributes.position, secondaryPoints);
            bar.secondary.visible = true;
        } else {
            bar.secondary.visible = false;
        }
    }

    buildJustBarsPoints(index, sample, rotationAngle) {
        const height = this.currentValues.justbarslengthinitial / 30 + this.currentValues.justbarslengthchangebysound * sample;
        const widthRatio = this.getJustBarsWidthRatio();
        const centerX = (index - 63.5) * this.currentValues.justbarsdistance;
        const halfWidth = (widthRatio * this.currentValues.justbarsdistance) / 2;

        let p = -height;
        let q = height;
        const shape = this.currentValues.justbarsshape;
        const isUp = shape === 'shapeC' || (shape === 'shapeA' && index < SAMPLE_SIZE_HALF) || (shape === 'shapeB' && index >= SAMPLE_SIZE_HALF);
        const isDown = shape === 'shapeD' || (shape === 'shapeB' && index < SAMPLE_SIZE_HALF) || (shape === 'shapeA' && index >= SAMPLE_SIZE_HALF);

        if (shape !== 'shapeE') {
            p = isUp ? 0 : -height;
            q = isDown ? 0 : height;
        }

        const localPoints = [
            new THREE.Vector2(centerX - halfWidth, p),
            new THREE.Vector2(centerX + halfWidth, p),
            new THREE.Vector2(centerX + halfWidth, q),
            new THREE.Vector2(centerX - halfWidth, q),
        ];

        if (rotationAngle === 0) {
            return localPoints;
        }

        return localPoints.map((point) => point.clone().rotateAround(new THREE.Vector2(0, 0), rotationAngle));
    }

    buildCirclePoints(index, sample, rotationAngle) {
        const height = this.currentValues.circlelengthinitial / 30 + this.currentValues.circlelengthchangebysound * sample;
        const radius = this.currentValues.circleradius;
        const thetaShift = THREE.MathUtils.degToRad(this.currentValues.circlethetashift);
        const thetaStep = (2 * Math.PI) / this.sampleSize;
        const thetaCenter = Math.PI / 2 + thetaShift + rotationAngle + thetaStep * (index + 0.5);
        const thetaHalfWidth = (thetaStep * this.getCircleWidthRatio()) / 2;
        const theta0 = thetaCenter - thetaHalfWidth;
        const theta1 = thetaCenter + thetaHalfWidth;
        const innerRadius = this.currentValues.circleshape === 'two-sided'
            ? Math.max(0, radius - height)
            : radius;
        const outerRadius = radius + height;

        return [
            new THREE.Vector2(Math.cos(theta0) * innerRadius, Math.sin(theta0) * innerRadius),
            new THREE.Vector2(Math.cos(theta1) * innerRadius, Math.sin(theta1) * innerRadius),
            new THREE.Vector2(Math.cos(theta1) * outerRadius, Math.sin(theta1) * outerRadius),
            new THREE.Vector2(Math.cos(theta0) * outerRadius, Math.sin(theta0) * outerRadius),
        ];
    }

    buildSlabQuad(index, shape, height, thickness, rotationAngle) {
        const widthRatio = this.getSlabWidthRatio();
        const centerX = (index - 63.5) * this.currentValues.slabdistance;
        const halfWidth = (widthRatio * this.currentValues.slabdistance) / 2;
        const localPoints = [
            new THREE.Vector2(centerX - halfWidth, shape === 'up' ? height - thickness : -height),
            new THREE.Vector2(centerX + halfWidth, shape === 'up' ? height - thickness : -height),
            new THREE.Vector2(centerX + halfWidth, shape === 'up' ? height : -height + thickness),
            new THREE.Vector2(centerX - halfWidth, shape === 'up' ? height : -height + thickness),
        ];

        if (rotationAngle === 0) {
            return localPoints;
        }

        return localPoints.map((point) => point.clone().rotateAround(new THREE.Vector2(0, 0), rotationAngle));
    }

    buildSlabGeometry(index, sample, rotationAngle) {
        const height = this.currentValues.slabheightinitial / 30 + this.currentValues.slabheightchangebysound * sample;
        const thickness = Math.max(0, Math.min(height, this.currentValues.slabthickness));
        const shape = this.currentValues.slabshape;
        const isUp = shape === 'shapeC' || (shape === 'shapeA' && index < SAMPLE_SIZE_HALF) || (shape === 'shapeB' && index >= SAMPLE_SIZE_HALF);
        const isDown = shape === 'shapeD' || (shape === 'shapeB' && index < SAMPLE_SIZE_HALF) || (shape === 'shapeA' && index >= SAMPLE_SIZE_HALF);

        if (shape === 'shapeE') {
            return {
                primary: this.buildSlabQuad(index, 'up', height, thickness, rotationAngle),
                secondary: this.buildSlabQuad(index, 'down', height, thickness, rotationAngle),
            };
        }

        return {
            primary: this.buildSlabQuad(index, isUp ? 'up' : 'down', height, thickness, rotationAngle),
        };
    }

    buildCircleSlabSegment(theta0, theta1, innerRadius, thickness) {
        const outerRadius = innerRadius + thickness;
        return [
            new THREE.Vector2(Math.cos(theta0) * innerRadius, Math.sin(theta0) * innerRadius),
            new THREE.Vector2(Math.cos(theta1) * innerRadius, Math.sin(theta1) * innerRadius),
            new THREE.Vector2(Math.cos(theta1) * outerRadius, Math.sin(theta1) * outerRadius),
            new THREE.Vector2(Math.cos(theta0) * outerRadius, Math.sin(theta0) * outerRadius),
        ];
    }

    buildCircleSlabGeometry(index, sample, rotationAngle) {
        const height = this.currentValues.circleslabheightchangebysound * sample;
        const radius = this.currentValues.circleslabradius;
        const thickness = Math.max(0, Math.min(height, this.currentValues.circleslabthickness));
        const thetaShift = THREE.MathUtils.degToRad(this.currentValues.circleslabthetashift);
        const thetaStep = (2 * Math.PI) / this.sampleSize;
        const thetaCenter = Math.PI / 2 + thetaShift + rotationAngle + thetaStep * (index + 0.5);
        const thetaHalfWidth = (thetaStep * this.getCircleSlabWidthRatio()) / 2;
        const theta0 = thetaCenter - thetaHalfWidth;
        const theta1 = thetaCenter + thetaHalfWidth;

        const outwardInner = Math.max(0, radius + height - thickness);
        if (this.currentValues.circleslabshape === 'single-sided') {
            return {
                primary: this.buildCircleSlabSegment(theta0, theta1, outwardInner, thickness),
            };
        }

        const inwardInner = Math.max(0, radius - height);
        return {
            primary: this.buildCircleSlabSegment(theta0, theta1, outwardInner, thickness),
            secondary: this.buildCircleSlabSegment(theta0, theta1, inwardInner, thickness),
        };
    }

    buildGeometryPoints(index, sample, frame, geometryType) {
        const rotationAngle = this.getGeometryRotation(frame);
        if (geometryType === CIRCLE_TYPE) {
            return { primary: this.buildCirclePoints(index, sample, rotationAngle) };
        }
        if (geometryType === SLAB_TYPE) {
            return this.buildSlabGeometry(index, sample, rotationAngle);
        }
        if (geometryType === CIRCLE_SLAB_TYPE) {
            return this.buildCircleSlabGeometry(index, sample, rotationAngle);
        }
        return { primary: this.buildJustBarsPoints(index, sample, rotationAngle) };
    }

    render(frame, incomingAudioSamples) {
        this.scene.rotation.z = 0;

        const allZero = incomingAudioSamples.every((value) => value === 0);
        let audioSamples = incomingAudioSamples;
        this.energyBands = this.computeEnergyBands(incomingAudioSamples);
        this.selectedEnergy = this.computeSelectedEnergy(this.energyBands);

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

        this.barsGroup.scale.setScalar(this.getGeometryScale());
        const geometryState = this.updateGeometryCycle(frame);

        for (let index = 0; index < this.sampleSize; index += 1) {
            const mirroredIndex = this.getMirroredIndex(index);
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

            const fromGeometry = this.buildGeometryPoints(index, sample, frame, geometryState.fromType);
            const geometry = geometryState.mix > 0
                ? this.mixGeometrySet(
                    fromGeometry,
                    this.buildGeometryPoints(index, sample, frame, geometryState.toType),
                    geometryState.mix,
                )
                : fromGeometry;
            this.setBarGeometry(bar, geometry.primary, geometry.secondary);
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
