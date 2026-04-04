import * as THREE from 'three';
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass.js';
import { WARP_RADIAL_TYPE, WARP_TWIST_TYPE } from '../../wallpapers/retro-flow/constants.js';

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
uniform vec2 center;
uniform float warpFromType;
uniform float warpToType;
uniform float warpTypeMix;
uniform float radialFrequency;
uniform float thetaFrequency;
uniform float twistAmount;
uniform float twistDecay;
uniform float twistRadialFrequency;
uniform float twistRadialAmplitude;

#define EDGE_FADE 0.08

float safeWave(float x, float k) {
    return abs(k) < 0.0001 ? 0.0 : sin(k * x) / k;
}

vec2 radialWarp(vec2 centered) {
    float r = length(centered);
    float theta = atan(centered.y, centered.x);
    float sampleR = r + safeWave(r, radialFrequency);
    float sampleTheta = theta + safeWave(theta, thetaFrequency);
    return vec2(cos(sampleTheta), sin(sampleTheta)) * sampleR;
}

vec2 twistWarp(vec2 centered) {
    float r = length(centered);
    float theta = atan(centered.y, centered.x);
    float sampleTheta = theta + twistAmount * exp(-twistDecay * r * r);
    float sampleR = r + sin(twistRadialFrequency * r) * twistRadialAmplitude;
    return vec2(cos(sampleTheta), sin(sampleTheta)) * sampleR;
}

vec2 getWarpUv(float typeId, vec2 centered) {
    vec2 warped = typeId < 0.5
        ? radialWarp(centered)
        : twistWarp(centered);
    warped.x /= aspect;
    return warped * 0.5 + center;
}

void main() {
    vec2 centered = (vUV - center) * 2.0;
    centered.x *= aspect;

    vec2 fromUv = getWarpUv(warpFromType, centered);
    vec2 toUv = getWarpUv(warpToType, centered);
    vec2 sampleUv = mix(fromUv, toUv, warpTypeMix);

    float edge = min(min(vUV.x, vUV.y), min(1.0 - vUV.x, 1.0 - vUV.y));
    float safe = smoothstep(0.0, EDGE_FADE, edge);
    sampleUv = mix(vUV, sampleUv, safe);

    if (sampleUv.x < 0.0 || sampleUv.x > 1.0 || sampleUv.y < 0.0 || sampleUv.y > 1.0) {
        gl_FragColor = texture2D(tDiffuse, vUV);
        return;
    }

    gl_FragColor = texture2D(tDiffuse, sampleUv);
}`;
}

function getWarpTypeId(type) {
    switch (type) {
    case WARP_TWIST_TYPE:
        return 1;
    case WARP_RADIAL_TYPE:
    default:
        return 0;
    }
}

export class RetroRadialWarpPass extends Pass {
    constructor(width, height) {
        super();

        this.width = width;
        this.height = height;
        this.uniforms = {
            tDiffuse: { value: null },
            aspect: { value: 1 },
            center: { value: new THREE.Vector2(0.5, 0.5) },
            warpFromType: { value: 0 },
            warpToType: { value: 0 },
            warpTypeMix: { value: 0 },
            radialFrequency: { value: 27 },
            thetaFrequency: { value: 27 },
            twistAmount: { value: 0.9 },
            twistDecay: { value: 1.8 },
            twistRadialFrequency: { value: 8 },
            twistRadialAmplitude: { value: 0.08 },
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

    setCenter(x, y) {
        this.uniforms.center.value.set(x, y);
    }

    setWarpInterpolation(fromType, toType, mix) {
        this.uniforms.warpFromType.value = getWarpTypeId(fromType);
        this.uniforms.warpToType.value = getWarpTypeId(toType);
        this.uniforms.warpTypeMix.value = mix;
    }

    setRadialFrequency(value) {
        this.uniforms.radialFrequency.value = value;
    }

    setThetaFrequency(value) {
        this.uniforms.thetaFrequency.value = value;
    }

    setTwistAmount(value) {
        this.uniforms.twistAmount.value = value;
    }

    setTwistDecay(value) {
        this.uniforms.twistDecay.value = value;
    }

    setTwistRadialFrequency(value) {
        this.uniforms.twistRadialFrequency.value = value;
    }

    setTwistRadialAmplitude(value) {
        this.uniforms.twistRadialAmplitude.value = value;
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
