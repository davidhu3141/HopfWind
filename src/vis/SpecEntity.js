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

    customimage = ""
    use_user_image = true
    applySettingForWPE(properties) {
        if (properties.view) {
            const angle = properties.view.value / 180 * Math.PI
            this.camera.rotation.z = angle;
        }
        if (properties.offsetx) {
            const angle = Math.round(properties.offsetx.value * 20) / 20 + Math.PI / 2
            if (this.composer.passes && this.composer.passes.length > 1 && this.composer.passes[1].setMoveDir) {
                this.composer.passes[1].setMoveDir(angle);
            }
        }
        document.body.setAttribute("style", `background-image: url("file:///C:/Users/david/Desktop/photo-1543094585-3629d00f6f3a.jfif")`)
    }

    windowResized(innerWidth, innerHeight) {
        super.windowResized(innerWidth, innerHeight)
        this.composer.setSize(innerWidth / (this.pixsz * this.canvasPortion), innerHeight / (this.pixsz * this.canvasPortion))
        console.log('width', this.composer.passes[1].uniforms.width.value)
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
            // pos.setY(2, -audioSamples[access] * 25)
            // pos.setY(3, -audioSamples[access] * 25)
            pos.setY(0, audioSamples[access] * 40)
            pos.setY(1, audioSamples[access] * 40)
            pos.needsUpdate = true
        }
        this.composer.render(this.scene, this.camera)

        if (this.printed) {
            this.printed--
            // console.log(this.obj_pool[3].geometry)
        }
    }

    colorFunction(val) {
        return `hsl(${(val * 9000 + 90) % 360}, 100%, 50%)`
    }

}

class MyPass extends Pass {

    constructor(width, height, params) {

        super();

        this.remember = new THREE.WebGLRenderTarget(innerWidth, innerHeight, {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            stencilBuffer: false
        });
        this.remember2 = new THREE.WebGLRenderTarget(innerWidth, innerHeight, {
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            stencilBuffer: false
        });
        this.count = 0

        const MyPassShader = {

            uniforms: {
                'tDiffuse': { value: null },
                'tDiffuse2': { value: null },
                'width': { value: 1 },
                'height': { value: 1 },
                'moveDir': { value: 0.0 }
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
                uniform float moveDir;

                void main() {
                    vec2 vUV2 = vUV;
                    vUV2 -= 0.0015 * vec2(cos(moveDir), sin(moveDir));

                    vec4 tex2 = texture2D( tDiffuse2, vUV2 );
                    if(tex2.a > 0.3) {
                        tex2 = tex2 * 0.3;
                    }

                    gl_FragColor = max(texture2D( tDiffuse, vUV ) , tex2 * 0.999);
                    // gl_FragColor.a = max(texture2D( tDiffuse, vUV ).a , texture2D( tDiffuse2, vUV2 ).a * 0.998);
                    // gl_FragColor = texture2D( tDiffuse, vUV );
                    gl_FragColor.xyz = normalize(gl_FragColor.xyz);
                }`

        };

        this.uniforms = THREE.UniformsUtils.clone(MyPassShader.uniforms);
        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: MyPassShader.fragmentShader,
            vertexShader: MyPassShader.vertexShader,
            transparent: true
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

    setMoveDir(val) {
        this.uniforms.moveDir.value = val;
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