import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export class Terrain {
  constructor() {
    this.size = 512;
    this.segments = 200;
    this.noise = createNoise2D();
    this.noise2 = createNoise2D();
    this.noise3 = createNoise2D();

    const geo = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    geo.rotateX(-Math.PI / 2);

    const vertices = geo.attributes.position.array;
    const colors = new Float32Array(vertices.length);
    const uvs = geo.attributes.uv.array;

    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      const h = this._getNoiseHeight(x, z);
      vertices[i + 1] = h;

      // Rich vertex coloring with micro detail
      const detail = this.noise3(x * 0.1, z * 0.1) * 0.08;
      const macro = this.noise2(x * 0.005, z * 0.005);

      if (h > 14) {
        // Snow caps
        colors[i] = 0.88 + detail; colors[i+1] = 0.9 + detail; colors[i+2] = 0.92;
      } else if (h > 10) {
        // Rocky
        const t = (h - 10) / 4;
        colors[i] = 0.42 + detail + t * 0.3;
        colors[i+1] = 0.4 + detail * 0.6 + t * 0.35;
        colors[i+2] = 0.35 + t * 0.4;
      } else if (h < -5) {
        // Beach sand
        colors[i] = 0.76 + detail; colors[i+1] = 0.7 + detail; colors[i+2] = 0.5;
      } else if (h < -2) {
        // Dirt / sand transition
        const t = (h + 5) / 3;
        colors[i] = 0.76 - t * 0.45 + detail;
        colors[i+1] = 0.7 - t * 0.15 + detail;
        colors[i+2] = 0.5 - t * 0.25;
      } else {
        // Lush grass with variation
        const grassType = macro;
        if (grassType > 0.3) {
          // Light green meadow
          colors[i] = 0.28 + detail * 2; colors[i+1] = 0.62 + detail; colors[i+2] = 0.15 + detail;
        } else if (grassType > -0.2) {
          // Standard green
          colors[i] = 0.2 + detail; colors[i+1] = 0.55 + detail; colors[i+2] = 0.12;
        } else {
          // Dark forest green
          colors[i] = 0.12 + detail; colors[i+1] = 0.42 + detail; colors[i+2] = 0.08;
        }
      }
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    // Procedural grass texture via canvas
    const texCanvas = document.createElement('canvas');
    texCanvas.width = 512; texCanvas.height = 512;
    const ctx = texCanvas.getContext('2d');
    // Base green
    ctx.fillStyle = '#4a8c3f';
    ctx.fillRect(0, 0, 512, 512);
    // Noise detail
    for (let y = 0; y < 512; y += 2) {
      for (let x = 0; x < 512; x += 2) {
        const r = Math.random();
        const g = 80 + Math.floor(r * 60);
        ctx.fillStyle = `rgb(${40 + Math.floor(r*30)},${g},${20 + Math.floor(r*20)})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }
    const texture = new THREE.CanvasTexture(texCanvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(80, 80);
    texture.colorSpace = THREE.SRGBColorSpace;

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      map: texture,
      roughness: 0.92,
      metalness: 0,
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.receiveShadow = true;
  }

  _getNoiseHeight(x, z) {
    let h = 0;
    let freq = 0.005;
    let amp = 18;
    for (let o = 0; o < 5; o++) {
      h += this.noise(x * freq, z * freq) * amp;
      freq *= 2.1;
      amp *= 0.42;
    }
    // Island shape - lower edges
    const distFromCenter = Math.sqrt(x * x + z * z);
    const edgeFalloff = Math.max(0, 1 - Math.pow(distFromCenter / 260, 3));
    h = h * edgeFalloff - (1 - edgeFalloff) * 8;
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
