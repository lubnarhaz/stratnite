import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export class Terrain {
  constructor() {
    this.size = 512;
    this.segments = 128;
    this.noise = createNoise2D();
    this.noise2 = createNoise2D();

    const geo = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    geo.rotateX(-Math.PI / 2);

    const vertices = geo.attributes.position.array;
    const colors = new Float32Array(vertices.length);

    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      const h = this._getNoiseHeight(x, z);
      vertices[i + 1] = h;

      // Vertex colors: green grass with variation
      const grassVar = 0.15 + this.noise2(x * 0.02, z * 0.02) * 0.1;
      if (h > 12) {
        // Rocky peaks - grey/brown
        colors[i] = 0.45 + grassVar;
        colors[i + 1] = 0.4 + grassVar * 0.5;
        colors[i + 2] = 0.35;
      } else if (h > 6) {
        // Higher ground - darker green
        colors[i] = 0.2 + grassVar * 0.3;
        colors[i + 1] = 0.5 + grassVar;
        colors[i + 2] = 0.15;
      } else if (h < -3) {
        // Low areas - sandy/dirt
        colors[i] = 0.6 + grassVar;
        colors[i + 1] = 0.5 + grassVar * 0.8;
        colors[i + 2] = 0.3;
      } else {
        // Normal grass - vibrant green
        colors[i] = 0.25 + grassVar * 0.4;
        colors[i + 1] = 0.6 + grassVar;
        colors[i + 2] = 0.12 + grassVar * 0.2;
      }
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0,
      flatShading: false
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.receiveShadow = true;
  }

  _getNoiseHeight(x, z) {
    let h = 0;
    let freq = 0.006;
    let amp = 16;
    for (let o = 0; o < 4; o++) {
      h += this.noise(x * freq, z * freq) * amp;
      freq *= 2.2;
      amp *= 0.45;
    }
    return h;
  }

  getHeightAt(x, z) {
    const halfSize = this.size / 2;
    const cx = Math.max(-halfSize, Math.min(halfSize, x));
    const cz = Math.max(-halfSize, Math.min(halfSize, z));
    return this._getNoiseHeight(cx, cz);
  }

  addToScene(scene) {
    scene.add(this.mesh);
  }
}
