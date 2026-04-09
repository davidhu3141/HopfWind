import { NearestFilter, RGBAFormat, ShaderMaterial, UniformsUtils, WebGLRenderTarget } from 'three';
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass.js';
import fullscreenQuadVertexShader from './shaders/fullscreenQuad.vert.glsl';
import flowFeedbackFragmentShader from './shaders/flowFeedback.frag.glsl';

export class FlowFeedbackPass extends Pass {
    constructor(width, height, params = {}) {
        super();

        this.width = width;
        this.height = height;
        this.count = 0;
        this._velocity = 1 / 255;
        this._moveDir = 0.7;
        this._applyFadingPerNFrames = 1;
        this._filter = NearestFilter;
        this._shadeFront = false;
        this._waterfall = false;

        this.uniforms = UniformsUtils.clone({
            tDiffuse: { value: null },
            tDiffuse2: { value: null },
            width: { value: width },
            height: { value: height },
            moveVelocityX: { value: 0 },
            moveVelocityY: { value: 1 / 255 },
            shouldDecline: { value: 1 },
            fadeAmount: { value: 0.0025 },
            flowOpacityLimit: { value: 0.9 },
            waterfallGravity: { value: 0 },
            nonBlueShift: { value: 0 },
            whitePxDrop: { value: 0 },
            shadeFront: { value: 0 },
            waterfall: { value: 0 },
        });

        this.material = new ShaderMaterial({
            transparent: true,
            uniforms: this.uniforms,
            vertexShader: fullscreenQuadVertexShader,
            fragmentShader: flowFeedbackFragmentShader,
        });
        this.uniforms.shadeFront.value = this._shadeFront ? 1 : 0;
        this.uniforms.waterfall.value = this._waterfall ? 1 : 0;
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

    setWaterfall(value) {
        if (this._waterfall === value) {
            return;
        }
        this._waterfall = value;
        this.uniforms.waterfall.value = value ? 1 : 0;
    }

    setWaterfallGravity(value) {
        this.uniforms.waterfallGravity.value = value;
    }

    setNonBlueShift(value) {
        this.uniforms.nonBlueShift.value = value;
    }

    setWhitePxDrop(value) {
        this.uniforms.whitePxDrop.value = value;
    }

    setMoveDir(value) {
        this._moveDir = value;
        this.uniforms.moveVelocityX.value = this._velocity * Math.cos(this._moveDir);
        this.uniforms.moveVelocityY.value = this._velocity * Math.sin(this._moveDir);
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
