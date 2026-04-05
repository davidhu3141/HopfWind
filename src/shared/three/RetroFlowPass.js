import * as THREE from 'three';
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass.js';
import {
    FLOW_PINCH_TYPE,
    FLOW_SADDLE_TYPE,
    FLOW_SINE_TYPE,
    FLOW_SWIRL_TYPE,
    FLOW_VORTEX_TYPE,
} from '../../wallpapers/retro-flow/constants.js';

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
varying vec2 vUV;
uniform sampler2D tDiffuse;
uniform sampler2D tDiffuse2;
uniform vec2 center;
uniform float width;
uniform float height;
uniform float moveVelocityX;
uniform float fadeAmount;
uniform float flowOpacityLimit;
uniform float flowFromType;
uniform float flowToType;
uniform float flowTypeMix;
uniform float swirlBlend;
uniform float swirlDensity;
uniform float sineXFrequency;
uniform float sineYFrequency;
uniform float sineStrength;
uniform float vortexFrequency;
uniform float vortexStrength;
uniform float pinchFrequency;
uniform float pinchStrength;
uniform float saddleFrequency;
uniform float saddleStrength;

vec2 swirlField(vec2 centered) {
    float x = centered.x;
    float y = centered.y;
    vec2 oldField = vec2(y + 0.5 * x, -x + 0.5 * y) * 0.1;
    float t = (cos(x) + cos(y) + 2.0) / 4.0;
    t = pow(t, 0.18);
    vec2 mv1 = -vec2(-sin(x), -sin(y));
    vec2 mv2 = vec2(sin(y), -sin(x));
    vec2 newField = mv1 * (1.0 - t) + mv2 * t;
    return mix(oldField, newField, swirlBlend);
}

vec2 sineField(vec2 centered) {
    return vec2(
        sin(centered.y * sineYFrequency),
        -sin(centered.x * sineXFrequency)
    ) * sineStrength;
}

vec2 vortexField(vec2 centered) {
    float radius = max(length(centered), 0.4);
    vec2 orbit = vec2(-centered.y, centered.x) / radius;
    vec2 ripple = vec2(
        cos(centered.y * vortexFrequency),
        sin(centered.x * vortexFrequency)
    );
    return (orbit + 0.35 * ripple) * vortexStrength;
}

vec2 pinchField(vec2 centered) {
    float radius = max(length(centered), 0.4);
    vec2 radial = -centered / radius;
    vec2 ripple = vec2(
        cos(radius * pinchFrequency),
        sin(radius * pinchFrequency)
    );
    return (radial + 0.3 * ripple) * pinchStrength;
}

vec2 saddleField(vec2 centered) {
    float radius = max(length(centered), 0.6);
    vec2 base = vec2(centered.x, -centered.y) / radius;
    vec2 ripple = vec2(
        sin(centered.x * saddleFrequency),
        sin(centered.y * saddleFrequency)
    );
    return (base + 0.25 * ripple) * saddleStrength;
}

vec2 getFlowField(float typeId, vec2 centered) {
    if (typeId < 0.5) {
        return swirlField(centered);
    }
    if (typeId < 1.5) {
        return sineField(centered);
    }
    if (typeId < 2.5) {
        return vortexField(centered);
    }
    if (typeId < 3.5) {
        return pinchField(centered);
    }
    return saddleField(centered);
}

void main() {
    float aspect = width / max(height, 1.0);
    vec2 centered = (vUV - center) * swirlDensity;
    centered.x *= aspect;

    vec2 fromField = getFlowField(flowFromType, centered);
    vec2 toField = getFlowField(flowToType, centered);
    vec2 flowField = mix(fromField, toField, flowTypeMix);
    flowField.x /= aspect;
    vec2 vUV2 = fract(vUV - moveVelocityX * flowField);

    vec4 tex1 = texture2D(tDiffuse, vUV);
    vec4 tex2 = texture2D(tDiffuse2, vUV2);
    tex1.a = min(tex1.a, 1.0);
    tex2.rgb /= max(tex2.a, 0.0001);
    tex2.a = min(tex2.a, flowOpacityLimit) - fadeAmount;
    gl_FragColor = ${frontJudge} ? tex1 : tex2;
}`;
}

function getFlowTypeId(type) {
    switch (type) {
        case FLOW_SINE_TYPE:
            return 1;
        case FLOW_VORTEX_TYPE:
            return 2;
        case FLOW_PINCH_TYPE:
            return 3;
        case FLOW_SADDLE_TYPE:
            return 4;
        case FLOW_SWIRL_TYPE:
        default:
            return 0;
    }
}

export class RetroFlowPass extends Pass {
    constructor(width, height, params = {}) {
        super();

        this.width = width;
        this.height = height;
        this.count = 0;
        this._velocity = 1 / 255;
        this._moveDir = 0.7;
        this._filter = THREE.NearestFilter;
        this._shadeFront = false;

        this.uniforms = THREE.UniformsUtils.clone({
            tDiffuse: { value: null },
            tDiffuse2: { value: null },
            center: { value: new THREE.Vector2(0.5, 0.5) },
            width: { value: width },
            height: { value: height },
            moveVelocityX: { value: 0 },
            fadeAmount: { value: 0.0025 },
            flowOpacityLimit: { value: 0.9 },
            flowFromType: { value: 0 },
            flowToType: { value: 0 },
            flowTypeMix: { value: 0 },
            swirlBlend: { value: 0 },
            swirlDensity: { value: 55 },
            sineXFrequency: { value: 1.2 },
            sineYFrequency: { value: 1.2 },
            sineStrength: { value: 0.35 },
            vortexFrequency: { value: 1.5 },
            vortexStrength: { value: 0.6 },
            pinchFrequency: { value: 1.8 },
            pinchStrength: { value: 0.55 },
            saddleFrequency: { value: 1.6 },
            saddleStrength: { value: 0.5 },
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

    setSwirlBlend(value) {
        this.uniforms.swirlBlend.value = value;
    }

    setSwirlDensity(value) {
        this.uniforms.swirlDensity.value = value;
    }

    setSineXFrequency(value) {
        this.uniforms.sineXFrequency.value = value;
    }

    setSineYFrequency(value) {
        this.uniforms.sineYFrequency.value = value;
    }

    setSineStrength(value) {
        this.uniforms.sineStrength.value = value;
    }

    setVortexFrequency(value) {
        this.uniforms.vortexFrequency.value = value;
    }

    setVortexStrength(value) {
        this.uniforms.vortexStrength.value = value;
    }

    setPinchFrequency(value) {
        this.uniforms.pinchFrequency.value = value;
    }

    setPinchStrength(value) {
        this.uniforms.pinchStrength.value = value;
    }

    setSaddleFrequency(value) {
        this.uniforms.saddleFrequency.value = value;
    }

    setSaddleStrength(value) {
        this.uniforms.saddleStrength.value = value;
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
