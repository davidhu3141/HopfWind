
import * as THREE from 'three'
import { Pass, FullScreenQuad } from '../class/Pass.js';
import { Visualizer } from '../class/Visualizer.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

export { SpecEntity }

class SpecEntity extends Visualizer {

    composer
    sampleSize

    obj_pool = []

    constructor(sampleSize) {

        super()

        this.sampleSize = sampleSize

        for (var i = 0; i < this.sampleSize; i++) {
            let geo = new THREE.PlaneGeometry(0.2, 0.03, 1, 1)
            let mat = new THREE.MeshBasicMaterial()
            let square = new THREE.Mesh(geo, mat)
            mat.transparent = true
            square.matrix.setPosition(40 * i / this.sampleSize - 20, -10, 0)
            square.matrixAutoUpdate = false
            this.scene.add(square)
            this.obj_pool.push(square)
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

    printed = 100

    render(time, audioSamples) {

        for (let u = 0; u < this.sampleSize; u++) {
            // const access = u //  > this.sampleSize / 2 ? this.sampleSize / 2 * 3 - u - 1 : u
            const access = u > this.sampleSize / 2 ? this.sampleSize / 2 * 3 - u - 1 : u

            const mat = this.obj_pool[u].material
            mat.color = new THREE.Color(this.colorFunction(audioSamples[access]));
            mat.opacity = audioSamples[access] * 50 * 2
            mat.needsUpdate = true

            const pos = this.obj_pool[u].geometry.attributes.position
            pos.setY(2, -audioSamples[access] * 25)
            pos.setY(3, -audioSamples[access] * 25)
            pos.needsUpdate = true
        }
        this.composer.render(this.scene, this.camera)

        if (this.printed) {
            this.printed--
            console.log(this.obj_pool[3].geometry)
        }
    }

    colorFunction(val) {
        return `hsl(${(val * 12000 + 90) % 360}, 100%, 50%)`
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
                    vUV2[1] -= 0.003;
                    gl_FragColor = max(texture2D( tDiffuse, vUV ) , texture2D( tDiffuse2, vUV2 ));
                    // gl_FragColor = texture2D( tDiffuse, vUV );
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