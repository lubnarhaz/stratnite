import * as THREE from 'three';

// Fortnite-style colorful buildings
const ZONE_STYLES = {
  'MÉGA-CITÉ':    { walls: [0xd4d4d4, 0xc0c0c0], roof: 0x4a6fa5, windows: 0x88ccff, trim: 0x5577aa },
  'CYBER PARK':   { walls: [0xc8dbb0, 0xb8cc9a], roof: 0x6b8e3a, windows: 0xaaddaa, trim: 0x446622 },
  'GRID STATION': { walls: [0xd4b896, 0xc4a878], roof: 0x8b6914, windows: 0xffcc66, trim: 0x8b6914 },
  'NEON STRIP':   { walls: [0xe0c0d0, 0xd4a0b8], roof: 0x9b3060, windows: 0xff88bb, trim: 0x882255 },
  'TECH LABS':    { walls: [0xb0c4de, 0xa0b8d0], roof: 0x4682b4, windows: 0x66aaff, trim: 0x336699 },
  'VOID FOREST':  { walls: [0xa0a080, 0x909070], roof: 0x556b2f, windows: 0x99aa66, trim: 0x445522 },
  'PULSE HARBOR': { walls: [0xb8d4e8, 0xa8c4d8], roof: 0x4a8bad, windows: 0x66ccee, trim: 0x337799 },
  'DATA HAVEN':   { walls: [0xc8c8d8, 0xb8b8c8], roof: 0x6a6a8a, windows: 0x9999cc, trim: 0x555577 },
  'ALPHA BASE':   { walls: [0xc0a8a0, 0xb09890], roof: 0x8b4513, windows: 0xdd8844, trim: 0x773311 },
  'ZERO POINT':   { walls: [0xe8e8e8, 0xd8d8d8], roof: 0x708090, windows: 0xaabbcc, trim: 0x556677 },
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
      const style = ZONE_STYLES[zone.name] || ZONE_STYLES['ZERO POINT'];
      const count = zone.type === 'forest' ? 2 : zone.type === 'center' ? 6 : 6 + Math.floor(rng() * 5);

      for (let i = 0; i < count; i++) {
        const angle = rng() * Math.PI * 2;
        const dist = 5 + rng() * zone.r * 0.6;
        const bx = zone.x + Math.cos(angle) * dist;
        const bz = zone.z + Math.sin(angle) * dist;
        const by = this.terrain.getHeightAt(bx, bz);

        const building = this._createHouse(rng, style);
        building.position.set(bx, by, bz);
        building.rotation.y = rng() * Math.PI * 2;
        this.group.add(building);
      }
    }
  }

  _createHouse(rng, style) {
    const group = new THREE.Group();
    const floors = 1 + Math.floor(rng() * 3);
    const w = 4 + rng() * 5;
    const d = 4 + rng() * 4;
    const floorH = 3;
    const totalH = floors * floorH;

    // Main walls
    const wallColor = style.walls[Math.floor(rng() * style.walls.length)];
    const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.85 });

    const bodyGeo = new THREE.BoxGeometry(w, totalH, d);
    const body = new THREE.Mesh(bodyGeo, wallMat);
    body.position.y = totalH / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Roof
    const roofMat = new THREE.MeshStandardMaterial({ color: style.roof, roughness: 0.7 });
    if (rng() > 0.4) {
      // Pitched roof
      const roofGeo = new THREE.ConeGeometry(Math.max(w, d) * 0.75, 2.5, 4);
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = totalH + 1.25;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      group.add(roof);
    } else {
      // Flat roof with rim
      const rimGeo = new THREE.BoxGeometry(w + 0.4, 0.3, d + 0.4);
      const rim = new THREE.Mesh(rimGeo, roofMat);
      rim.position.y = totalH + 0.15;
      rim.castShadow = true;
      group.add(rim);
    }

    // Windows
    const winMat = new THREE.MeshStandardMaterial({
      color: style.windows,
      emissive: style.windows,
      emissiveIntensity: 0.15,
      roughness: 0.2,
      metalness: 0.3
    });

    // Trim/frames
    const trimMat = new THREE.MeshStandardMaterial({ color: style.trim, roughness: 0.6 });

    for (let f = 0; f < floors; f++) {
      const fy = f * floorH + floorH * 0.55;

      // Front & back windows
      for (const side of [-1, 1]) {
        if (rng() > 0.25) {
          // Window frame
          const frameGeo = new THREE.BoxGeometry(1.1, 1.3, 0.15);
          const frame = new THREE.Mesh(frameGeo, trimMat);
          frame.position.set(0, fy, side * (d / 2 + 0.05));
          group.add(frame);

          // Glass
          const winGeo = new THREE.BoxGeometry(0.8, 1.0, 0.12);
          const win = new THREE.Mesh(winGeo, winMat);
          win.position.set(0, fy, side * (d / 2 + 0.08));
          group.add(win);
        }
      }

      // Side windows
      for (const side of [-1, 1]) {
        if (rng() > 0.3) {
          const frameGeo = new THREE.BoxGeometry(0.15, 1.3, 1.1);
          const frame = new THREE.Mesh(frameGeo, trimMat);
          frame.position.set(side * (w / 2 + 0.05), fy, 0);
          group.add(frame);

          const winGeo = new THREE.BoxGeometry(0.12, 1.0, 0.8);
          const win = new THREE.Mesh(winGeo, winMat);
          win.position.set(side * (w / 2 + 0.08), fy, 0);
          group.add(win);
        }
      }
    }

    // Door
    const doorMat = new THREE.MeshStandardMaterial({ color: style.trim, roughness: 0.7 });
    const doorGeo = new THREE.BoxGeometry(1.2, 2.2, 0.15);
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1.1, d / 2 + 0.05);
    group.add(door);

    // Foundation strip
    const foundGeo = new THREE.BoxGeometry(w + 0.3, 0.4, d + 0.3);
    const foundMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.95 });
    const found = new THREE.Mesh(foundGeo, foundMat);
    found.position.y = 0.2;
    found.receiveShadow = true;
    group.add(found);

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
