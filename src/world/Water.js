import * as THREE from 'three';

export class Water {
  constructor() {
    // Large water plane surrounding the island
    const geo = new THREE.PlaneGeometry(2000, 2000, 64, 64);
    geo.rotateX(-Math.PI / 2);

    // Subtle waves in geometry
    const verts = geo.attributes.position.array;
    this._baseY = new Float32Array(verts.length / 3);
    for (let i = 0; i < verts.length; i += 3) {
      this._baseY[i / 3] = 0;
      verts[i + 1] = -6; // Water level
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a7aad,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.85,
      envMapIntensity: 1.5,
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.receiveShadow = true;
    this._geo = geo;
    this._time = 0;

    // Foam ring around island edge
    const foamGeo = new THREE.RingGeometry(240, 265, 64);
    foamGeo.rotateX(-Math.PI / 2);
    const foamMat = new THREE.MeshBasicMaterial({
      color: 0xcceeee,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.foam = new THREE.Mesh(foamGeo, foamMat);
    this.foam.position.y = -5.5;
  }

  update(dt) {
    this._time += dt;
    const verts = this._geo.attributes.position.array;
    for (let i = 0; i < verts.length; i += 3) {
      const x = verts[i];
      const z = verts[i + 2];
      verts[i + 1] = -6 + Math.sin(x * 0.02 + this._time * 0.8) * 0.3
                        + Math.cos(z * 0.015 + this._time * 0.6) * 0.25;
    }
    this._geo.attributes.position.needsUpdate = true;
    this._geo.computeVertexNormals();

    // Animate foam
    this.foam.material.opacity = 0.2 + Math.sin(this._time * 0.5) * 0.1;
  }

  addToScene(scene) {
    scene.add(this.mesh);
    scene.add(this.foam);
  }
}
