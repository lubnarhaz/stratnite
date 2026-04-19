import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Character {
  constructor(options = {}) {
    this.hp = options.hp || 100;
    this.maxHp = options.hp || 100;
    this.shield = 0;
    this.maxShield = options.maxShield || 0;
    this.speed = options.speed || 6;
    this.alive = true;
    this.color = options.color || 0x00ffcc;

    // 3D mesh group
    this.mesh = new THREE.Group();

    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.6 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.6;
    bodyMesh.castShadow = true;
    this.mesh.add(bodyMesh);

    // Head
    const headGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.5 });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 1.5;
    headMesh.castShadow = true;
    this.mesh.add(headMesh);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    const armMat = new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.7 });
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.6, 0.8, 0);
    leftArm.castShadow = true;
    this.mesh.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.6, 0.8, 0);
    rightArm.castShadow = true;
    this.mesh.add(rightArm);

    // Physics body
    this.body = new CANNON.Body({
      mass: 5,
      shape: new CANNON.Cylinder(0.5, 0.5, 1.8, 8),
      fixedRotation: true,
      linearDamping: 0.9
    });
  }

  takeDamage(amount) {
    if (!this.alive) return;
    let remaining = amount;
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, remaining);
      this.shield -= absorbed;
      remaining -= absorbed;
    }
    this.hp -= remaining;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  addShield(amount) {
    this.shield = Math.min(this.maxShield, this.shield + amount);
  }

  update(dt) {
    if (!this.alive) return;
    this.mesh.position.copy(this.body.position);
    // Don't copy quaternion - keep upright
    this.mesh.position.y -= 0.9; // offset for visual
  }

  getPosition() {
    return this.body.position;
  }
}
