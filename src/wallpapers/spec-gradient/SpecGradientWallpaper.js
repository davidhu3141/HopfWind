import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GradientTrailPass } from '../../shared/three/GradientTrailPass.js';
import { createThreeCanvasApp } from '../../shared/three/createThreeCanvasApp.js';

export class SpecGradientWallpaper {
    constructor({ host, audioBinCount }) {
        this.host = host;
        this.sampleSize = audioBinCount;
        this.sampleSizePlus = audioBinCount + 1;
        this.currentValues = {};

        this.canvas = createThreeCanvasApp(host, {
            cameraType: 'perspective',
            viewZ: 60,
            showHalf: false,
            fov: 30,
        });
        this.scene = this.canvas.scene;
        this.camera = this.canvas.camera;
        this.renderer = this.canvas.renderer;
        this.tempColor = new THREE.Color();

        const material = new THREE.MeshBasicMaterial({ vertexColors: true });
        const geometry = this.createBandGeometry(20);
        this.band = new THREE.Mesh(geometry, material);
        this.scene.add(this.band);

        const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
        this.scene.add(light);

        this.composer = new EffectComposer(this.renderer);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.trailPass = new GradientTrailPass(1, 1);
        this.composer.addPass(this.renderPass);
        this.composer.addPass(this.trailPass);
    }

    createBandGeometry(width) {
        const geometry = new THREE.PlaneGeometry(width, 30, this.sampleSize, 1);
        const colors = new Float32Array(this.sampleSizePlus * 2 * 3).fill(0.05);
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        return geometry;
    }

    updateBandGeometry() {
        const nextGeometry = this.createBandGeometry(this.currentValues.bandwidth);
        this.band.geometry.dispose();
        this.band.geometry = nextGeometry;
    }

    updateViewport() {
        const metrics = this.canvas.resize({
            pixelated: this.currentValues.pixelated,
            canvasScale: this.currentValues.canvasportion,
            offsetX: this.currentValues.offsetx,
            offsetY: this.currentValues.offsety,
            viewAngle: 0,
            showHalf: false,
            fov: 30,
            viewZ: 60,
        });
        this.composer.setSize(metrics.renderWidth, metrics.renderHeight);
        this.trailPass.setSize(metrics.renderWidth, metrics.renderHeight);
    }

    applyProperties(nextValues) {
        const previousValues = this.currentValues;
        const shouldRefreshAll = Object.keys(previousValues).length === 0;
        const hasChanged = (...keys) => shouldRefreshAll || keys.some((key) => previousValues[key] !== nextValues[key]);

        this.currentValues = { ...nextValues };
        if (hasChanged('bandwidth')) {
            this.updateBandGeometry();
        }
        this.updateViewport();
    }

    resize() {
        this.updateViewport();
    }

    colorForSample(value) {
        const hue = (this.currentValues.basehue + value * this.currentValues.huegainbysound) % 360;
        const wrappedHue = hue >= 0 ? hue : hue + 360;
        this.tempColor.setHSL(
            wrappedHue / 360,
            this.currentValues.saturation / 100,
            this.currentValues.lightness / 100,
        );
        return this.tempColor;
    }

    render(frame, incomingAudioSamples) {
        const geometry = this.band.geometry;
        const colorArray = geometry.attributes.color.array;

        for (let index = 0; index < this.sampleSizePlus; index += 1) {
            const mirroredIndex = index > this.sampleSize / 2
                ? (this.sampleSize / 2) * 3 - index - 1
                : index;
            const sample = incomingAudioSamples[Math.max(0, Math.min(this.sampleSize - 1, mirroredIndex))] ?? 0;
            const color = this.colorForSample(sample);
            const base = index * 3;
            const mirroredBase = this.sampleSizePlus * 3 + base;

            colorArray[base] = colorArray[mirroredBase] = color.r;
            colorArray[base + 1] = colorArray[mirroredBase + 1] = color.g;
            colorArray[base + 2] = colorArray[mirroredBase + 2] = color.b;
        }

        geometry.attributes.color.needsUpdate = true;
        this.composer.render();
    }

    destroy() {
        this.trailPass.dispose();
        this.composer.dispose();
        this.band.geometry.dispose();
        this.band.material.dispose();
        this.scene.remove(this.band);
        this.canvas.dispose();
    }
}
