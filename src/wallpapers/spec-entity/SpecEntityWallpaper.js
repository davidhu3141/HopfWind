import { Color, DoubleSide, HemisphereLight, LinearFilter, Mesh, MeshBasicMaterial, NearestFilter, PlaneGeometry } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { applyBackground } from '../../shared/features/background.js';
import { createClockOverlay } from '../../shared/features/clockOverlay.js';
import { FlowFeedbackPass } from '../../shared/three/FlowFeedbackPass.js';
import { createThreeCanvasApp } from '../../shared/three/createThreeCanvasApp.js';
import { rgbTripletToCss } from '../../shared/utils/color.js';
import { rasterizeTextToTransposedMatrix } from '../../shared/utils/rasterizeText.js';

const IDLE_COUNTDOWN_FRAMES = 600;

function makeHslColor(hue, saturation, lightness) {
    const wrapped = hue >= 0 ? hue : hue + 360;
    return `hsl(${wrapped}, ${saturation}%, ${lightness}%)`;
}

export class SpecEntityWallpaper {
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
        this.flowPass = new FlowFeedbackPass(1, 1);
        this.composer.addPass(this.renderPass);
        this.composer.addPass(this.flowPass);

        this.currentValues = {};
        this.idleCountdown = IDLE_COUNTDOWN_FRAMES;
        this.textArray = rasterizeTextToTransposedMatrix(' ');
        this.currentColor = new Color(1, 1, 1);
        this.bars = [];
        this.light = new HemisphereLight(0xffffff, 0x080808, 1);
        this.scene.add(this.light);

        for (let index = 0; index < this.sampleSize; index += 1) {
            const geometry = new PlaneGeometry(0.4, 0.03, 1, 1);
            const material = new MeshBasicMaterial({ transparent: true, side: DoubleSide });
            const mesh = new Mesh(geometry, material);
            mesh.matrixAutoUpdate = false;
            mesh.matrix.setPosition((40 * index) / this.sampleSize - 20, 0, 0);
            this.scene.add(mesh);
            this.bars.push(mesh);
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

    updateBarGeometry() {
        this.bars.forEach((bar, index) => {
            const previousHeight = bar.geometry.parameters.height;
            bar.geometry.dispose();
            bar.geometry = new PlaneGeometry(this.currentValues.barwidth, previousHeight, 1, 1);
            bar.matrix.setPosition(this.currentValues.bardistance * (index - this.sampleSize / 2), 0, 0);
        });
    }

    updateSceneTransform() {
        this.scene.position.x = this.currentValues._2doffsetx * 20;
        this.scene.position.y = this.currentValues._2doffsety * 20 * 0.73;
        this.scene.rotation.z = -(this.currentValues._2drotation / 180) * Math.PI;
        this.scene.rotation.y = (this.currentValues._3drotation / 180) * Math.PI;
    }

    updateFlowSettings() {
        this.flowPass.setFilter(this.currentValues.antialiasingwillcauseblur ? LinearFilter : NearestFilter);
        this.flowPass.setApplyFadingPerNFrames(this.currentValues.applyfadingpernframes);
        this.flowPass.setFadeAmount(this.currentValues.fade / 255);
        this.flowPass.setMoveDir((this.currentValues.flowdirection / 180) * Math.PI + Math.PI / 2);
        this.flowPass.setMoveVelocity(this.currentValues.flowvelocity / 5);
        this.flowPass.setFlowOpacityLimit(this.currentValues.flowopacitylimit);
        this.flowPass.setShadeFront(this.currentValues.flowbeforebars);
        this.flowPass.setWaterfall(this.currentValues.usewaterfallsettings);
        this.flowPass.setWaterfallGravity(this.currentValues.waterfallgravity);
        this.flowPass.setNonBlueShift(this.currentValues.bluepxxshiftfactor);
        this.flowPass.setWhitePxDrop(this.currentValues.whitepixelsdropspeedfactor);
    }

    updateCanvas() {
        const metrics = this.canvas.resize({
            pixelated: this.currentValues.pixelated,
            canvasScale: this.currentValues.canvasshrink + 1,
            offsetX: this.currentValues.offsetx,
            offsetY: this.currentValues.offsety,
            viewAngle: (this.currentValues._3drotationy / 180) * Math.PI,
        });
        this.composer.setSize(metrics.renderWidth, metrics.renderHeight);
        this.flowPass.setSize(metrics.renderWidth, metrics.renderHeight);
    }

    applyProperties(nextValues) {
        const previousValues = this.currentValues;
        const shouldRefreshAll = Object.keys(previousValues).length === 0;
        const hasChanged = (...keys) => shouldRefreshAll || keys.some((key) => previousValues[key] !== nextValues[key]);

        this.currentValues = { ...nextValues };
        if (hasChanged('barcolor')) {
            this.currentColor = new Color(rgbTripletToCss(this.currentValues.barcolor));
        }

        if (hasChanged('barcolor', 'usesinglecolor') && this.currentValues.usesinglecolor) {
            this.bars.forEach((bar) => {
                bar.material.color = this.currentColor;
            });
        }

        if (hasChanged('text')) {
            this.textArray = rasterizeTextToTransposedMatrix(`${this.currentValues.text || ' '} `);
        }
        if (hasChanged('backgroundcolor', 'usecustomimage', 'customimage')) {
            this.updateBackground();
        }
        if (hasChanged('barwidth', 'bardistance')) {
            this.updateBarGeometry();
        }
        if (hasChanged('_2doffsetx', '_2doffsety', '_2drotation', '_3drotation')) {
            this.updateSceneTransform();
        }
        if (
            hasChanged(
                'antialiasingwillcauseblur',
                'applyfadingpernframes',
                'fade',
                'flowdirection',
                'flowvelocity',
                'flowopacitylimit',
                'flowbeforebars',
                'usewaterfallsettings',
                'waterfallgravity',
                'bluepxxshiftfactor',
                'whitepixelsdropspeedfactor',
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
        if (hasChanged('pixelated', 'canvasshrink', 'offsetx', 'offsety', '_3drotationy')) {
            this.updateCanvas();
        }
        this.idleCountdown = IDLE_COUNTDOWN_FRAMES;
    }

    resize() {
        this.updateCanvas();
    }

    colorForBar(value, frame) {
        const hueInitial = this.currentValues.hueinitial > 0
            ? this.currentValues.hueinitial
            : frame * this.currentValues.hueinitial * -0.3;
        const hue = (hueInitial + value * 9000 * this.currentValues.huechangebysound) % 360;
        return makeHslColor(hue, this.currentValues.saturation, this.currentValues.lightness);
    }

    render(frame, incomingAudioSamples) {
        const allZero = incomingAudioSamples.every((value) => value === 0);
        let audioSamples = incomingAudioSamples;
        const useText = this.currentValues.showtext && allZero;

        if (useText) {
            audioSamples = audioSamples.map((_, index) => {
                const canvasHeight = this.textArray[0]?.length ?? 0;
                const shift = Math.max(0, Math.floor((this.sampleSize - canvasHeight) / 2));
                return index >= shift && index - shift <= canvasHeight - 1
                    ? this.textArray[frame % this.textArray.length][canvasHeight - 1 - (index - shift)] * (this.currentValues.textmagnitude / 24)
                    : 0;
            });
        } else if (allZero && this.currentValues.reduceframerate) {
            if (this.idleCountdown === 0) {
                return;
            }
            this.idleCountdown -= 1;
        } else {
            audioSamples = audioSamples.map((value) => value * this.currentValues.overallmagnitude);
        }

        if (this.currentValues.showtext || !allZero) {
            this.idleCountdown = IDLE_COUNTDOWN_FRAMES;
        }

        const topVertex = this.currentValues.barsflip ? 2 : 0;
        const bottomVertex = this.currentValues.barsflip ? 3 : 1;
        const magnitudeFactor = 40 * (this.currentValues.barsflip ? -1 : 1);

        for (let index = 0; index < this.sampleSize; index += 1) {
            const mirroredIndex = useText
                ? (this.currentValues.textflip ? this.sampleSize - 1 - index : index)
                : index >= this.sampleSize / 2
                    ? (this.sampleSize / 2) * 3 - index - 1
                    : index;
            const sample = audioSamples[mirroredIndex] ?? 0;
            const bar = this.bars[index];
            const material = bar.material;

            if (!this.currentValues.usesinglecolor) {
                material.color = new Color(this.colorForBar(sample, frame));
            }
            material.opacity = this.currentValues.opacityinitial + sample * 100 * this.currentValues.opacitychangebysound;
            material.needsUpdate = true;

            const positions = bar.geometry.attributes.position;
            const nextHeight = (this.currentValues.barslengthinitial / 30 + this.currentValues.barslengthchangebysound * sample) * magnitudeFactor;
            positions.setY(topVertex, nextHeight);
            positions.setY(bottomVertex, nextHeight);
            positions.needsUpdate = true;
        }

        this.composer.render();
    }

    destroy() {
        this.clock.destroy();
        this.composer.dispose();
        this.flowPass.dispose();
        this.bars.forEach((bar) => {
            bar.geometry.dispose();
            bar.material.dispose();
            this.scene.remove(bar);
        });
        this.canvas.dispose();
    }
}
