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

    const col = new THREE.Color(this.color);
    const darkCol = col.clone().multiplyScalar(0.55);
    const skinColor = 0xdba882;

    const bodyMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.55, metalness: 0.05 });
    const darkMat = new THREE.MeshStandardMaterial({ color: darkCol, roughness: 0.6 });
    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.65 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });
    const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

    this.mesh = new THREE.Group();

    // --- TORSO (rounded) ---
    const torsoGeo = new THREE.CylinderGeometry(0.38, 0.32, 0.9, 10);
    const torso = new THREE.Mesh(torsoGeo, bodyMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    this.mesh.add(torso);

    // Chest plate detail
    const chestGeo = new THREE.SphereGeometry(0.36, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const chest = new THREE.Mesh(chestGeo, bodyMat);
    chest.position.set(0, 1.25, 0.05);
    chest.rotation.x = Math.PI;
    chest.scale.set(1, 0.5, 0.8);
    this.mesh.add(chest);

    // Belt
    const beltGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.08, 10);
    const belt = new THREE.Mesh(beltGeo, darkMat);
    belt.position.y = 0.62;
    this.mesh.add(belt);

    // Belt buckle
    const buckleGeo = new THREE.BoxGeometry(0.1, 0.07, 0.06);
    const buckleMat = new THREE.MeshStandardMaterial({ color: 0xccaa44, metalness: 0.7, roughness: 0.3 });
    const buckle = new THREE.Mesh(buckleGeo, buckleMat);
    buckle.position.set(0, 0.62, 0.34);
    this.mesh.add(buckle);

    // --- LEGS ---
    for (const side of [-1, 1]) {
      // Upper leg
      const upperGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.38, 8);
      const upper = new THREE.Mesh(upperGeo, darkMat);
      upper.position.set(side * 0.17, 0.4, 0);
      upper.castShadow = true;
      this.mesh.add(upper);

      // Knee
      const kneeGeo = new THREE.SphereGeometry(0.12, 8, 6);
      const knee = new THREE.Mesh(kneeGeo, darkMat);
      knee.position.set(side * 0.17, 0.22, 0);
      this.mesh.add(knee);

      // Lower leg
      const lowerGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.35, 8);
      const lower = new THREE.Mesh(lowerGeo, bodyMat);
      lower.position.set(side * 0.17, 0.03, 0);
      lower.castShadow = true;
      this.mesh.add(lower);

      // Boot
      const bootGeo = new THREE.BoxGeometry(0.22, 0.14, 0.32);
      const boot = new THREE.Mesh(bootGeo, shoeMat);
      boot.position.set(side * 0.17, -0.15, 0.04);
      boot.castShadow = true;
      this.mesh.add(boot);

      // Boot sole
      const soleGeo = new THREE.BoxGeometry(0.24, 0.04, 0.34);
      const soleMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
      const sole = new THREE.Mesh(soleGeo, soleMat);
      sole.position.set(side * 0.17, -0.22, 0.04);
      this.mesh.add(sole);
    }

    // --- HEAD ---
    const headGeo = new THREE.SphereGeometry(0.28, 12, 10);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.78;
    head.scale.set(1, 1.05, 0.95);
    head.castShadow = true;
    this.mesh.add(head);

    // Eyes
    for (const side of [-1, 1]) {
      const eyeGeo = new THREE.SphereGeometry(0.055, 8, 6);
      const eye = new THREE.Mesh(eyeGeo, eyeWhite);
      eye.position.set(side * 0.1, 1.82, 0.22);
      this.mesh.add(eye);

      const pupilGeo = new THREE.SphereGeometry(0.03, 6, 4);
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(side * 0.1, 1.82, 0.26);
      this.mesh.add(pupil);
    }

    // Mouth line
    const mouthGeo = new THREE.BoxGeometry(0.1, 0.015, 0.02);
    const mouth = new THREE.Mesh(mouthGeo, pupilMat);
    mouth.position.set(0, 1.72, 0.25);
    this.mesh.add(mouth);

    // Hair / Helmet
    const helmetGeo = new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const helmet = new THREE.Mesh(helmetGeo, bodyMat);
    helmet.position.y = 1.82;
    helmet.scale.set(1, 1, 0.95);
    helmet.castShadow = true;
    this.mesh.add(helmet);

    // --- ARMS ---
    for (const side of [-1, 1]) {
      // Shoulder pad
      const shoulderGeo = new THREE.SphereGeometry(0.14, 8, 6);
      const shoulder = new THREE.Mesh(shoulderGeo, bodyMat);
      shoulder.position.set(side * 0.5, 1.4, 0);
      this.mesh.add(shoulder);

      // Upper arm
      const upperArmGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.35, 8);
      const upperArm = new THREE.Mesh(upperArmGeo, bodyMat);
      upperArm.position.set(side * 0.5, 1.15, 0);
      upperArm.castShadow = true;
      this.mesh.add(upperArm);

      // Elbow
      const elbowGeo = new THREE.SphereGeometry(0.08, 6, 4);
      const elbow = new THREE.Mesh(elbowGeo, skinMat);
      elbow.position.set(side * 0.5, 0.98, 0);
      this.mesh.add(elbow);

      // Forearm
      const foreGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.3, 8);
      const fore = new THREE.Mesh(foreGeo, skinMat);
      fore.position.set(side * 0.5, 0.8, 0);
      fore.castShadow = true;
      this.mesh.add(fore);

      // Hand
      const handGeo = new THREE.SphereGeometry(0.07, 6, 4);
      const hand = new THREE.Mesh(handGeo, skinMat);
      hand.position.set(side * 0.5, 0.64, 0);
      this.mesh.add(hand);
    }

    // --- BACKPACK ---
    const bpGeo = new THREE.BoxGeometry(0.35, 0.4, 0.22);
    const bp = new THREE.Mesh(bpGeo, darkMat);
    bp.position.set(0, 1.15, -0.35);
    bp.castShadow = true;
    this.mesh.add(bp);

    // Backpack straps
    for (const side of [-1, 1]) {
      const strapGeo = new THREE.BoxGeometry(0.04, 0.5, 0.06);
      const strap = new THREE.Mesh(strapGeo, darkMat);
      strap.position.set(side * 0.13, 1.2, -0.2);
      this.mesh.add(strap);
    }

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

  heal(amount) { this.hp = Math.min(this.maxHp, this.hp + amount); }
  addShield(amount) { this.shield = Math.min(this.maxShield, this.shield + amount); }

  update(dt) {
    if (!this.alive) return;
    this.mesh.position.copy(this.body.position);
    this.mesh.position.y -= 0.9;
  }

  getPosition() { return this.body.position; }
}
