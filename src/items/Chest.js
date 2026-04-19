import * as THREE from 'three';
import { getRandomWeapon } from './WeaponTypes.js';

export class Chest {
  constructor(x, y, z) {
    this.opened = false;
    this.items = [];
    this.group = new THREE.Group();
    this.group.position.set(x, y, z);

    // Chest body
    const bodyGeo = new THREE.BoxGeometry(1.2, 0.7, 0.8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x886622,
      roughness: 0.7,
      metalness: 0.3
    });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = 0.35;
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.group.add(this.bodyMesh);

    // Lid (pivots from back)
    this.lidPivot = new THREE.Group();
    this.lidPivot.position.set(0, 0.7, -0.4);
    const lidGeo = new THREE.BoxGeometry(1.2, 0.15, 0.8);
    const lidMat = new THREE.MeshStandardMaterial({
      color: 0xaa8833,
      roughness: 0.6,
      metalness: 0.3
    });
    this.lidMesh = new THREE.Mesh(lidGeo, lidMat);
    this.lidMesh.position.set(0, 0.075, 0.4);
    this.lidMesh.castShadow = true;
    this.lidPivot.add(this.lidMesh);
    this.group.add(this.lidPivot);

    // Glow light
    this.light = new THREE.PointLight(0x00ffcc, 1, 8);
    this.light.position.y = 1;
    this.group.add(this.light);

    // Pulsing animation state
    this._pulseTime = Math.random() * 100;
    this._openAnim = 0;
    this._opening = false;
  }

  open() {
    if (this.opened) return [];
    this.opened = true;
    this._opening = true;

    // Generate items
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      this.items.push(getRandomWeapon());
    }

    // Change light to gold
    this.light.color.setHex(0xffd700);
    this.light.intensity = 3;

    return this.items;
  }

  update(dt) {
    this._pulseTime += dt;

    if (!this.opened) {
      // Pulse glow
      this.light.intensity = 0.8 + Math.sin(this._pulseTime * 3) * 0.4;
    }

    if (this._opening) {
      this._openAnim = Math.min(1, this._openAnim + dt * 2.5);
      this.lidPivot.rotation.x = -this._openAnim * Math.PI / 2;

      if (this._openAnim >= 1) {
        this._opening = false;
      }

      // Fade light after opening
      if (this._openAnim >= 1) {
        this.light.intensity = Math.max(0, this.light.intensity - dt * 2);
      }
    }
  }

  getPosition() {
    return this.group.position;
  }
}
