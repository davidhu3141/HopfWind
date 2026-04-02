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

function makeFragmentShader() {
    return /* glsl */`
varying vec2 vUV;
uniform sampler2D tDiffuse;
uniform sampler2D tDiffuse2;
uniform float trailShiftY;
uniform float insertThreshold;

void main() {
    vec2 rememberedUv = vUV;
    rememberedUv.y -= trailShiftY;

    if (vUV.y < insertThreshold) {
        gl_FragColor = texture2D(tDiffuse, vUV);
        return;
    }

    vec4 rememberedColor = texture2D(tDiffuse2, rememberedUv);
    rememberedColor.rgb /= max(rememberedColor.a, 0.0001);
    gl_FragColor = rememberedColor;
}`;
}

export class GradientTrailPass extends Pass {
    constructor(width, height) {
        super();

        this.width = width;
        this.height = height;
        this.count = 0;
        this.uniforms = {
            tDiffuse: { value: null },
            tDiffuse2: { value: null },
            trailShiftY: { value: 0.001 },
            insertThreshold: { value: 0.0025 },
        };

        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: makeVertexShader(),
            fragmentShader: makeFragmentShader(),
        });
        this.fsQuad = new FullScreenQuad(this.material);
        this.createRenderTargets();
    }

    createRenderTargets() {
        this.remember?.dispose();
        this.remember2?.dispose();
        this.remember = new THREE.WebGLRenderTarget(this.width, this.height);
        this.remember2 = new THREE.WebGLRenderTarget(this.width, this.height);
    }

    setSize(width, height) {
        const nextWidth = Math.max(1, Math.round(width));
        const nextHeight = Math.max(1, Math.round(height));
        if (nextWidth === this.width && nextHeight === this.height) {
            return;
        }

        this.width = nextWidth;
        this.height = nextHeight;
        this.createRenderTargets();
    }

    render(renderer, writeBuffer, readBuffer) {
        this.count += 1;
        this.uniforms.tDiffuse.value = readBuffer.texture;

        if (this.count % 2 === 0) {
            this.uniforms.tDiffuse2.value = this.remember.texture || readBuffer.texture;
            renderer.setRenderTarget(this.remember2);
            this.fsQuad.render(renderer);
        } else {
            this.uniforms.tDiffuse2.value = this.remember2.texture || readBuffer.texture;
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
