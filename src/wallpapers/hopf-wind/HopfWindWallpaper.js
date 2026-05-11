import { BufferGeometry, Color, HemisphereLight, Line, LineBasicMaterial, Path } from 'three';
import { createThreeCanvasApp } from '../../shared/three/createThreeCanvasApp.js';

function resolveBackgroundImage(image) {
    if (!image) {
        return '';
    }

    if (/^(blob:|data:|https?:|file:)/i.test(image)) {
        return image;
    }

    const normalized = String(image).replace(/\\/g, '/').replace(/^\/+/, '');
    return `file:///${normalized}`;
}

export class HopfWindWallpaper {
    constructor({ host, audioBinCount }) {
        this.host = host;
        this.sampleSize = audioBinCount;
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
        this.currentValues = {};
        this.currentColor = new Color(1, 1, 1);

        this.magfy = 8;
        this.rot_is = 1;
        this.rot_sg = 1;
        this.opa_def = Math.pow(0.6, 2);
        this.opa_gbs = 1.7;
        this.opa_sc = 1;
        this.hopf_lat = 0.55;
        this.hopf_lc = 1.57;
        this.sm_dec = 7;
        this.sm_fac = 1.5;
        this.sm_cap = 1;
        this.magall = 0;
        this.magdec = 10;
        this.magloud = 0;
        this.useFour = false;
        this.capouterlight = false;
        this.atancap = 4;
        this.toriparty = false;
        this.sphere_rot = 0;
        this.cliff90 = false;
        this.cliffauto = true;
        this.objectAngle = 0;
        this.lq_angle = 0;
        this.circres = 150;
        this.rotation4dSpeed = 0;
        this.rotation3dSpeed = 0;
        this.overallMagnitude = 9;
        this.generateFibers();

        const light = new HemisphereLight(0xffffbb, 0x080820, 1);
        this.scene.add(light);
    }

    updateBackground() {
        this.host.stage.style.backgroundImage = this.currentValues.customimage && this.currentValues.customimagepath
            ? `url("${resolveBackgroundImage(this.currentValues.customimagepath)}")`
            : '';
        this.host.stage.style.backgroundColor = '#000000';
    }

    generateFibers() {
        this.objectPool.forEach((fiber) => {
            fiber.geometry.dispose();
            fiber.material.dispose();
            this.scene.remove(fiber);
        });
        this.objectPool = [];

        for (let index = 0; index < this.sampleSize; index += 1) {
            const geometry = new BufferGeometry().setFromPoints(this.arbitraryPath());
            const material = new LineBasicMaterial({
                color: this.currentColor,
                transparent: true,
                opacity: 1,
                depthWrite: false,
            });
            const fiber = new Line(geometry, material);
            this.scene.add(fiber);
            this.objectPool.push(fiber);
        }
    }

    updateViewport() {
        this.canvas.resize({
            pixelated: this.currentValues.pixelated,
            canvasScale: this.currentValues.canvasportion,
            offsetX: this.currentValues.offsetx,
            offsetY: this.currentValues.offsety,
            viewAngle: this.currentValues.view / 180 * Math.PI,
            showHalf: !this.currentValues.showonlyhalf,
            fov: 30,
            viewZ: 60,
        });
    }

    applyProperties(nextValues) {
        const previousValues = this.currentValues;
        const shouldRefreshAll = Object.keys(previousValues).length === 0;
        const hasChanged = (...keys) => shouldRefreshAll || keys.some((key) => previousValues[key] !== nextValues[key]);

        this.currentValues = { ...nextValues };
        this.overallMagnitude = nextValues.overallmagnitude;
        this.magfy = nextValues.magfy;
        this.rot_is = nextValues.rot_is;
        this.rot_sg = nextValues.rot_sg;
        this.opa_sc = nextValues.opa_sc;
        this.opa_def = Math.pow(nextValues.opacitydefault, 2);
        this.opa_gbs = nextValues.opa_gbs;
        this.hopf_lat = nextValues.hopf_lat / 180 * Math.PI;
        this.hopf_lc = nextValues.hopflatitudecap / 180 * Math.PI;
        this.sm_fac = nextValues.sm_fac;
        this.sm_dec = nextValues.sm_dec * 10;
        this.sm_cap = nextValues.soundmagnitudecap;
        this.magloud = nextValues.magloud;
        this.capouterlight = nextValues.capouterlight;
        this.useFour = nextValues.usefour;
        this.atancap = nextValues.atancap + 3;
        this.cliff90 = nextValues.cliffordrotation45;
        this.rotation4dSpeed = nextValues._4drotationspeed;
        this.rotation3dSpeed = nextValues._3drotationspeed;
        this.toriparty = nextValues.toricgotoparty;
        this.cliffauto = nextValues.cliffordrotationauto;

        if (hasChanged('toruscolor')) {
            const [r = 1, g = 1, b = 1] = String(nextValues.toruscolor).split(/\s+/).map((value) => Number(value) || 0);
            this.currentColor = new Color(r, g, b);
            if (!this.toriparty) {
                this.objectPool.forEach((fiber) => {
                    fiber.material.color = this.currentColor;
                });
            }
        }

        if (hasChanged('fiberresolution')) {
            this.circres = Math.max(16, Math.round(nextValues.fiberresolution));
            this.generateFibers();
        }

        if (hasChanged('customimage', 'customimagepath')) {
            this.updateBackground();
        }

        if (hasChanged('offsetx', 'offsety', 'pixelated', 'canvasportion', 'showonlyhalf', 'view')) {
            this.updateViewport();
        }
    }

    resize() {
        this.updateViewport();
    }

    render(frame, incomingAudioSamples) {
        const audioSamples = incomingAudioSamples.map((value) => value * this.overallMagnitude);
        const sum = audioSamples.reduce((accumulator, value) => accumulator + value, 0) / this.sampleSize;
        const magallNew = (sum * this.magloud) / 2;
        const time = frame / 2;

        this.lq_angle += 0.0012 * this.rot_is + (sum / 6) * this.rot_sg;
        this.magall = magallNew >= this.magall
            ? magallNew
            : (this.magall * this.magdec) / (this.magdec + 1);

        if (this.rotation3dSpeed > 0) {
            this.objectAngle += this.rotation3dSpeed;
        } else {
            this.objectAngle = 0;
        }

        const oc = Math.cos(this.objectAngle);
        const os = Math.sin(this.objectAngle);
        const qc = Math.cos(this.objectAngle / 0.77);
        const qs = Math.sin(this.objectAngle / 0.77);

        if (this.cliff90) {
            this.sphere_rot = Math.PI / 2;
        } else if (this.cliffauto) {
            this.sphere_rot += Math.max(this.rotation4dSpeed, 0.002);
        } else if (this.rotation4dSpeed > 0) {
            this.sphere_rot += this.rotation4dSpeed;
        } else {
            this.sphere_rot = 0;
        }

        const sc = Math.cos(this.sphere_rot);
        const ss = Math.sin(this.sphere_rot);

        for (let index = 0; index < this.sampleSize; index += 1) {
            const localIndex = index % (this.sampleSize / 2);
            const position = this.objectPool[index].geometry.attributes.position;
            const material = this.objectPool[index].material;

            const opacityNew = (this.opa_def + this.opa_gbs * audioSamples[index]) * this.opa_sc;
            material.opacity = opacityNew >= material.opacity
                ? opacityNew
                : (material.opacity * this.sm_dec + opacityNew) / (this.sm_dec + 1);

            if (this.capouterlight && index < this.sampleSize / 2) {
                material.opacity /= 2;
            }

            if (this.toriparty) {
                const hue = (audioSamples[index] * 120 + Math.max(time, this.lq_angle * 18)) % 270 + 120;
                material.color = new Color(`hsl(${hue}, 100%, 50%)`);
            }

            let lp = -(this.hopf_lat + Math.min(audioSamples[index], this.sm_cap) * this.sm_fac + this.magall);
            let lq;

            if (index < this.sampleSize / 2) {
                lp = Math.max(-this.hopf_lc, lp);
            } else {
                lp = Math.min(1.57, lp);
            }

            if (!this.useFour) {
                lq = (localIndex / (this.sampleSize / 2)) * (2 * Math.PI) + this.lq_angle;
            } else {
                lq = (localIndex / 40) * (2 * Math.PI) + this.lq_angle;
                if (index >= this.sampleSize / 4 && index < (this.sampleSize * 3) / 4) {
                    lq *= -1;
                    lp /= 3;
                }
            }

            const pointXTmp = Math.cos(lp) * Math.cos(lq);
            const pointZ = Math.cos(lp) * Math.sin(lq);
            const pointYTmp = Math.sin(lp);
            let pointX = pointXTmp * sc - pointYTmp * ss;
            let pointY = pointYTmp * sc + pointXTmp * ss;
            let mirroredPointZ = pointZ;

            if (index >= this.sampleSize / 2) {
                pointX *= -1;
                pointY *= -1;
                mirroredPointZ *= -1;
            }

            const alpha = Math.sqrt((1 - pointY) / 2);
            const beta = Math.sqrt((1 + pointY) / 2);
            const angleSum = Math.atan2(pointX, -mirroredPointZ);

            if (this.atancap === 3) {
                for (let pointIndex = 0; pointIndex <= this.circres; pointIndex += 1) {
                    const theta = 2 * Math.PI * this.regulate(pointIndex / this.circres);
                    const phi = angleSum - theta;
                    const projection = 0.5 / (1 - alpha * Math.sin(theta)) * this.magfy;

                    const finalX = -beta * projection * Math.cos(phi);
                    const tmpFinalY = alpha * projection * Math.cos(theta);
                    const tmpFinalZ = -beta * projection * Math.sin(phi);
                    const finalY = tmpFinalY * oc - tmpFinalZ * os;
                    const finalZ = tmpFinalY * os + tmpFinalZ * oc;

                    position.setX(pointIndex, finalX);
                    position.setY(pointIndex, finalY);
                    position.setZ(pointIndex, finalZ);
                }
            } else {
                for (let pointIndex = 0; pointIndex <= this.circres; pointIndex += 1) {
                    const theta = 2 * Math.PI * this.regulate(pointIndex / this.circres);
                    const phi = angleSum - theta;
                    const projection = 0.5 / (1 - alpha * Math.sin(theta)) * this.magfy;

                    const tmpFinalX = -beta * projection * Math.cos(phi);
                    const tmpFinalY = alpha * projection * Math.cos(theta);
                    const tmpFinalZ = -beta * projection * Math.sin(phi);
                    const finalX = tmpFinalX * qc - tmpFinalY * os * qs - tmpFinalZ * oc * qs;
                    const finalY = tmpFinalY * oc - tmpFinalZ * os;
                    const finalZ = tmpFinalX * qs + tmpFinalY * os * qc + tmpFinalZ * oc * qc;

                    const radius = Math.hypot(finalX, finalY, finalZ);
                    const boundedRadius = this.atancap * Math.atan(radius / this.atancap) * this.magfy / 4;

                    position.setX(pointIndex, finalX * boundedRadius / radius);
                    position.setY(pointIndex, finalY * boundedRadius / radius);
                    position.setZ(pointIndex, finalZ * boundedRadius / radius);
                }
            }

            position.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }

    arbitraryPath() {
        const path = new Path();
        path.moveTo(0, 0, 0);
        for (let index = 1; index <= this.circres; index += 1) {
            path.lineTo((index % 2) / 100, 0, 0);
        }
        return path.getPoints();
    }

    regulate(value) {
        const proportion = 0.67;
        return value < proportion
            ? (value / proportion) * 0.5
            : ((value / (1 - proportion)) - 1 / (1 - proportion)) * 0.5 + 1;
    }

    destroy() {
        this.objectPool.forEach((fiber) => {
            fiber.geometry.dispose();
            fiber.material.dispose();
            this.scene.remove(fiber);
        });
        this.canvas.dispose();
    }
}
