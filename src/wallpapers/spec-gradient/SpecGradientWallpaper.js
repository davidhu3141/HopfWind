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

        const material = new THREE.MeshBasicMaterial({ vertexColors: true });
        const geometry = new THREE.PlaneGeometry(20, 30, this.sampleSize, 1);
        const colors = new Float32Array(this.sampleSizePlus * 2 * 3).fill(0.05);
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
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
        this.currentValues = { ...nextValues };
        this.updateViewport();
    }

    resize() {
        this.updateViewport();
    }

    colorFunction(value) {
        return `hsl(${Math.trunc(value * 10000 + 240) % 360}, 100%, 50%)`;
    }

    render(frame, incomingAudioSamples) {
        const geometry = this.band.geometry;
        const colorArray = geometry.attributes.color.array;

        for (let index = 0; index < this.sampleSize; index += 1) {
            const mirroredIndex = index > this.sampleSize / 2
                ? (this.sampleSize / 2) * 3 - index - 1
                : index;
            const color = new THREE.Color(this.colorFunction(incomingAudioSamples[mirroredIndex] ?? 0));
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
