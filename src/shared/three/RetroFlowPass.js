import * as THREE from 'three';
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass.js';
import {
    FLOW_DUAL_CORE_TYPE,
    FLOW_GRID_TYPE,
    FLOW_POLYGON_TYPE,
    FLOW_SADDLE_TYPE,
    FLOW_SWIRL_TYPE,
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
uniform float swirlTheta;
uniform float swirlStrength;
uniform float gridXFrequency;
uniform float gridYFrequency;
uniform float gridSharpness;
uniform float gridStrength;
uniform float saddleFrequency;
uniform float saddleStrength;
uniform float dualCoreDirection;
uniform float dualCoreStrength;
uniform float dualCoreDistance;
uniform float polygonSides;
uniform float polygonThetaShift;
uniform float stripThetaShift;
uniform float polygonReverseSign;
uniform float polygonTwistStrength;
uniform float polygonTwistFrequency;
uniform float polygonConcaveStrength;

const float PI = 3.141592653589793;
const float TWO_PI = 6.283185307179586;
const float FLOW_DENSITY = 55.0;

vec2 swirlField(vec2 centered) {
    return vec2(
        centered.x * cos(swirlTheta) - centered.y * sin(swirlTheta),
        centered.y * cos(swirlTheta) + centered.x * sin(swirlTheta))
    * swirlStrength
    * (1.0 + swirlBlend * sin(swirlDensity * length(centered)));
}

float gridLane(float value, float frequency, float sharpness) {
    float wave = sin(value * frequency);
    float magnitude = pow(abs(wave), max(sharpness, 0.0001));
    return sign(wave) * magnitude;
}

vec2 gridField(vec2 centered) {
    float laneX = gridLane(centered.x, gridXFrequency, gridSharpness);
    float laneY = gridLane(centered.y, gridYFrequency, gridSharpness);
    return vec2(laneY, -laneX) * gridStrength;
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

vec2 dualCoreField(vec2 centered) {
    float x = centered.x;
    float y = centered.y;
    float A = max(y * y + (x - dualCoreDistance) * (x - dualCoreDistance), 0.0001);
    float B = max(y * y + (x + dualCoreDistance) * (x + dualCoreDistance), 0.0001);
    float invA2 = 1.0 / (A * A);
    float invB2 = 1.0 / (B * B);
    vec2 directionVector = -vec2(
        (x - dualCoreDistance) * invA2 + (x + dualCoreDistance) * invB2,
        y * (invA2 + invB2)
    );
    vec2 unitDirection = directionVector / max(length(directionVector), 0.0001);

    return vec2(
        unitDirection.x * cos(dualCoreDirection) - unitDirection.y * sin(dualCoreDirection),
        unitDirection.y * cos(dualCoreDirection) + unitDirection.x * sin(dualCoreDirection)
    ) * dualCoreStrength;
}

vec2 polygonField(vec2 centered) {
    float r = length(centered);
    float theta = atan(centered.y, polygonReverseSign * centered.x);
    float n = floor(max(1.0, polygonSides));
    float singlePiece = TWO_PI / n;
    float thetaPrime = mod(theta - polygonThetaShift, TWO_PI);
    float normalizedTheta = thetaPrime / singlePiece;
    float pieceIndex = floor(normalizedTheta);
    float pieceFract = fract(normalizedTheta);
    float polygonalR = r * cos((pieceFract - 0.5) * singlePiece + stripThetaShift);
    float fieldTheta = singlePiece * (pieceIndex + 0.5)
        + 0.5 * PI
        + polygonConcaveStrength * pieceFract * (1.0 - pieceFract)
        + polygonThetaShift;
    float fieldLength = r + r * polygonTwistStrength * sin(polygonTwistFrequency * polygonalR);
    return vec2(
        polygonReverseSign * cos(fieldTheta),
        sin(fieldTheta)
    ) * fieldLength * 0.08;
}

vec2 getFlowField(float typeId, vec2 centered) {
    if (typeId < 0.5) {
        return swirlField(centered);
    }
    if (typeId < 1.5) {
        return gridField(centered);
    }
    if (typeId < 2.5) {
        return saddleField(centered);
    }
    if (typeId < 3.5) {
        return polygonField(centered);
    }
    return dualCoreField(centered);
}

void main() {
    float aspect = width / max(height, 1.0);
    vec2 centered = (vUV - center) * FLOW_DENSITY;
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
