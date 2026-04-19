import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Color grading shader - warm Fortnite look
const ColorGradingShader = {
  uniforms: {
    tDiffuse: { value: null },
    brightness: { value: 0.02 },
    contrast: { value: 1.08 },
    saturation: { value: 1.15 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float brightness;
    uniform float contrast;
    uniform float saturation;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      // Brightness
      color.rgb += brightness;
      // Contrast
      color.rgb = (color.rgb - 0.5) * contrast + 0.5;
      // Saturation
      float grey = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      color.rgb = mix(vec3(grey), color.rgb, saturation);
      // Slight warm tint
      color.r *= 1.02;
      color.b *= 0.97;
      // Vignette
      float dist = distance(vUv, vec2(0.5));
      color.rgb *= smoothstep(0.9, 0.4, dist);

      gl_FragColor = color;
    }
  `
};

export class PostProcessing {
  constructor(renderer, scene, camera) {
    this.composer = new EffectComposer(renderer);

    // Render pass
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // Bloom - subtle glow on bright objects
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.25,  // strength
      0.6,   // radius
      0.85   // threshold
    );
    this.composer.addPass(bloomPass);
    this.bloomPass = bloomPass;

    // Color grading
    const colorPass = new ShaderPass(ColorGradingShader);
    this.composer.addPass(colorPass);
  }

  render() {
    this.composer.render();
  }

  resize(w, h) {
    this.composer.setSize(w, h);
  }
}
