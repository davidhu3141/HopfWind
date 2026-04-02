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
uniform float aspect;

void main() {
    vec2 centered = (vUV - vec2(0.5)) * 2.0;
    centered.x *= aspect;

    float r = length(centered);
    float k = 30.0;
    float sampleR = r + sin(k * r) / k;

    vec2 direction = r > 0.0001 ? centered / r : vec2(0.0);
    vec2 warped = direction * sampleR;
    warped.x /= aspect;
    vec2 sampleUv = warped * 0.5 + vec2(0.5);

    if (sampleUv.x < 0.0 || sampleUv.x > 1.0 || sampleUv.y < 0.0 || sampleUv.y > 1.0) {
        gl_FragColor = texture2D(tDiffuse, vUV);
        return;
    }

    gl_FragColor = texture2D(tDiffuse, sampleUv);
}`;
}

export class RetroRadialWarpPass extends Pass {
    constructor(width, height) {
        super();

        this.width = width;
        this.height = height;
        this.uniforms = {
            tDiffuse: { value: null },
            aspect: { value: 1 },
        };
        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: makeVertexShader(),
            fragmentShader: makeFragmentShader(),
        });
        this.fsQuad = new FullScreenQuad(this.material);
        this.setSize(width, height);
    }

    setSize(width, height) {
        this.width = Math.max(1, Math.round(width));
        this.height = Math.max(1, Math.round(height));
        this.uniforms.aspect.value = this.width / this.height;
    }

    render(renderer, writeBuffer, readBuffer) {
        this.uniforms.tDiffuse.value = readBuffer.texture;

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
        this.fsQuad?.dispose();
        this.material?.dispose();
    }
}
