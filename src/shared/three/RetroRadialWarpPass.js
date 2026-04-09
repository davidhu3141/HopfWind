import { MathUtils, ShaderMaterial, Vector2 } from 'three';
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass.js';
import {
    WARP_CUSTOM_TYPE,
    WARP_FLOWER_TYPE,
    WARP_GRID_TYPE,
    WARP_NONE_TYPE,
    WARP_RADIAL_TYPE,
    WARP_TRIANGULAR_TYPE,
    WARP_TWIST_TYPE,
    WARP_WAVE_TYPE,
} from '../../wallpapers/retro-flow/constants.js';
import fullscreenQuadVertexShader from './shaders/fullscreenQuad.vert.glsl';
import retroRadialWarpFragmentShader from './shaders/retroRadialWarp.frag.glsl';

function getConcreteWarpTypeId(type) {
    switch (type) {
        case WARP_NONE_TYPE:
            return 0;
        case WARP_RADIAL_TYPE:
            return 1;
        case WARP_TWIST_TYPE:
            return 2;
        case WARP_GRID_TYPE:
            return 3;
        case WARP_WAVE_TYPE:
            return 4;
        case WARP_FLOWER_TYPE:
            return 5;
        case WARP_TRIANGULAR_TYPE:
            return 6;
        default:
            return 1;
    }
}

function getWarpTypeId(type) {
    if (type === WARP_CUSTOM_TYPE) {
        return 7;
    }
    return getConcreteWarpTypeId(type);
}

export class RetroRadialWarpPass extends Pass {
    constructor(width, height) {
        super();

        this.width = width;
        this.height = height;
        this.uniforms = {
            tDiffuse: { value: null },
            aspect: { value: 1 },
            center: { value: new Vector2(0.5, 0.5) },
            warpFromType: { value: 0 },
            warpToType: { value: 0 },
            warpTypeMix: { value: 0 },
            customWarpFromType: { value: 1 },
            customWarpToType: { value: 2 },
            customWarpMix: { value: 0.5 },
            radialFrequency: { value: 27 },
            thetaFrequency: { value: 27 },
            radialSharpness: { value: 0.25 },
            thetaSharpness: { value: 0.25 },
            radialAmplitude: { value: 0.12 },
            thetaAmplitude: { value: 0.12 },
            twistAmount: { value: 0.9 },
            twistDecay: { value: 1.8 },
            twistRadialFrequency: { value: 8 },
            twistRadialAmplitude: { value: 0.08 },
            gridXFrequency: { value: 6 },
            gridYFrequency: { value: 6 },
            gridSharpness: { value: 0.25 },
            gridXAmplitude: { value: 0.12 },
            gridYAmplitude: { value: 0.12 },
            waveXFrequency: { value: 4 },
            waveYFrequency: { value: 5 },
            waveXAmplitude: { value: 0.18 },
            waveYAmplitude: { value: 0.12 },
            flowerPetals: { value: 6 },
            flowerAmplitude: { value: 0.22 },
            flowerDecay: { value: 0.9 },
            triangularWidth: { value: 0.04 },
            triangularHeight: { value: 0.04 },
        };
        this.material = new ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: fullscreenQuadVertexShader,
            fragmentShader: retroRadialWarpFragmentShader,
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

    setCustomWarp(fromType, toType, mix) {
        this.uniforms.customWarpFromType.value = getConcreteWarpTypeId(fromType);
        this.uniforms.customWarpToType.value = getConcreteWarpTypeId(toType);
        this.uniforms.customWarpMix.value = MathUtils.clamp(Number.isFinite(mix) ? mix : 0.5, 0, 1);
    }

    setRadialFrequency(value) {
        this.uniforms.radialFrequency.value = value;
    }

    setThetaFrequency(value) {
        this.uniforms.thetaFrequency.value = value;
    }

    setRadialSharpness(value) {
        this.uniforms.radialSharpness.value = value;
    }

    setThetaSharpness(value) {
        this.uniforms.thetaSharpness.value = value;
    }

    setRadialAmplitude(value) {
        this.uniforms.radialAmplitude.value = value;
    }

    setThetaAmplitude(value) {
        this.uniforms.thetaAmplitude.value = value;
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

    setGridXFrequency(value) {
        this.uniforms.gridXFrequency.value = value;
    }

    setGridYFrequency(value) {
        this.uniforms.gridYFrequency.value = value;
    }

    setGridSharpness(value) {
        this.uniforms.gridSharpness.value = value;
    }

    setGridXAmplitude(value) {
        this.uniforms.gridXAmplitude.value = value;
    }

    setGridYAmplitude(value) {
        this.uniforms.gridYAmplitude.value = value;
    }

    setWaveXFrequency(value) {
        this.uniforms.waveXFrequency.value = value;
    }

    setWaveYFrequency(value) {
        this.uniforms.waveYFrequency.value = value;
    }

    setWaveXAmplitude(value) {
        this.uniforms.waveXAmplitude.value = value;
    }

    setWaveYAmplitude(value) {
        this.uniforms.waveYAmplitude.value = value;
    }

    setFlowerPetals(value) {
        this.uniforms.flowerPetals.value = value;
    }

    setFlowerAmplitude(value) {
        this.uniforms.flowerAmplitude.value = value;
    }

    setFlowerDecay(value) {
        this.uniforms.flowerDecay.value = value;
    }

    setTriangularWidth(value) {
        this.uniforms.triangularWidth.value = value;
    }

    setTriangularHeight(value) {
        this.uniforms.triangularHeight.value = value;
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
