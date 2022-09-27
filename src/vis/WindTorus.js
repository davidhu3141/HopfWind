import * as THREE from 'three'
import { Pass, FullScreenQuad } from '../class/Pass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

import { Visualizer } from '../class/Visualizer.js'

export { WindTorus }

class WindTorus extends Visualizer {

    sampleSize
    object_pool = []

    current_color = new THREE.Color(0.9, 0.9, 0.9)
    lq_angle = 0
    composer = null

    cirRes = 17

    constructor(sampleSize) {

        super()
        this.sampleSize = sampleSize

        for (var j = 0; j < sampleSize; j++) {
            var fiberGeo = new THREE.BufferGeometry().setFromPoints(this.arbitraryPath());
            var fiberMaterial = new THREE.LineBasicMaterial({ color: this.current_color, transparent: true, opacity: 1, depthWrite: false });
            var newFiber = new THREE.Line(fiberGeo, fiberMaterial);
            this.scene.add(newFiber);
            this.object_pool.push(newFiber);
        }

        var light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1)
        this.scene.add(light)

        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        const params = {};
        const myPass = new MyPass(window.innerWidth, window.innerHeight, params);

        this.composer.addPass(renderPass);
        this.composer.addPass(myPass);
    }

    applySettingForWPE(properties) {

    }

    windowResized(innerWidth, innerHeight) {
        super.windowResized(innerWidth, innerHeight)
        this.composer.setSize(innerWidth / (this.pixsz * this.canvasPortion), innerHeight / (this.pixsz * this.canvasPortion))
    }

    lastR = 0

    render(time, audioSamples) {

        const n128 = this.sampleSize
        const n64 = this.sampleSize / 2

        const sum = audioSamples.reduce((a, b) => a + b) / this.sampleSize
        const magall = sum

        const object_pool = this.object_pool

        // const t = time / 2

        for (var j = 0; j < n128; j++) {

            var position_l = object_pool[j].geometry.attributes.position
            var material_l = object_pool[j].material
            var opa_new = audioSamples[j] * 3
            material_l.opacity = opa_new

            const phi = 2 * Math.PI * (j + 0.5) / n128 + Math.random() * magall * 0.6 + 1
            for (var k = 0; k <= this.cirRes; k++) {
                const theta = 2 * Math.PI * (k / this.cirRes - 0.5)
                const R = Math.max(3 + magall * 129, this.lastR * 0.999)//- 0.000002)
                // const R = Math.max(6 + magall * 10, this.lastR * 0.999)//- 0.000002)
                this.lastR = R
                const r = (0.5 + audioSamples[j])
                position_l.setX(k, (R + r * Math.cos(theta)) * Math.cos(phi))
                position_l.setZ(k, (R + r * Math.cos(theta)) * Math.sin(phi))
                position_l.setY(k, r * Math.sin(theta) - 3 - R / 2)
                // position_l.setX(k, (R * Math.cos(phi) + r * Math.cos(theta)))
                // position_l.setZ(k, (R * Math.sin(phi) + r * Math.sin(theta)))
                // position_l.setY(k, -8 - R / 3)
            }

            position_l.needsUpdate = true
            material_l.needsUpdate = true
        }

        this.composer.render(this.scene, this.camera)
    }

    arbitraryPath() {
        var path = new THREE.Path()
        path.moveTo(0, 0, 0)
        for (var i = 1; i <= this.cirRes; i++)
            path.lineTo((i % 2) / 100, 0, 0)
        return path.getPoints()
    }

}


class MyPass extends Pass {

    constructor(width, height, params) {

        super();

        this.remember = new THREE.WebGLRenderTarget(innerWidth, innerHeight);
        this.remember2 = new THREE.WebGLRenderTarget(innerWidth, innerHeight);
        this.count = 0

        const MyPassShader = {

            uniforms: {
                'tDiffuse': { value: null },
                'tDiffuse2': { value: null },
                'width': { value: 1 },
                'height': { value: 1 }
            },

            vertexShader: /* glsl */`

                varying vec2 vUV;

                void main() {

                    vUV = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

                }`,

            fragmentShader: /* glsl */`

                varying vec2 vUV;
                uniform sampler2D tDiffuse;
                uniform sampler2D tDiffuse2;

                void main() {

                    vec2 vUV2 = vUV;
                    vUV2[1] -= 0.0025;
                    if(vUV[1] < 0.01) {
                        gl_FragColor = texture2D( tDiffuse, vUV )*0.0;
                        return;
                    }

                    gl_FragColor = max(texture2D( tDiffuse, vUV ) , texture2D( tDiffuse2, vUV2 )*0.98);
                    //gl_FragColor = texture2D( tDiffuse2, vUV2 )*0.95;
                }`

        };

        this.uniforms = THREE.UniformsUtils.clone(MyPassShader.uniforms);
        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: MyPassShader.fragmentShader,
            vertexShader: MyPassShader.vertexShader
        });

        // set params
        this.uniforms.width.value = width;
        this.uniforms.height.value = height;

        for (const key in params) {

            if (params.hasOwnProperty(key) && this.uniforms.hasOwnProperty(key)) {

                this.uniforms[key].value = params[key];

            }

        }

        this.fsQuad = new FullScreenQuad(this.material);

    }

    render(renderer, writeBuffer, readBuffer/*, deltaTime, maskActive*/) {

        this.count++

        this.material.uniforms['tDiffuse'].value = readBuffer.texture;

        if (this.count % 2 == 0) {
            this.material.uniforms['tDiffuse2'].value = this.remember.texture || readBuffer.texture;
            renderer.setRenderTarget(this.remember2);
            this.fsQuad.render(renderer);
        } else {
            this.material.uniforms['tDiffuse2'].value = this.remember2.texture || readBuffer.texture;
            renderer.setRenderTarget(this.remember);
            this.fsQuad.render(renderer);
        }

        if (this.renderToScreen) {

            renderer.setRenderTarget(null);
            this.fsQuad.render(renderer);

        } else {

            renderer.setRenderTarget(writeBuffer);
            if (this.clear) renderer.clear();
            this.fsQuad.render(renderer);
        }

    }

    setSize(width, height) {

        this.uniforms.width.value = width;
        this.uniforms.height.value = height;

    }

}