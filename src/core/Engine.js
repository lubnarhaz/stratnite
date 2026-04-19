import * as THREE from 'three';
import { PostProcessing } from './PostProcessing.js';

export class Engine {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x87ceeb); // Sky blue clear

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
    this.camera.position.set(0, 10, 20);

    this.scene = new THREE.Scene();
    // Light blue fog for depth/atmosphere like Fortnite
    this.scene.fog = new THREE.FogExp2(0xa8c8e8, 0.0012);

    // Bright daytime lighting
    const ambient = new THREE.AmbientLight(0x8899bb, 0.6);
    this.scene.add(ambient);

    // Sun light - warm directional
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.5);
    sun.position.set(100, 200, 80);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 500;
    sun.shadow.camera.left = -200;
    sun.shadow.camera.right = 200;
    sun.shadow.camera.top = 200;
    sun.shadow.camera.bottom = -200;
    sun.shadow.bias = -0.001;
    this.scene.add(sun);

    // Hemisphere - sky blue + ground green
    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x44aa44, 0.5);
    this.scene.add(hemi);

    // Fill light from opposite side
    const fill = new THREE.DirectionalLight(0xaaccff, 0.3);
    fill.position.set(-80, 60, -60);
    this.scene.add(fill);
  }

  initPostProcessing() {
    this.postProcessing = new PostProcessing(this.renderer, this.scene, this.camera);
  }

  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.postProcessing) this.postProcessing.resize(w, h);
  }

  render() {
    if (this.postProcessing) {
      this.postProcessing.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
