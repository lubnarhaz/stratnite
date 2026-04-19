import { Terrain } from './Terrain.js';
import { Buildings } from './Buildings.js';
import { Trees } from './Trees.js';
import { Sky } from './Sky.js';

export const ZONES = [
  { name: 'MÉGA-CITÉ',      x: 0,    z: 0,    r: 120, type: 'city' },
  { name: 'CYBER PARK',     x: -200, z: -200, r: 90,  type: 'park' },
  { name: 'GRID STATION',   x: 200,  z: -200, r: 85,  type: 'industrial' },
  { name: 'NEON STRIP',     x: -220, z: 0,    r: 80,  type: 'neon' },
  { name: 'TECH LABS',      x: 220,  z: 0,    r: 90,  type: 'labs' },
  { name: 'VOID FOREST',    x: -180, z: 200,  r: 110, type: 'forest' },
  { name: 'PULSE HARBOR',   x: 0,    z: 250,  r: 85,  type: 'harbor' },
  { name: 'DATA HAVEN',     x: 210,  z: 210,  r: 75,  type: 'platform' },
  { name: 'ALPHA BASE',     x: 0,    z: -220, r: 85,  type: 'military' },
  { name: 'ZERO POINT',     x: 0,    z: 0,    r: 40,  type: 'center' },
];

export class GameMap {
  constructor() {
    this.terrain = new Terrain();
    this.buildings = new Buildings(this.terrain, ZONES);
    this.trees = new Trees(this.terrain, ZONES);
    this.sky = new Sky();
  }

  getZoneAt(x, z) {
    let closest = ZONES[0];
    let minDist = Infinity;
    for (const zone of ZONES) {
      const dx = x - zone.x;
      const dz = z - zone.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < zone.r && dist < minDist) {
        minDist = dist;
        closest = zone;
      }
    }
    return closest;
  }

  addToScene(scene) {
    this.terrain.addToScene(scene);
    this.buildings.addToScene(scene);
    this.trees.addToScene(scene);
    this.sky.addToScene(scene);
  }
}
