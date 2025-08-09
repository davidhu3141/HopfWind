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
        if (properties.overallmagnitude) {
            this.overallMagnitude = properties.overallmagnitude.value;
        }
        /////////////////////////////////////////////////////////
        if (properties.offsetx) {
            this.offX = properties.offsetx.value
            this.windowResized()
        }
        if (properties.offsety) {
            this.offY = properties.offsety.value
            this.windowResized()
        }
        if (properties.pixelated) {
            this.pixsz = properties.pixelated.value
            this.windowResized()
        }
        if (properties.canvasportion) {
            this.canvasPortion = properties.canvasportion.value
            this.windowResized()
        }
        /////////////////////////////////////////////////////////
        if (properties.customimage) {
            this.use_user_image = properties.customimage.value
            if (this.use_user_image && this.user_image)
                document.body.setAttribute("style", `background-image: url("file:///${this.user_image}")`)
            else
                document.body.setAttribute("style", '')
        }
        if (properties.customimagepath) {
            this.user_image = properties.customimagepath.value
            if (this.use_user_image)
                document.body.setAttribute("style", `background-image: url("file:///${this.user_image}")`)
        }
        /////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////
        if (properties._2doffsetx) {
            this._2doffsetx = properties._2doffsetx.value
        }
        if (properties._2doffsety) {
            this._2doffsety = properties._2doffsety.value
        }
        if (properties._2drotation) {
            const angle = properties._2drotation.value / 180 * Math.PI
            this.camera.rotation.z = angle;
        }
        if (properties._3drotation) {
            this._3drotation = properties._3drotation.value
        }
        if (properties.antialiasingwillcauseblur) {
            this.antialiasingwillcauseblur = properties.antialiasingwillcauseblur.value
        }
        if (properties.applyfadingpernframes) {
            const applyfadingpernframes = properties.applyfadingpernframes.value
            // todo: define a corresponding property in shader pass, and pass the value to the property
            if (this.composer && this.composer.passes[1] && typeof this.composer.passes[1].setApplyFadingPerNFrames === 'function') {
                this.composer.passes[1].setApplyFadingPerNFrames(applyfadingpernframes)
            }
        }
        if (properties.backgroundcolor) {
            this.backgroundcolor = properties.backgroundcolor.value
        }
        if (properties.barcolor) {
            this.barcolor = properties.barcolor.value
        }
        if (properties.bars) {
            this.bars = properties.bars.value
        }
        if (properties.barsflip) {
            this.barsflip = properties.barsflip.value
        }
        if (properties.barslengthchangebysound) {
            this.barslengthchangebysound = properties.barslengthchangebysound.value
        }
        if (properties.barslengthinitial) {
            this.barslengthinitial = properties.barslengthinitial.value
        }
        if (properties.canvasshrink) {
            this.canvasshrink = properties.canvasshrink.value
        }
        if (properties.colors) {
            this.colors = properties.colors.value
        }
        if (properties.customimage) {
            this.customimage = properties.customimage.value
        }
        if (properties.fade) {
            this.fade = properties.fade.value
        }
        if (properties.flow) {
            this.flow = properties.flow.value
        }
        if (properties.flowdirection) {
            const flowdirection = properties.flowdirection.value / 180 * Math.PI + Math.PI / 2
            this.composer.passes[1].setMoveDir(flowdirection)
        }
        if (properties.flowvelocity) {
            const flowvelocity = properties.flowvelocity.value / 5
            this.composer.passes[1].setMoveVelocity(flowvelocity)
        }
        if (properties.gradientbarcolor1) {
            this.gradientbarcolor1 = properties.gradientbarcolor1.value
        }
        if (properties.gradientbarcolor2) {
            this.gradientbarcolor2 = properties.gradientbarcolor2.value
        }
        if (properties.huechangebysound) {
            this.huechangebysound = properties.huechangebysound.value
        }
        if (properties.hueinitial) {
            this.hueinitial = properties.hueinitial.value
        }
        if (properties.offsetx) {
            this.offsetx = properties.offsetx.value
        }
        if (properties.offsety) {
            this.offsety = properties.offsety.value
        }
        if (properties.opacitychangebysound) {
            this.opacitychangebysound = properties.opacitychangebysound.value
        }
        if (properties.opacityinitial) {
            this.opacityinitial = properties.opacityinitial.value
        }
        if (properties.overallmagnitude) {
            this.overallmagnitude = properties.overallmagnitude.value
        }
        if (properties.schemecolor) {
            this.schemecolor = properties.schemecolor.value
        }
        if (properties.usecustomimage) {
            this.usecustomimage = properties.usecustomimage.value
        }
        if (properties.usegradientbarcolor) {
            this.usegradientbarcolor = properties.usegradientbarcolor.value
        }
        if (properties.usesinglecolor) {
            this.usesinglecolor = properties.usesinglecolor.value
        }
        /////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////
        if (properties.view) {

        }
    }

    windowResized() {
        super.windowResized()
        const innerWidth = window.innerWidth
        const innerHeight = window.innerHeight
        const pixsz = this.pixsz
        const cp = this.canvasPortion
        this.composer.setSize(innerWidth / (pixsz * cp), innerHeight / (pixsz * cp))
    }

    printed = 100

    render(time, audioSamples) {

        audioSamples = audioSamples.map(e => e * 3)

        for (let u = 0; u < this.sampleSize; u++) {
            // const access = u //  > this.sampleSize / 2 ? this.sampleSize / 2 * 3 - u - 1 : u
            const access = u >= this.sampleSize / 2 ? this.sampleSize / 2 * 3 - u - 1 : u

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
        // return `hsl(${(val * 9000 + 90) % 360}, 100%, 50%)`
        return `hsl(${(val * 9000 + 90) % 360}, 100%, 100%)`
    }

}

class MyPass extends Pass {

    _velocity = 1
    _moveDir = 0.7
    _applyFadingPerNFrames = 5 // default value

    constructor(width, height, params) {

        super();

        // this.remember = new THREE.WebGLRenderTarget(innerWidth, innerHeight);
        // this.remember2 = new THREE.WebGLRenderTarget(innerWidth, innerHeight);
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
                'moveVelocityX': { value: 0.0 },
                'moveVelocityY': { value: 0.0 },
                'shouldDecline': { value: 1.0 }
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
                uniform float moveVelocityX;
                uniform float moveVelocityY;
                uniform float shouldDecline;

                void main() {
                    vec2 vUV2 = vUV;
                    vUV2 -= vec2(moveVelocityX, moveVelocityY);

                    vec4 tex2 = texture2D( tDiffuse2, vUV2 );
                    if(tex2.a > 0.9) {
                        tex2 = tex2 * 0.9;
                    }

                    if(shouldDecline > 0.0){
                        gl_FragColor = max(texture2D( tDiffuse, vUV ) , tex2 - vec4(0.0025)); // will be x times smaller
                    } else {
                        gl_FragColor = max(texture2D( tDiffuse, vUV ) , tex2);
                    }

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
        this._moveDir = val
        this.uniforms.moveVelocityX.value = this._velocity * Math.cos(this._moveDir);
        this.uniforms.moveVelocityY.value = this._velocity * Math.sin(this._moveDir);
    }

    setMoveVelocity(velocity) {
        this._velocity = 0.0015 * velocity;
        this.uniforms.moveVelocityX.value = this._velocity * Math.cos(this._moveDir);
        this.uniforms.moveVelocityY.value = this._velocity * Math.sin(this._moveDir);
    }

    setApplyFadingPerNFrames(val) {
        this._applyFadingPerNFrames = val;
    }

    render(renderer, writeBuffer, readBuffer/*, deltaTime, maskActive*/) {

        this.count++
        this.uniforms.shouldDecline.value = (this.count % this._applyFadingPerNFrames > 0)
            ? 1.0
            : 0.0

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