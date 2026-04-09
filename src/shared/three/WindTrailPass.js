import { ShaderMaterial, WebGLRenderTarget } from 'three';
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass.js';
import fullscreenQuadVertexShader from './shaders/fullscreenQuad.vert.glsl';
import windTrailFragmentShader from './shaders/windTrail.frag.glsl';

export class WindTrailPass extends Pass {
    constructor(width, height) {
        super();

        this.width = width;
        this.height = height;
        this.count = 0;
        this.uniforms = {
            tDiffuse: { value: null },
            tDiffuse2: { value: null },
            trailShiftY: { value: 0.003 },
            brightClamp: { value: 0.7 },
            brightDecay: { value: 0.7 },
        };

        this.material = new ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: fullscreenQuadVertexShader,
            fragmentShader: windTrailFragmentShader,
        });
        this.fsQuad = new FullScreenQuad(this.material);
        this.createRenderTargets();
    }

    createRenderTargets() {
        this.remember?.dispose();
        this.remember2?.dispose();
        this.remember = new WebGLRenderTarget(this.width, this.height);
        this.remember2 = new WebGLRenderTarget(this.width, this.height);
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
