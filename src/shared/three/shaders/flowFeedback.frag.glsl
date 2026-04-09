#define ETH 0.0025

varying vec2 vUV;
uniform sampler2D tDiffuse;
uniform sampler2D tDiffuse2;
uniform float moveVelocityX;
uniform float moveVelocityY;
uniform float shouldDecline;
uniform float fadeAmount;
uniform float flowOpacityLimit;
uniform float waterfallGravity;
uniform float nonBlueShift;
uniform float whitePxDrop;
uniform float shadeFront;
uniform float waterfall;

void main() {
    vec4 tex0 = texture2D(tDiffuse2, vUV);
    vec2 move = vec2(moveVelocityX, moveVelocityY);
    if (waterfall > 0.5) {
        move = vec2(
            moveVelocityX * (1.0 + max(0.0, tex0.r + tex0.g - tex0.b) * nonBlueShift),
            moveVelocityY * (1.2 - tex0.a * whitePxDrop + (1.0 - vUV.y) * waterfallGravity)
        );
    }

    vec2 vUV2 = vUV - move;
    vec4 tex1 = texture2D(tDiffuse, vUV);
    vec4 tex2 = texture2D(tDiffuse2, vUV2);
    tex2.rgb /= max(tex2.a, 0.0001);
    tex2.a = min(tex2.a, flowOpacityLimit) - (shouldDecline > 0.0 ? fadeAmount : 0.0);

    bool frontJudge = shadeFront > 0.5
        ? tex2.a <= 0.0
        : tex1.a >= tex2.a;

    gl_FragColor = frontJudge
        || min(vUV.x, vUV.y) < ETH
        || max(vUV.x, vUV.y) > 1.0 - ETH
            ? tex1
            : tex2;
}
