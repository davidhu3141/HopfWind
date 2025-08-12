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

    // default values
    _2doffsetx = 0
    _2doffsety = 0
    _3drotation = 0
    antialiasingwillcauseblur = false
    backgroundcolor = "rgb(0 0 0)"
    barsflip = false
    barslengthchangebysound = false
    barslengthinitial = 0
    canvasshrink = 0
    current_color = null
    huechangebysound = 0
    hueinitial = 0
    lightness = 0
    opacitychangebysound = 0
    opacityinitial = 0
    saturation = 0
    usesinglecolor = false
    barwidth = 0.2
    bardistance = 0.25

    constructor(sampleSize) {

        super()

        this.sampleSize = sampleSize

        for (var i = 0; i < this.sampleSize; i++) {
            let geo = new THREE.PlaneGeometry(0.4, 0.03, 1, 1)
            let mat = new THREE.MeshBasicMaterial()
            let square = new THREE.Mesh(geo, mat)
            mat.transparent = true
            mat.side = THREE.DoubleSide
            square.matrix.setPosition(40 * i / this.sampleSize - 20, 0, 0)
            square.matrixAutoUpdate = false
            this.scene.add(square)
            this.obj_pool.push(square)
        }

        var light = new THREE.HemisphereLight(0xffffff, 0x080808, 1)
        this.scene.add(light)

        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        const params = {};
        const myPass = new MyPass(window.innerWidth, window.innerHeight, params);

        this.composer.addPass(renderPass);
        this.composer.addPass(myPass);
    }

    // note: dev webview reload won't re-apply attr?
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
        if (properties.canvasshrink) {
            this.canvasPortion = properties.canvasshrink.value + 1
            this.windowResized()
        }
        /////////////////////////////////////////////////////////
        if (properties.usecustomimage) {
            this.use_user_image = properties.usecustomimage.value
            if (this.use_user_image && this.user_image)
                document.body.style.backgroundImage = `url("file:///${this.user_image}`
            else {
                document.body.style.backgroundImage = ''
                document.body.style.backgroundColor = this.backgroundcolor
            }
        }
        if (properties.customimage) {
            this.user_image = properties.customimage.value
            if (this.use_user_image)
                document.body.style.backgroundImage = `url("file:///${this.user_image}`
        }
        /////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////
        if (properties.barwidth) {
            this.barwidth = properties.barwidth.value
            this.obj_pool.forEach(square => {
                const oldGeo = square.geometry;
                const newGeo = new THREE.PlaneGeometry(this.barwidth, oldGeo.parameters.height, 1, 1);
                square.geometry.dispose();
                square.geometry = newGeo;
            });
        }
        if (properties.bardistance) {
            this.bardistance = properties.bardistance.value
            this.obj_pool.forEach((square, i) => {
                square.matrix.setPosition(this.bardistance * (i - this.sampleSize / 2), 0, 0)
            });
        }
        if (properties._2doffsetx) {
            this._2doffsetx = properties._2doffsetx.value * 20
            this.scene.position.x = this._2doffsetx
        }
        if (properties._2doffsety) {
            this._2doffsety = properties._2doffsety.value * 20 * 0.73
            this.scene.position.y = this._2doffsety
        }
        if (properties._2drotation) {
            const angle = properties._2drotation.value / 180 * Math.PI
            this.camera.rotation.z = angle;
        }
        if (properties._3drotation) {
            this._3drotation = properties._3drotation.value
            this.scene.rotation.y = this._3drotation / 180 * Math.PI
        }
        if (properties.antialiasingwillcauseblur) {
            this.antialiasingwillcauseblur = properties.antialiasingwillcauseblur.value
            const filter = this.antialiasingwillcauseblur ? THREE.LinearFilter : THREE.NearestFilter
            this.composer.passes[1].setFilter(filter)
        }
        if (properties.applyfadingpernframes) {
            const applyfadingpernframes = properties.applyfadingpernframes.value
            this.composer.passes[1].setApplyFadingPerNFrames(applyfadingpernframes)
        }
        if (properties.backgroundcolor) {
            const c = properties.backgroundcolor.value
                .split(' ')
                .map(e => e * 255)
                .join(' ')
            this.backgroundcolor = `rgb(${c})`
            document.body.style.backgroundColor = this.backgroundcolor
        }
        if (properties.barcolor) {
            const customColor = properties.barcolor.value.split(' ')
            this.current_color = new THREE.Color(customColor[0] * 1, customColor[1] * 1, customColor[2] * 1)
            if (this.usesinglecolor) {
                this.obj_pool.forEach(e => { e.material.color = this.current_color })
            }
        }
        if (properties.bars) {
            this.bars = properties.bars.value
        }
        if (properties.barsflip) {
            this.barsflip = properties.barsflip.value
            const a0 = this.barsflip ? 0 : 2
            const a1 = this.barsflip ? 1 : 3
            for (let u = 0; u < this.sampleSize; u++) {
                const pos = this.obj_pool[u].geometry.attributes.position
                pos.setY(a0, 0)
                pos.setY(a1, 0)
                pos.needsUpdate = true
            }
        }
        if (properties.barslengthchangebysound) {
            this.barslengthchangebysound = properties.barslengthchangebysound.value
        }
        if (properties.barslengthinitial) {
            this.barslengthinitial = properties.barslengthinitial.value / 30
        }
        if (properties.canvasshrink) {
            this.canvasshrink = properties.canvasshrink.value
        }
        if (properties.colors) {
            this.colors = properties.colors.value
        }
        if (properties.fade) {
            const fadeAmount = properties.fade.value / 255
            this.composer.passes[1].setFadeAmount(fadeAmount)
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
        if (properties.flowopacitylimit) {
            const flowopacitylimit = properties.flowopacitylimit.value
            this.composer.passes[1].setFlowOpacityLimit(flowopacitylimit)
        }
        if (properties.huechangebysound) {
            this.huechangebysound = properties.huechangebysound.value
        }
        if (properties.hueinitial) {
            this.hueinitial = properties.hueinitial.value
        }
        if (properties.saturation) {
            this.saturation = properties.saturation.value
        }
        if (properties.lightness) {
            this.lightness = properties.lightness.value
        }
        if (properties.opacitychangebysound) {
            this.opacitychangebysound = properties.opacitychangebysound.value
        }
        if (properties.opacityinitial) {
            this.opacityinitial = properties.opacityinitial.value
        }
        if (properties.usesinglecolor) {
            this.usesinglecolor = properties.usesinglecolor.value
            if (this.current_color) {
                this.obj_pool.forEach(e => { e.material.color = this.current_color })
            }
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

    render(time, audioSamples) {

        audioSamples = audioSamples.map(e => e * this.overallMagnitude)
        const a0 = this.barsflip ? 2 : 0
        const a1 = this.barsflip ? 3 : 1
        const barmagfac = 40 * (this.barsflip ? -1 : 1)

        for (let u = 0; u < this.sampleSize; u++) {
            const access = u >= this.sampleSize / 2
                ? this.sampleSize / 2 * 3 - u - 1
                : u

            const mat = this.obj_pool[u].material
            if (!this.usesinglecolor) {
                mat.color = new THREE.Color(this.colorFunction(audioSamples[access], time));
            }
            mat.opacity = this.opacityinitial + audioSamples[access] * 100 * this.opacitychangebysound
            mat.needsUpdate = true

            const pos = this.obj_pool[u].geometry.attributes.position
            pos.setY(a0, (this.barslengthinitial + this.barslengthchangebysound * audioSamples[access]) * barmagfac)
            pos.setY(a1, (this.barslengthinitial + this.barslengthchangebysound * audioSamples[access]) * barmagfac)
            pos.needsUpdate = true
        }
        this.composer.render(this.scene, this.camera)
    }

    colorFunction(val, time) {
        const hueinitial = this.hueinitial > 0
            ? this.hueinitial
            : time * this.hueinitial * -0.3
        const hue = (hueinitial + val * 9000 * this.huechangebysound) % 360
        return `hsl(${hue >= 0 ? hue : hue + 360}, ${this.saturation}%, ${this.lightness}%)`
    }

}

class MyPass extends Pass {

    count = 0
    width
    height
    _velocity = 1 / 255
    _moveDir = 0.7
    _applyFadingPerNFrames = 1
    _filter = THREE.NearestFilter

    constructor(width, height, params) {

        super();

        this.width = width;
        this.height = height;

        this.createRenderTargets(this._filter);

        const MyPassShader = {

            uniforms: {
                'tDiffuse': { value: null },
                'tDiffuse2': { value: null },
                'width': { value: 1 },
                'height': { value: 1 },
                'moveVelocityX': { value: 0.0 },
                'moveVelocityY': { value: 0.0 },
                'shouldDecline': { value: 1.0 },
                'fadeAmount': { value: 0.0025 },
                'flowOpacityLimit': { value: 0.9 }
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
                uniform float fadeAmount;
                uniform float flowOpacityLimit;

                void main() {
                    vec2 vUV2 = vUV - vec2(moveVelocityX, moveVelocityY);

                    vec4 tex1 = texture2D( tDiffuse, vUV );
                    vec4 tex2 = texture2D( tDiffuse2, vUV2 );
                    tex2.rgb /= tex2.a;
                    tex2.a = min(tex2.a, flowOpacityLimit) - (shouldDecline > 0.0 ? fadeAmount : 0.0);
                    gl_FragColor = tex1.a >= tex2.a ? tex1 : tex2;
                }`
        };
        // note: 所以 sampler 拿到的是 after blend

        // note: color blending of two opacity? didn't.
        this.uniforms = THREE.UniformsUtils.clone(MyPassShader.uniforms);
        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            fragmentShader: MyPassShader.fragmentShader,
            vertexShader: MyPassShader.vertexShader,
            transparent: true
        });

        this.uniforms.width.value = width;
        this.uniforms.height.value = height;

        for (const key in params) {
            if (params.hasOwnProperty(key) && this.uniforms.hasOwnProperty(key)) {
                this.uniforms[key].value = params[key];
            }
        }

        this.fsQuad = new FullScreenQuad(this.material);
    }

    createRenderTargets(filter) {
        // Dispose old targets if they exist
        if (this.remember) this.remember.dispose();
        if (this.remember2) this.remember2.dispose();
        this.remember = new THREE.WebGLRenderTarget(this.width, this.height, {
            minFilter: filter,
            magFilter: filter,
            format: THREE.RGBAFormat,
            stencilBuffer: false
        });
        this.remember2 = new THREE.WebGLRenderTarget(this.width, this.height, {
            minFilter: filter,
            magFilter: filter,
            format: THREE.RGBAFormat,
            stencilBuffer: false
        });
    }

    setFilter(filter) {
        this._filter = filter;
        this.createRenderTargets(this._filter);
        this.material.needsUpdate = true;
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

    setFadeAmount(val) {
        this.uniforms.fadeAmount.value = val;
    }

    setFlowOpacityLimit(val) {
        this.uniforms.flowOpacityLimit.value = val;
    }

    render(renderer, writeBuffer, readBuffer/*, deltaTime, maskActive*/) {

        this.count++
        this.uniforms.shouldDecline.value = (this.count % this._applyFadingPerNFrames === 0)
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