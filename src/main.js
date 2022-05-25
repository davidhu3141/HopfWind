import * as THREE from 'three'
import {
    ShaderMaterial,
    UniformsUtils
} from 'three';
import { Pass, FullScreenQuad } from './Pass.js';
import { EffectComposer } from './jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './jsm/postprocessing/RenderPass.js';

var renderer
var composer
var scene
var camera

var object_pool = [];

var audioSamples = Array(128)
audioSamples.fill(0)

// settings, Scene large sound_mag, small
var pixsz = 1
var cp = 1
var show_half = false

// not for settings
var viewZ = 30
var magfy = 6

// ----- advanced -----

// global varibles, Animation
var sphere_rot = 0
var rot_is = 1
var rot_sg = 1
var opa_def = 0.0
var opa_sc = 0.5
var opa_gbs = 2.5
var hopf_lat = 0.3
var hopf_lc = 1.5
var sm_dec = 7
var sm_fac = 1
var sm_cap = 0.3
var magall = 0
var magdec = 10
var magloud = 1
var viewAngle = 0.5
var useFour = false
var capouterlight = true
var atancap = 3
var offX = 0
var offY = 0
var cliff90 = false
var cliffauto = false
var toriparty = false
var tempForToricParty = null

var use_user_image = false
var user_image = ""
var current_color = new THREE.Color(1, 1, 1)

function arbitraryPath() {
    var path = new THREE.Path()
    path.moveTo(0, 0, 0)
    for (var i = 1; i <= 64; i++)
        path.lineTo((i % 2) / 100, 0, 0)
    return path.getPoints()
}

// A global object that can listen to property changes
window.wallpaperPropertyListener = {
    applyUserProperties: function (properties) {
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
}

function wallpaperAudioListener(audioArray) {
    audioSamples = audioArray
}

var obj_l
var obj_r

var lq_angle = 0
var lp = 0
var t = 0

function run() {

    window.requestAnimationFrame(run)

    var sum = audioSamples.reduce((a, b) => a + b) / 128
    lq_angle += 0.0012 * rot_is + sum / 6 * rot_sg
    t += 0.5
    var magall_new = sum * magloud / 2
    magall = magall_new >= magall
        ? magall_new
        : (magall * magdec + magall_new) / (magdec + 1)

    for (var j = 0; j < 128; j++) {

        var position_l = object_pool[j].geometry.attributes.position
        var material_l = object_pool[j].material
        var opa_new = (opa_def + opa_gbs * audioSamples[j]) * opa_sc * 2
        material_l.opacity = opa_new >= material_l.opacity
            ? opa_new : (material_l.opacity * sm_dec + opa_new) / (sm_dec + 1)

        // material_l.color = new THREE.Color(`hsl(${(audioSamples[j] * 120 + Math.max(t, lq_angle * 18)) % 270 + 120}, 100%, 50%)`);

        const phi = 2 * Math.PI * j / 128 + t / 30 * (1 + 0 * 3)
        for (var k = 0; k <= 64; k++) {
            const theta = 2 * Math.PI * k / 64
            position_l.setY(k, -2)
            position_l.setX(k, (1 + magall * 5) * 4 * Math.cos(phi) + 0.1 * Math.cos(theta) * (1 + 5 * audioSamples[j]))
            position_l.setZ(k, (1 + magall * 5) * 4 * Math.sin(phi) + 0.1 * Math.sin(theta) * (1 + 5 * audioSamples[j]))
        }

        position_l.needsUpdate = true
    }

    composer.render(scene, camera)
}


function onWindowResized() {
    renderer.setSize(window.innerWidth / (pixsz * cp), window.innerHeight / (pixsz * cp))
    composer.setSize(window.innerWidth / (pixsz * cp), window.innerHeight / (pixsz * cp))
    document.body.appendChild(renderer.domElement)
    renderer.domElement.setAttribute("style",
        `width:${window.innerWidth / cp}px;` +
        `height:${window.innerHeight / cp}px;` +
        `left:${window.innerWidth * (1 - 1 / cp + offX) / 2}px;` +
        `top:${window.innerHeight * (1 - 1 / cp + offY) / 2}px;`
    )
    camera.aspect = window.innerWidth / window.innerHeight
    camera.position.z = viewZ * Math.cos(viewAngle)
    camera.position.y = viewZ * Math.sin(viewAngle)
    camera.far = show_half ? viewZ : viewZ * 2
    camera.fov = 60 / cp
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    camera.updateProjectionMatrix()
}

window.onload = function () {

    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, show_half ? viewZ : viewZ * 2)

    for (var j = 0; j < 128; j++) {
        var fiberGeo = new THREE.BufferGeometry().setFromPoints(arbitraryPath());

        var fiberMaterial = new THREE.LineBasicMaterial({ color: current_color, transparent: true, opacity: 1, depthWrite: false });

        var newFiber = new THREE.Line(fiberGeo, fiberMaterial);
        scene.add(newFiber);
        object_pool.push(newFiber);
    }


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

window.onresize = onWindowResized

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
                    vUV2[1] -= 0.004;
                    gl_FragColor = texture2D( tDiffuse, vUV ) + texture2D( tDiffuse2, vUV2 ) * 0.97;

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
