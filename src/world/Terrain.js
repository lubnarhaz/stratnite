import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export class Terrain {
  constructor() {
    this.size = 512;
    this.segments = 128;
    this.noise = createNoise2D();
    this.heightData = [];

    const geo = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    geo.rotateX(-Math.PI / 2);

    const vertices = geo.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      const h = this._getNoiseHeight(x, z);
      vertices[i + 1] = h;
    }
    geo.computeVertexNormals();

    // Store height data for lookup
    this._buildHeightMap(vertices);

    const mat = new THREE.MeshStandardMaterial({
      color: 0x2a3a1a,
      roughness: 1,
      metalness: 0,
      flatShading: true
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.receiveShadow = true;
  }

  _getNoiseHeight(x, z) {
    let h = 0;
    let freq = 0.008;
    let amp = 18;
    for (let o = 0; o < 4; o++) {
      h += this.noise(x * freq, z * freq) * amp;
      freq *= 2;
      amp *= 0.5;
    }
    return h;
  }

  _buildHeightMap(vertices) {
    this._vertices = vertices;
    this._geo = { segments: this.segments, size: this.size };
  }

  getHeightAt(x, z) {
    // Clamp to terrain bounds
    const halfSize = this.size / 2;
    const cx = Math.max(-halfSize, Math.min(halfSize, x));
    const cz = Math.max(-halfSize, Math.min(halfSize, z));

    // Use noise directly for accurate height
    return this._getNoiseHeight(cx, cz);
  }

  addToScene(scene) {
    scene.add(this.mesh);
  }
}
