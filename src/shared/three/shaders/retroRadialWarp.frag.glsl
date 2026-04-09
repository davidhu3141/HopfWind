varying vec2 vUV;
uniform sampler2D tDiffuse;
uniform float aspect;
uniform vec2 center;
uniform float warpFromType;
uniform float warpToType;
uniform float warpTypeMix;
uniform float customWarpFromType;
uniform float customWarpToType;
uniform float customWarpMix;
uniform float radialFrequency;
uniform float thetaFrequency;
uniform float radialSharpness;
uniform float thetaSharpness;
uniform float radialAmplitude;
uniform float thetaAmplitude;
uniform float twistAmount;
uniform float twistDecay;
uniform float twistRadialFrequency;
uniform float twistRadialAmplitude;
uniform float gridXFrequency;
uniform float gridYFrequency;
uniform float gridSharpness;
uniform float gridXAmplitude;
uniform float gridYAmplitude;
uniform float waveXFrequency;
uniform float waveYFrequency;
uniform float waveXAmplitude;
uniform float waveYAmplitude;
uniform float flowerPetals;
uniform float flowerAmplitude;
uniform float flowerDecay;
uniform float triangularWidth;
uniform float triangularHeight;

float gridLane(float value, float frequency, float sharpness) {
    float wave = sin(value * frequency);
    float magnitude = pow(abs(wave), max(sharpness, 0.0001));
    return sign(wave) * magnitude;
}

vec2 radialWarp(vec2 centered) {
    float r = length(centered);
    float theta = atan(centered.y, centered.x);
    float radialLane = gridLane(r, radialFrequency, radialSharpness);
    float thetaLane = gridLane(theta, thetaFrequency, thetaSharpness);
    float sampleR = max(0.0, r + radialLane * radialAmplitude);
    float sampleTheta = theta + thetaLane * thetaAmplitude;
    return vec2(cos(sampleTheta), sin(sampleTheta)) * sampleR;
}

vec2 twistWarp(vec2 centered) {
    float r = length(centered);
    float theta = atan(centered.y, centered.x);
    float sampleTheta = theta + twistAmount * exp(-twistDecay * r * r);
    float sampleR = r + sin(twistRadialFrequency * r) * twistRadialAmplitude;
    return vec2(cos(sampleTheta), sin(sampleTheta)) * sampleR;
}

vec2 gridWarp(vec2 centered) {
    return centered + vec2(
        gridLane(centered.x, gridXFrequency, gridSharpness) * gridXAmplitude,
        gridLane(centered.y, gridYFrequency, gridSharpness) * gridYAmplitude
    );
}

vec2 waveWarp(vec2 centered) {
    return centered + vec2(
        sin(centered.y * waveYFrequency) * waveXAmplitude,
        sin(centered.x * waveXFrequency) * waveYAmplitude
    );
}

vec2 flowerWarp(vec2 centered) {
    float r = length(centered);
    float theta = atan(centered.y, centered.x);
    float petalOffset = cos(theta * flowerPetals) * flowerAmplitude * exp(-flowerDecay * r * r);
    float sampleR = r + petalOffset;
    return vec2(cos(theta), sin(theta)) * sampleR;
}

vec2 triangularWarp(vec2 centered) {
    float w = max(triangularWidth, 0.0001);
    float h = max(triangularHeight, 0.0001);
    float yslanted = centered.y / h / 0.886;
    float xslanted = centered.x / w + yslanted * 0.5;
    float yIndex = floor(yslanted);
    float yFract = fract(yslanted);
    float xFract = fract(xslanted);
    float xIndex = floor(min(1.5, xFract / yFract)) + 2.0 * floor(xslanted);
    return vec2((xIndex + 0.25 - yIndex) * w * 0.5, (yIndex + 0.5) * h * 0.886);
}

vec2 getConcreteWarped(float typeId, vec2 centered) {
    if (typeId < 0.5) {
        return centered;
    }
    if (typeId < 1.5) {
        return radialWarp(centered);
    }
    if (typeId < 2.5) {
        return twistWarp(centered);
    }
    if (typeId < 3.5) {
        return gridWarp(centered);
    }
    if (typeId < 4.5) {
        return waveWarp(centered);
    }
    if (typeId < 5.5) {
        return flowerWarp(centered);
    }
    return triangularWarp(centered);
}

vec2 getWarped(float typeId, vec2 centered) {
    if (typeId < 6.5) {
        return getConcreteWarped(typeId, centered);
    }
    return mix(
        getConcreteWarped(customWarpFromType, centered),
        getConcreteWarped(customWarpToType, centered),
        customWarpMix
    );
}

vec2 getWarpUv(float typeId, vec2 centered) {
    vec2 warped = getWarped(typeId, centered);
    warped.x /= aspect;
    return warped * 0.5 + center;
}

void main() {
    vec2 centered = (vUV - center) * 2.0;
    centered.x *= aspect;

    vec2 fromUv = getWarpUv(warpFromType, centered);
    vec2 toUv = getWarpUv(warpToType, centered);
    vec2 sampleUv = fract(mix(fromUv, toUv, warpTypeMix));
    gl_FragColor = texture2D(tDiffuse, sampleUv);
}
