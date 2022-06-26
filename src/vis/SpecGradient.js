
import * as THREE from 'three'
import { Pass, FullScreenQuad } from '../class/Pass.js';
import { EffectComposer } from '../jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../jsm/postprocessing/RenderPass.js';

import { Visualizer } from '../class/Visualizer.js'

export { SpecGradient }

class SpecGradient extends Visualizer {

    composer
    band = null;

    constructor() {

        super()

        this.settings = {}
        this.settingKeys = {}

        let mat = new THREE.MeshBasicMaterial()
        mat.vertexColors = true
        let geo = new THREE.PlaneBufferGeometry(20, 0.2, 128, 1)
        let color = new Float32Array(new Array(129 * 2 * 3).fill(0.05))
        geo.setAttribute('color', new THREE.BufferAttribute(color, 3))
        this.band = new THREE.Mesh(geo, mat)
        console.log(this.band)

        this.scene.add(this.band)

        var light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1)
        this.scene.add(light)

        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        const params = {};
        const myPass = new MyPass(window.innerWidth, window.innerHeight, params);
        // const myPass2 = new MyPass2(window.innerWidth, window.innerHeight, params, myPass);
        this.composer.addPass(renderPass);
        this.composer.addPass(myPass);
        // composer.addPass(myPass2);
    }

    applySettingForWPE(properties) {

    }

    windowResized(innerWidth, innerHeight) {
        super.windowResized(innerWidth, innerHeight)
        this.composer.setSize(innerWidth / (this.pixsz * this.canvasPortion), innerHeight / (this.pixsz * this.canvasPortion))
    }

    render(time, audioSamples) {

        var geometry = this.band.geometry;

        for (var u = 0; u < 128; u++) {
            var color = new THREE.Color(`hsl(${(audioSamples[u] * 600 + 180) % 360}, 100%, 50%)`);
            var i = u > 64 ? 192 - u : u
            var bat = 3

            geometry.attributes.color.array[i * bat] =
                geometry.attributes.color.array[129 * 3 + i * bat] = color.r

            geometry.attributes.color.array[i * bat + 1] =
                geometry.attributes.color.array[129 * 3 + i * bat + 1] = color.g

            geometry.attributes.color.array[i * bat + 2] =
                geometry.attributes.color.array[129 * 3 + i * bat + 2] = color.b

        }
        geometry.attributes.color.needsUpdate = true;
        this.composer.render(this.scene, this.camera)
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
                    vUV2[1] -= 0.002;
                    if(vUV[1] < 0.5) {
                        gl_FragColor = texture2D( tDiffuse, vUV );
                        return;
                    }
                    gl_FragColor = max(texture2D( tDiffuse, vUV ) , texture2D( tDiffuse2, vUV2 ));

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