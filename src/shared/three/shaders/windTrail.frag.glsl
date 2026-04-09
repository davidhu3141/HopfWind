varying vec2 vUV;
uniform sampler2D tDiffuse;
uniform sampler2D tDiffuse2;
uniform float trailShiftY;
uniform float brightClamp;
uniform float brightDecay;

void main() {
    vec2 rememberedUv = vUV;
    rememberedUv.y -= trailShiftY;

    if (vUV.y < 0.01) {
        gl_FragColor = vec4(0.0);
        return;
    }

    vec4 currentColor = texture2D(tDiffuse, vUV);
    vec4 rememberedColor = texture2D(tDiffuse2, rememberedUv);
    if (rememberedColor.r > brightClamp) {
        rememberedColor *= brightDecay;
    }

    gl_FragColor = max(currentColor, rememberedColor);
}
