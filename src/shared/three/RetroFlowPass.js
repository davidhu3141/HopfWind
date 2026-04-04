import * as THREE from 'three';
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass.js';

function makeVertexShader() {
    return /* glsl */`
varying vec2 vUV;
void main() {
    vUV = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
}

function makeFragmentShader(shadeFront = false) {
    const frontJudge = shadeFront ? 'tex2.a <= 0.0' : 'tex1.a >= tex2.a';

    return /* glsl */`
#define ETH 0.0025

varying vec2 vUV;
uniform sampler2D tDiffuse;
uniform sampler2D tDiffuse2;
uniform float width;
uniform float height;
uniform float moveVelocityX;
uniform float shouldDecline;
uniform float fadeAmount;
uniform float flowOpacityLimit;
uniform float fieldMix;

void main() {
    float aspect = width / max(height, 1.0);
    vec2 centered = (vUV - vec2(0.5, 0.5)) * 55.0;
    centered.x *= aspect;
    float x = centered.x;
    float y = centered.y;
    vec2 oldField = vec2(y, -x) * 0.05;
    float t = (cos(x) + cos(y) + 2.0) / 4.0;
    t = pow(t, 0.18);
    vec2 mv1 = -vec2(-sin(x), -sin(y));
    vec2 mv2 = vec2(sin(y), -sin(x));
    vec2 newField = mv1 * (1.0 - t) + mv2 * t;
    vec2 flowField = mix(oldField, newField, fieldMix);
    flowField.x /= aspect;
    vec2 vUV2 = vUV - moveVelocityX * flowField;

    vec4 tex1 = texture2D(tDiffuse, vUV);
    vec4 tex2 = texture2D(tDiffuse2, vUV2);
    tex1.a = min(tex1.a, 1.);
    tex2.rgb /= max(tex2.a, 0.0001);
    tex2.a = min(tex2.a, flowOpacityLimit) - (shouldDecline > 0.0 ? fadeAmount : 0.0);
    gl_FragColor = ${frontJudge}
        || min(vUV.x, vUV.y) < ETH
        || max(vUV.x, vUV.y) > 1.0 - ETH
            ? tex1
            : tex2;
}`;
}

export class RetroFlowPass extends Pass {
    constructor(width, height, params = {}) {
        super();

        this.width = width;
        this.height = height;
        this.count = 0;
        this._velocity = 1 / 255;
        this._moveDir = 0.7;
        this._applyFadingPerNFrames = 1;
        this._filter = THREE.NearestFilter;
        this._shadeFront = false;

        this.uniforms = THREE.UniformsUtils.clone({
            tDiffuse: { value: null },
            tDiffuse2: { value: null },
            width: { value: width },
            height: { value: height },
            moveVelocityX: { value: 0 },
            shouldDecline: { value: 1 },
            fadeAmount: { value: 0.0025 },
            flowOpacityLimit: { value: 0.9 },
            fieldMix: { value: 0 },
        });

        this.material = new THREE.ShaderMaterial({
            transparent: true,
            uniforms: this.uniforms,
            vertexShader: makeVertexShader(),
            fragmentShader: makeFragmentShader(this._shadeFront),
        });
        this.fsQuad = new FullScreenQuad(this.material);
        this.createRenderTargets(this._filter);

        for (const [key, value] of Object.entries(params)) {
            if (this.uniforms[key]) {
                this.uniforms[key].value = value;
            }
        }
    }

    createRenderTargets(filter) {
        this.remember?.dispose();
        this.remember2?.dispose();
        this.remember = new THREE.WebGLRenderTarget(this.width, this.height, {
            minFilter: filter,
            magFilter: filter,
            format: THREE.RGBAFormat,
            stencilBuffer: false,
        });
        this.remember2 = new THREE.WebGLRenderTarget(this.width, this.height, {
            minFilter: filter,
            magFilter: filter,
            format: THREE.RGBAFormat,
            stencilBuffer: false,
        });
    }

    setFilter(filter) {
        if (this._filter === filter) {
            return;
        }
        this._filter = filter;
        this.createRenderTargets(filter);
    }

    setShadeFront(value) {
        if (this._shadeFront === value) {
            return;
        }
        this._shadeFront = value;
        this.material.fragmentShader = makeFragmentShader(this._shadeFront);
        this.material.needsUpdate = true;
    }

    setMoveDir(value) {
        this._moveDir = value;
        this.uniforms.moveVelocityX.value = this._velocity * Math.cos(this._moveDir);
    }

    setMoveVelocity(value) {
        this._velocity = 0.0015 * value;
        this.setMoveDir(this._moveDir);
    }

    setFadeAmount(value) {
        this.uniforms.fadeAmount.value = value;
    }

    setFlowOpacityLimit(value) {
        this.uniforms.flowOpacityLimit.value = value;
    }

    setFieldMix(value) {
        this.uniforms.fieldMix.value = value;
    }

    setApplyFadingPerNFrames(value) {
        this._applyFadingPerNFrames = Math.max(1, Math.round(value));
    }

    setSize(width, height) {
        const nextWidth = Math.max(1, Math.round(width));
        const nextHeight = Math.max(1, Math.round(height));
        if (this.width === nextWidth && this.height === nextHeight) {
            return;
        }
        this.width = nextWidth;
        this.height = nextHeight;
        this.uniforms.width.value = nextWidth;
        this.uniforms.height.value = nextHeight;
        this.createRenderTargets(this._filter);
    }

    render(renderer, writeBuffer, readBuffer) {
        this.count += 1;
        this.uniforms.shouldDecline.value = this.count % this._applyFadingPerNFrames === 0 ? 1 : 0;
        this.uniforms.tDiffuse.value = readBuffer.texture;

        if (this.count % 2 === 0) {
            this.uniforms.tDiffuse2.value = this.remember.texture ?? readBuffer.texture;
            renderer.setRenderTarget(this.remember2);
            this.fsQuad.render(renderer);
        } else {
            this.uniforms.tDiffuse2.value = this.remember2.texture ?? readBuffer.texture;
            renderer.setRenderTarget(this.remember);
            this.fsQuad.render(renderer);
        }

        if (this.renderToScreen) {
            renderer.setRenderTarget(null);
            this.fsQuad.render(renderer);
            return;
        }

        renderer.setRenderTarget(writeBuffer);
        if (this.clear) {
            renderer.clear();
        }
        this.fsQuad.render(renderer);
    }

    dispose() {
        this.remember?.dispose();
        this.remember2?.dispose();
        this.fsQuad?.dispose();
        this.material?.dispose();
    }
}
