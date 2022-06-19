
import * as THREE from 'three'
import { Pass, FullScreenQuad } from './Pass.js';
import { EffectComposer } from './jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './jsm/postprocessing/RenderPass.js';

import { Visualizer } from '../Visualizer.js'
export { SpecGradient }

class SpecGradient extends Visualizer {

    // settings, Scene large sound_mag, small
    pixsz = 1
    cp = 1
    show_half = false

    // not for settings
    viewZ = 30
    magfy = 6

    // ----- advanced -----

    // global varibles, Animation
    sphere_rot = 0
    rot_is = 1
    rot_sg = 1
    opa_def = 0.0
    opa_sc = 0.5
    opa_gbs = 2.5
    hopf_lat = 0.3
    hopf_lc = 1.5
    sm_dec = 7
    sm_fac = 1
    sm_cap = 0.3
    magall = 0
    magdec = 10
    magloud = 1
    viewAngle = 0//0.5
    useFour = false
    capouterlight = true
    atancap = 3
    offX = 0
    offY = 0
    cliff90 = false
    cliffauto = false
    toriparty = false
    tempForToricParty = null

    use_user_image = false
    user_image = ""
    current_color = new THREE.Color(1, 1, 1)

    renderer
    composer
    scene
    camera

    object_pool = [];
    band = null;

    obj_l
    obj_r

    lq_angle = 0
    lp = 0
    t = 0

    constructor() {

        super()

        scene = new THREE.Scene()
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, show_half ? viewZ : viewZ * 2)

        let mat = new THREE.MeshBasicMaterial()
        mat.vertexColors = true
        let geo = new THREE.PlaneBufferGeometry(20, 0.2, 128, 1)
        let color = new Float32Array(new Array(129 * 2 * 3).fill(0.05))
        geo.setAttribute('color', new THREE.BufferAttribute(color, 3))
        band = new THREE.Mesh(geo, mat)
        console.log(band)

        scene.add(band)

        var light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1)
        scene.add(light)

        renderer = window.WebGLRenderingContext
            ? new THREE.WebGLRenderer({ alpha: true })
            : new THREE.CanvasRenderer()

        composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        const params = {};
        const myPass = new MyPass(window.innerWidth, window.innerHeight, params);
        // const myPass2 = new MyPass2(window.innerWidth, window.innerHeight, params, myPass);
        composer.addPass(renderPass);
        composer.addPass(myPass);
        // composer.addPass(myPass2);

        onWindowResized()

        window.requestAnimationFrame(run)
        window.wallpaperRegisterAudioListener(wallpaperAudioListener)
        onWindowResized()

    }

    applySettingForWPE(properties) {
        if (properties.schemecolor) {
            var schemeColor = properties.schemecolor.value.split(' ')
            schemeColor = schemeColor.map(c => Math.ceil(c * 255))
            properties.schemeColor = schemeColor
        }
        /////////////////////////////////////////////////////////
        if (properties.toruscolor) {
            var customColor = properties.toruscolor.value.split(' ')
            current_color = new THREE.Color(customColor[0] * 1, customColor[1] * 1, customColor[2] * 1)
            object_pool.forEach(e => { e.material.color = current_color })
        }
        if (properties.pixelated) {
            pixsz = properties.pixelated.value
            onWindowResized()
        }
        if (properties.canvasportion) {
            cp = properties.canvasportion.value
            onWindowResized()
        }
        if (properties.showonlyhalf) {
            show_half = !properties.showonlyhalf.value
            onWindowResized()
        }
        if (properties.customimage) {
            use_user_image = properties.customimage.value
            if (use_user_image && user_image)
                document.body.setAttribute("style", `background-image: url("file:///${user_image}")`)
            else
                document.body.setAttribute("style", '')
        }
        if (properties.customimagepath) {
            user_image = properties.customimagepath.value
            if (use_user_image)
                document.body.setAttribute("style", `background-image: url("file:///${user_image}")`)
        }
        /////////////////////////////////////////////////////////
        if (properties.rot_is) {
            rot_is = properties.rot_is.value
        }
        if (properties.rot_sg) {
            rot_sg = properties.rot_sg.value
        }
        /////////////////////////////////////////////////////////
        if (properties.opa_sc) {
            opa_sc = properties.opa_sc.value
        }
        if (properties.opacitydefault) {
            opa_def = Math.pow(properties.opacitydefault.value, 2)
        }
        if (properties.opa_gbs) {
            opa_gbs = properties.opa_gbs.value
        }
        /////////////////////////////////////////////////////////
        if (properties.hopf_lat) {
            hopf_lat = properties.hopf_lat.value / 180 * Math.PI
        }
        if (properties.hopflatitudecap) {
            hopf_lc = properties.hopflatitudecap.value / 180 * Math.PI
        }
        /////////////////////////////////////////////////////////
        if (properties.sm_fac) {
            sm_fac = properties.sm_fac.value
        }
        if (properties.sm_dec) {
            sm_dec = properties.sm_dec.value * 10
        }
        if (properties.soundmagnitudecap) {
            sm_cap = properties.soundmagnitudecap.value
        }
        /////////////////////////////////////////////////////////
        if (properties.magloud) {
            magloud = properties.magloud.value
        }
        if (properties.magfy) {
            magfy = properties.magfy.value
        }
        if (properties.view) {
            viewAngle = properties.view.value / 180 * Math.PI
            onWindowResized()
        }
        if (properties.capouterlight) {
            capouterlight = properties.capouterlight.value
        }
        if (properties.usefour) {
            useFour = properties.usefour.value
        }
        if (properties.atancap) {
            atancap = properties.atancap.value + 3
        }
        if (properties.offsetx) {
            offX = properties.offsetx.value
            onWindowResized()
        }
        if (properties.offsety) {
            offY = properties.offsety.value
            onWindowResized()
        }
        if (properties.cliffordrotation45) {
            cliff90 = properties.cliffordrotation45.value
        }
        if (properties.cliffordrotationauto) {
            cliffauto = properties.cliffordrotationauto.value
        }
        if (properties.toricgotoparty) {
            toriparty = properties.toricgotoparty.value
            if (!toriparty) {
                object_pool.forEach(e => { e.material.color = current_color })
                if (tempForToricParty) {
                    capouterlight = tempForToricParty.capouterlight || false
                    opa_sc = tempForToricParty.opa_sc || 1
                    opa_def = tempForToricParty.opa_def || 0.3
                    opa_gbs = tempForToricParty.opa_gbs || 0.5
                    tempForToricParty = null
                }
            } else {
                tempForToricParty = {
                    capouterlight: capouterlight,
                    opa_def: opa_def,
                    opa_sc: opa_sc,
                    opa_gbs: opa_gbs
                }
                capouterlight = true
                opa_sc = 1
                opa_def = 0
                opa_gbs = 5
            }
        }
    }

    windowResized(innerWidth, innerHeight) {
        renderer.setSize(innerWidth / (pixsz * cp), innerHeight / (pixsz * cp))
        composer.setSize(innerWidth / (pixsz * cp), innerHeight / (pixsz * cp))
        document.body.appendChild(renderer.domElement)
        renderer.domElement.setAttribute("style",
            `width:${innerWidth / cp}px;` +
            `height:${innerHeight / cp}px;` +
            `left:${innerWidth * (1 - 1 / cp + offX) / 2}px;` +
            `top:${innerHeight * (1 - 1 / cp + offY) / 2}px;`
        )
        camera.aspect = innerWidth / innerHeight
        camera.position.z = viewZ * Math.cos(viewAngle)
        camera.position.y = viewZ * Math.sin(viewAngle)
        camera.far = show_half ? viewZ : viewZ * 2
        camera.fov = 60 / cp
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        camera.updateProjectionMatrix()
    }

    render() {
        var sum = audioSamples.reduce((a, b) => a + b) / 128
        lq_angle += 0.0012 * rot_is + sum / 6 * rot_sg
        t += 0.5
        var magall_new = sum * magloud / 2
        magall = magall_new >= magall
            ? magall_new
            : (magall * magdec + magall_new) / (magdec + 1)

        var geometry = band.geometry;


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
        composer.render(scene, camera)
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

        this.uniforms = UniformsUtils.clone(MyPassShader.uniforms);
        this.material = new ShaderMaterial({
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