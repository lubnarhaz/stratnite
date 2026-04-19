import * as THREE from 'three';

const ZONE_COLORS = {
  'MÉGA-CITÉ':      { wall: 0x1a1a3a, window: 0x00ffcc },
  'CYBER PARK':     { wall: 0x1a3a1a, window: 0x44ff88 },
  'GRID STATION':   { wall: 0x3a2a0a, window: 0xffaa00 },
  'NEON STRIP':     { wall: 0x2a0a3a, window: 0xff44ff },
  'TECH LABS':      { wall: 0x0a2a3a, window: 0x0088ff },
  'VOID FOREST':    { wall: 0x0a1a0a, window: null },
  'PULSE HARBOR':   { wall: 0x0a1a2a, window: 0x00aaff },
  'DATA HAVEN':     { wall: 0x1a1a2a, window: 0xaaaaff },
  'ALPHA BASE':     { wall: 0x2a1a1a, window: 0xff4444 },
  'ZERO POINT':     { wall: 0x1a0a2a, window: 0xffffff },
};

export class Buildings {
  constructor(terrain, zones) {
    this.group = new THREE.Group();
    this.terrain = terrain;
    this._buildAll(zones);
  }

  _buildAll(zones) {
    const rng = this._seededRng(42);

    for (const zone of zones) {
      const colors = ZONE_COLORS[zone.name] || { wall: 0x222222, window: 0x00ff00 };
      const count = zone.type === 'forest' ? 3 : zone.type === 'center' ? 5 : 8 + Math.floor(rng() * 6);

      for (let i = 0; i < count; i++) {
        const angle = rng() * Math.PI * 2;
        const dist = rng() * zone.r * 0.8;
        const bx = zone.x + Math.cos(angle) * dist;
        const bz = zone.z + Math.sin(angle) * dist;
        const by = this.terrain.getHeightAt(bx, bz);

        const building = this._createBuilding(rng, colors, zone.type);
        building.position.set(bx, by, bz);
        this.group.add(building);
      }
    }
  }

  _createBuilding(rng, colors, type) {
    const group = new THREE.Group();
    const floors = 1 + Math.floor(rng() * 4);
    const w = 3 + rng() * 6;
    const d = 3 + rng() * 6;
    const floorH = 3 + rng() * 2;

    const wallMat = new THREE.MeshStandardMaterial({
      color: colors.wall,
      roughness: 0.9,
      metalness: 0.1
    });

    for (let f = 0; f < floors; f++) {
      const geo = new THREE.BoxGeometry(w, floorH, d);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.y = f * floorH + floorH / 2;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      // Windows
      if (colors.window !== null) {
        const winMat = new THREE.MeshStandardMaterial({
          color: colors.window,
          emissive: colors.window,
          emissiveIntensity: type === 'center' ? 1.5 : 0.6,
          roughness: 0.3
        });

        const sides = [
          { px: w / 2 + 0.05, pz: 0, rw: 0.1, rh: 1.2, rd: 1.2 },
          { px: -w / 2 - 0.05, pz: 0, rw: 0.1, rh: 1.2, rd: 1.2 },
          { px: 0, pz: d / 2 + 0.05, rw: 1.2, rh: 1.2, rd: 0.1 },
          { px: 0, pz: -d / 2 - 0.05, rw: 1.2, rh: 1.2, rd: 0.1 },
        ];

        for (const s of sides) {
          if (rng() > 0.4) {
            const wGeo = new THREE.BoxGeometry(s.rw, s.rh, s.rd);
            const wMesh = new THREE.Mesh(wGeo, winMat);
            wMesh.position.set(s.px, f * floorH + floorH / 2, s.pz);
            group.add(wMesh);
          }
        }
      }
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
