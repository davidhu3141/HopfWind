import { MathUtils, NearestFilter, RGBAFormat, ShaderMaterial, UniformsUtils, Vector2, WebGLRenderTarget } from 'three';
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass.js';
import {
    FLOW_CUSTOM_TYPE,
    FLOW_DUAL_CORE_TYPE,
    FLOW_GRID_TYPE,
    FLOW_POLYGON_TYPE,
    FLOW_SADDLE_TYPE,
    FLOW_SWIRL_TYPE,
} from '../../wallpapers/retro-flow/constants.js';
import fullscreenQuadVertexShader from './shaders/fullscreenQuad.vert.glsl';
import retroFlowFragmentShader from './shaders/retroFlow.frag.glsl';

function getConcreteFlowTypeId(type) {
    switch (type) {
        case FLOW_GRID_TYPE:
            return 1;
        case FLOW_SADDLE_TYPE:
            return 2;
        case FLOW_POLYGON_TYPE:
            return 3;
        case FLOW_DUAL_CORE_TYPE:
            return 4;
        case FLOW_SWIRL_TYPE:
        default:
            return 0;
    }
}

function getFlowTypeId(type) {
    if (type === FLOW_CUSTOM_TYPE) {
        return 5;
    }
    return getConcreteFlowTypeId(type);
}

export class RetroFlowPass extends Pass {
    constructor(width, height, params = {}) {
        super();

        this.width = width;
        this.height = height;
        this.count = 0;
        this._velocity = 1 / 255;
        this._moveDir = 0.7;
        this._filter = NearestFilter;
        this._shadeFront = false;

        this.uniforms = UniformsUtils.clone({
            tDiffuse: { value: null },
            tDiffuse2: { value: null },
            center: { value: new Vector2(0.5, 0.5) },
            width: { value: width },
            height: { value: height },
            moveVelocityX: { value: 0 },
            fadeAmount: { value: 0.0025 },
            flowOpacityLimit: { value: 0.9 },
            flowFromType: { value: 0 },
            flowToType: { value: 0 },
            flowTypeMix: { value: 0 },
            customFlowFromType: { value: 0 },
            customFlowToType: { value: 1 },
            customFlowMix: { value: 0.5 },
            swirlBlend: { value: 0 },
            swirlDensity: { value: 55 },
            swirlTheta: { value: 0.1 },
            swirlStrength: { value: 1 },
            gridXFrequency: { value: 1.7 },
            gridYFrequency: { value: 1.7 },
            gridSharpness: { value: 0.22 },
            gridStrength: { value: 0.45 },
            saddleFrequency: { value: 1.6 },
            saddleStrength: { value: 0.5 },
            dualCoreDirection: { value: 0.42 },
            dualCoreStrength: { value: 0.18 },
            dualCoreDistance: { value: 15 },
            polygonSides: { value: 6 },
            polygonThetaShift: { value: 0 },
            stripThetaShift: { value: 0 },
            polygonReverseSign: { value: 1 },
            polygonTwistStrength: { value: 0.4 },
            polygonTwistFrequency: { value: 1 },
            polygonConcaveStrength: { value: 0.4 },
            shadeFront: { value: 0 },
        });

        this.material = new ShaderMaterial({
            transparent: true,
            uniforms: this.uniforms,
            vertexShader: fullscreenQuadVertexShader,
            fragmentShader: retroFlowFragmentShader,
        });
        this.uniforms.shadeFront.value = this._shadeFront ? 1 : 0;
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
        this.remember = new WebGLRenderTarget(this.width, this.height, {
            minFilter: filter,
            magFilter: filter,
            format: RGBAFormat,
            stencilBuffer: false,
        });
        this.remember2 = new WebGLRenderTarget(this.width, this.height, {
            minFilter: filter,
            magFilter: filter,
            format: RGBAFormat,
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
        this.uniforms.shadeFront.value = value ? 1 : 0;
    }

    setMoveDir(value) {
        this._moveDir = value;
        this.uniforms.moveVelocityX.value = this._velocity * 1;
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

    setFlowInterpolation(fromType, toType, mix) {
        this.uniforms.flowFromType.value = getFlowTypeId(fromType);
        this.uniforms.flowToType.value = getFlowTypeId(toType);
        this.uniforms.flowTypeMix.value = mix;
    }

    setCustomFlow(fromType, toType, mix) {
        this.uniforms.customFlowFromType.value = getConcreteFlowTypeId(fromType);
        this.uniforms.customFlowToType.value = getConcreteFlowTypeId(toType);
        this.uniforms.customFlowMix.value = MathUtils.clamp(Number.isFinite(mix) ? mix : 0.5, 0, 1);
    }

    setSwirlBlend(value) {
        this.uniforms.swirlBlend.value = value;
    }

    setSwirlDensity(value) {
        this.uniforms.swirlDensity.value = value;
    }

    setSwirlTheta(value) {
        this.uniforms.swirlTheta.value = value;
    }

    setSwirlStrength(value) {
        this.uniforms.swirlStrength.value = value;
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

    setGridStrength(value) {
        this.uniforms.gridStrength.value = value;
    }

    setSaddleFrequency(value) {
        this.uniforms.saddleFrequency.value = value;
    }

    setSaddleStrength(value) {
        this.uniforms.saddleStrength.value = value;
    }

    setDualCoreDirection(value) {
        this.uniforms.dualCoreDirection.value = value;
    }

    setDualCoreStrength(value) {
        this.uniforms.dualCoreStrength.value = value;
    }

    setDualCoreDistance(value) {
        this.uniforms.dualCoreDistance.value = value;
    }

    setPolygonSides(value) {
        this.uniforms.polygonSides.value = value;
    }

    setPolygonThetaShift(value) {
        this.uniforms.polygonThetaShift.value = value;
    }

    setStripThetaShift(value) {
        this.uniforms.stripThetaShift.value = value;
    }

    setPolygonReverse(value) {
        this.uniforms.polygonReverseSign.value = value ? -1 : 1;
    }

    setPolygonTwistStrength(value) {
        this.uniforms.polygonTwistStrength.value = value;
    }

    setPolygonTwistFrequency(value) {
        this.uniforms.polygonTwistFrequency.value = value;
    }

    setPolygonConcaveStrength(value) {
        this.uniforms.polygonConcaveStrength.value = value;
    }

    setCenter(x, y) {
        this.uniforms.center.value.set(x, y);
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
