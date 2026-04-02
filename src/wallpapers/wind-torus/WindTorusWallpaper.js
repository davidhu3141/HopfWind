import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { createThreeCanvasApp } from '../../shared/three/createThreeCanvasApp.js';
import { WindTrailPass } from '../../shared/three/WindTrailPass.js';

export class WindTorusWallpaper {
    constructor({ host, audioBinCount }) {
        this.host = host;
        this.sampleSize = audioBinCount;
        this.currentValues = {};
        this.currentColor = new THREE.Color(0.9, 0.9, 0.9);
        this.cirRes = 17;
        this.lastR = 0;
        this.majorRadiusBase = 7;
        this.minorRadiusBase = 0.1;

        this.canvas = createThreeCanvasApp(host, {
            cameraType: 'perspective',
            viewZ: 60,
            showHalf: false,
            fov: 30,
        });
        this.scene = this.canvas.scene;
        this.camera = this.canvas.camera;
        this.renderer = this.canvas.renderer;

        this.objectPool = [];
        for (let index = 0; index < this.sampleSize; index += 1) {
            const geometry = new THREE.BufferGeometry().setFromPoints(this.arbitraryPath());
            const material = new THREE.LineBasicMaterial({
                color: this.currentColor,
                transparent: true,
                opacity: 1,
                depthWrite: false,
            });
            const fiber = new THREE.Line(geometry, material);
            this.scene.add(fiber);
            this.objectPool.push(fiber);
        }

        const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
        this.scene.add(light);

        this.composer = new EffectComposer(this.renderer);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.trailPass = new WindTrailPass(1, 1);
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
        this.overallMagnitude = nextValues.overallmagnitude;
        this.majorRadiusBase = nextValues.majorradius;
        this.minorRadiusBase = nextValues.minorradius;
        this.updateViewport();
    }

    resize() {
        this.updateViewport();
    }

    render(frame, incomingAudioSamples) {
        const audioSamples = incomingAudioSamples.map((value) => value * this.overallMagnitude);
        const sum = audioSamples.reduce((accumulator, value) => accumulator + value, 0) / this.sampleSize;
        const magall = sum * 0.3;

        for (let index = 0; index < this.sampleSize; index += 1) {
            const positions = this.objectPool[index].geometry.attributes.position;
            const material = this.objectPool[index].material;
            const opacity = audioSamples[index] * 100 + 0.05;
            material.opacity = opacity;

            const phi = 2 * Math.PI * (index + 0.5) / this.sampleSize + frame * 0.0015;
            for (let pointIndex = 0; pointIndex <= this.cirRes; pointIndex += 1) {
                const theta = 2 * Math.PI * (pointIndex / this.cirRes - 0.5);
                const majorRadius = Math.max(this.majorRadiusBase + magall * 129, this.lastR * 0.9999);
                this.lastR = majorRadius;
                const minorRadius = this.minorRadiusBase + audioSamples[index] * 5;
                positions.setX(pointIndex, (majorRadius + minorRadius * Math.cos(theta)) * Math.cos(phi));
                positions.setZ(pointIndex, (majorRadius + minorRadius * Math.cos(theta)) * Math.sin(phi));
                positions.setY(pointIndex, minorRadius * Math.sin(theta) - 3 - majorRadius / 2);
            }

            positions.needsUpdate = true;
            material.needsUpdate = true;
            this.objectPool[index].geometry.computeBoundingBox();
            this.objectPool[index].geometry.computeBoundingSphere();
        }

        this.composer.render();
    }

    arbitraryPath() {
        const path = new THREE.Path();
        path.moveTo(0, 0, 0);
        for (let index = 1; index <= this.cirRes; index += 1) {
            path.lineTo((index % 2) / 100, 0, 0);
        }
        return path.getPoints();
    }

    destroy() {
        this.trailPass.dispose();
        this.composer.dispose();
        this.objectPool.forEach((fiber) => {
            fiber.geometry.dispose();
            fiber.material.dispose();
            this.scene.remove(fiber);
        });
        this.canvas.dispose();
    }
}
