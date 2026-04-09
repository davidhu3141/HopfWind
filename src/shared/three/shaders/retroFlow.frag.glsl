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
uniform float customFlowFromType;
uniform float customFlowToType;
uniform float customFlowMix;
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
uniform float shadeFront;

const float PI = 3.141592653589793;
const float TWO_PI = 6.283185307179586;
const float FLOW_DENSITY = 55.0;

vec2 swirlField(vec2 centered) {
    return vec2(
        centered.x * cos(swirlTheta) - centered.y * sin(swirlTheta),
        centered.y * cos(swirlTheta) + centered.x * sin(swirlTheta)
    ) * swirlStrength * (1.0 + swirlBlend * sin(swirlDensity * length(centered)));
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
    float singlePiece = TWO_PI / floor(max(1.0, polygonSides));
    float normalizedTheta = mod(
        atan(centered.y, centered.x * polygonReverseSign) - polygonThetaShift,
        TWO_PI
    ) / singlePiece;
    float pieceFract = fract(normalizedTheta);
    float polygonalR = r * cos((pieceFract - 0.5) * singlePiece + stripThetaShift);
    float fieldTheta = singlePiece * (floor(normalizedTheta) + 0.5)
        + 0.5 * PI
        + polygonConcaveStrength * pieceFract * (1.0 - pieceFract)
        + polygonThetaShift;
    float fieldLength = r + r * polygonTwistStrength * sin(polygonTwistFrequency * polygonalR);
    return vec2(
        cos(fieldTheta) * polygonReverseSign,
        sin(fieldTheta)
    ) * fieldLength * 0.08;
}

vec2 getConcreteFlowField(float typeId, vec2 centered) {
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

vec2 getFlowField(float typeId, vec2 centered) {
    if (typeId < 4.5) {
        return getConcreteFlowField(typeId, centered);
    }
    return mix(
        getConcreteFlowField(customFlowFromType, centered),
        getConcreteFlowField(customFlowToType, centered),
        customFlowMix
    );
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

    bool frontJudge = shadeFront > 0.5
        ? tex2.a <= 0.0
        : tex1.a >= tex2.a;
    gl_FragColor = frontJudge ? tex1 : tex2;
}
