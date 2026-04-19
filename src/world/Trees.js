import * as THREE from 'three';

export class Trees {
  constructor(terrain, zones) {
    this.group = new THREE.Group();
    const rng = this._seededRng(123);

    // Shared materials
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.9 });
    const leafMats = [
      new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0x2E8B57, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0x32CD32, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0x006400, roughness: 0.8 }),
    ];
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x3CB371, roughness: 0.85 });

    // Place trees across the map, avoiding building zones centers
    for (let i = 0; i < 300; i++) {
      const x = (rng() - 0.5) * 480;
      const z = (rng() - 0.5) * 480;

      // Skip if too close to a zone center (buildings area)
      let inZone = false;
      for (const zone of zones) {
        const dx = x - zone.x;
        const dz = z - zone.z;
        if (Math.sqrt(dx * dx + dz * dz) < zone.r * 0.4) {
          inZone = true;
          break;
        }
      }
      if (inZone && rng() > 0.15) continue;

      const y = terrain.getHeightAt(x, z);
      if (y < -4 || y > 14) continue; // Skip water and peaks

      const treeType = rng();
      let tree;
      if (treeType < 0.6) {
        tree = this._createPineTree(rng, trunkMat, leafMats[Math.floor(rng() * leafMats.length)]);
      } else if (treeType < 0.85) {
        tree = this._createRoundTree(rng, trunkMat, leafMats[Math.floor(rng() * leafMats.length)]);
      } else {
        tree = this._createBush(rng, bushMat);
      }

      const scale = 0.7 + rng() * 0.8;
      tree.scale.setScalar(scale);
      tree.position.set(x, y, z);
      tree.rotation.y = rng() * Math.PI * 2;
      this.group.add(tree);
    }

    // Grass patches
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x4CAF50,
      roughness: 1,
      side: THREE.DoubleSide
    });
    for (let i = 0; i < 200; i++) {
      const x = (rng() - 0.5) * 480;
      const z = (rng() - 0.5) * 480;
      const y = terrain.getHeightAt(x, z);
      if (y < -3) continue;

      const grass = new THREE.Group();
      for (let b = 0; b < 3; b++) {
        const bladeGeo = new THREE.PlaneGeometry(0.15, 0.6 + rng() * 0.4);
        const blade = new THREE.Mesh(bladeGeo, grassMat);
        blade.position.set((rng() - 0.5) * 0.5, 0.3, (rng() - 0.5) * 0.5);
        blade.rotation.y = rng() * Math.PI;
        grass.add(blade);
      }
      grass.position.set(x, y, z);
      this.group.add(grass);
    }
  }

  _createPineTree(rng, trunkMat, leafMat) {
    const group = new THREE.Group();

    // Trunk
    const trunkH = 2 + rng() * 2;
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, trunkH, 6);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    group.add(trunk);

    // Cone layers (Fortnite-style stacked cones)
    const layers = 3;
    for (let l = 0; l < layers; l++) {
      const r = 2.5 - l * 0.6;
      const h = 2.2 - l * 0.3;
      const coneGeo = new THREE.ConeGeometry(r, h, 7);
      const cone = new THREE.Mesh(coneGeo, leafMat);
      cone.position.y = trunkH + l * 1.3 + 0.5;
      cone.castShadow = true;
      group.add(cone);
    }

    return group;
  }

  _createRoundTree(rng, trunkMat, leafMat) {
    const group = new THREE.Group();

    // Trunk
    const trunkH = 2.5 + rng() * 1.5;
    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.4, trunkH, 6);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    group.add(trunk);

    // Round canopy (multiple spheres like Fortnite)
    const canopyR = 2 + rng() * 1.5;
    const mainGeo = new THREE.SphereGeometry(canopyR, 8, 6);
    const main = new THREE.Mesh(mainGeo, leafMat);
    main.position.y = trunkH + canopyR * 0.6;
    main.castShadow = true;
    group.add(main);

    // Extra puffs
    for (let p = 0; p < 3; p++) {
      const pr = canopyR * (0.5 + rng() * 0.3);
      const pGeo = new THREE.SphereGeometry(pr, 7, 5);
      const puff = new THREE.Mesh(pGeo, leafMat);
      const angle = rng() * Math.PI * 2;
      puff.position.set(
        Math.cos(angle) * canopyR * 0.5,
        trunkH + canopyR * 0.4 + (rng() - 0.5) * canopyR * 0.4,
        Math.sin(angle) * canopyR * 0.5
      );
      puff.castShadow = true;
      group.add(puff);
    }

    return group;
  }

  _createBush(rng, mat) {
    const group = new THREE.Group();
    const puffs = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < puffs; i++) {
      const r = 0.6 + rng() * 0.8;
      const geo = new THREE.SphereGeometry(r, 7, 5);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (rng() - 0.5) * 1.2,
        r * 0.7,
        (rng() - 0.5) * 1.2
      );
      mesh.castShadow = true;
      group.add(mesh);
    }
    return group;
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
