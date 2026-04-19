import * as THREE from 'three';

export class Rocks {
  constructor(terrain) {
    this.group = new THREE.Group();
    const rng = this._seededRng(777);

    const rockMats = [
      new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.95, flatShading: true }),
      new THREE.MeshStandardMaterial({ color: 0x777766, roughness: 0.95, flatShading: true }),
      new THREE.MeshStandardMaterial({ color: 0x666655, roughness: 0.95, flatShading: true }),
    ];

    for (let i = 0; i < 120; i++) {
      const x = (rng() - 0.5) * 460;
      const z = (rng() - 0.5) * 460;
      const y = terrain.getHeightAt(x, z);
      if (y < -4) continue;

      const rock = this._createRock(rng, rockMats[Math.floor(rng() * rockMats.length)]);
      const scale = 0.4 + rng() * 2;
      rock.scale.set(scale, scale * (0.5 + rng() * 0.7), scale);
      rock.position.set(x, y - 0.2, z);
      rock.rotation.set(rng() * 0.3, rng() * Math.PI * 2, rng() * 0.3);
      this.group.add(rock);
    }
  }

  _createRock(rng, mat) {
    // Deformed sphere = organic rock shape
    const geo = new THREE.DodecahedronGeometry(1, 1);
    const verts = geo.attributes.position.array;
    for (let i = 0; i < verts.length; i += 3) {
      verts[i] += (rng() - 0.5) * 0.3;
      verts[i + 1] += (rng() - 0.5) * 0.2;
      verts[i + 2] += (rng() - 0.5) * 0.3;
    }
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  _seededRng(seed) {
    let s = seed;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return s / 2147483647;
    };
  }

  addToScene(scene) {
    scene.add(this.group);
  }
}
