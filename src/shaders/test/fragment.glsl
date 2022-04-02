uniform sampler2D uTexture;
uniform sampler2D uDataTexture;
uniform vec4 uResolution;
uniform float uTime;
varying vec2 vUv;

void main() {
    vec2 newUV = (vUv - vec2(0.5))*uResolution.zw + vec2(0.5);
    vec4 color = texture2D(uTexture, newUV);
    vec4 offset = texture2D(uDataTexture, vUv);
    gl_FragColor = color;
    gl_FragColor = offset;
    gl_FragColor = texture2D(uTexture, newUV - 0.01 * offset.rg);
}