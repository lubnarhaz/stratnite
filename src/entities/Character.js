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

    const c = new THREE.Color(options.color || 0x00ffcc);
    const skinColor = 0xf4c9a0;

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.6, metalness: 0.05 });
    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });
    const darkMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(this.color).multiplyScalar(0.5), roughness: 0.7 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 });

    this.mesh = new THREE.Group();

    // Torso - slightly tapered
    const torsoGeo = new THREE.BoxGeometry(0.9, 1.0, 0.55);
    const torso = new THREE.Mesh(torsoGeo, bodyMat);
    torso.position.y = 1.1;
    torso.castShadow = true;
    this.mesh.add(torso);

    // Belt
    const beltGeo = new THREE.BoxGeometry(0.95, 0.12, 0.6);
    const belt = new THREE.Mesh(beltGeo, darkMat);
    belt.position.y = 0.65;
    this.mesh.add(belt);

    // Legs
    for (const side of [-1, 1]) {
      // Upper leg
      const legGeo = new THREE.BoxGeometry(0.3, 0.55, 0.35);
      const leg = new THREE.Mesh(legGeo, darkMat);
      leg.position.set(side * 0.22, 0.35, 0);
      leg.castShadow = true;
      this.mesh.add(leg);

      // Lower leg
      const shinGeo = new THREE.BoxGeometry(0.28, 0.45, 0.32);
      const shin = new THREE.Mesh(shinGeo, bodyMat);
      shin.position.set(side * 0.22, -0.05, 0);
      shin.castShadow = true;
      this.mesh.add(shin);

      // Shoes
      const shoeGeo = new THREE.BoxGeometry(0.32, 0.18, 0.45);
      const shoe = new THREE.Mesh(shoeGeo, shoeMat);
      shoe.position.set(side * 0.22, -0.2, 0.05);
      shoe.castShadow = true;
      this.mesh.add(shoe);
    }

    // Head
    const headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.5);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.9;
    head.castShadow = true;
    this.mesh.add(head);

    // Eyes
    for (const side of [-1, 1]) {
      const eyeGeo = new THREE.SphereGeometry(0.07, 8, 6);
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(side * 0.13, 1.93, 0.26);
      this.mesh.add(eye);

      const pupilGeo = new THREE.SphereGeometry(0.04, 6, 4);
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(side * 0.13, 1.93, 0.3);
      this.mesh.add(pupil);
    }

    // Hair / helmet (colored block on top)
    const hairGeo = new THREE.BoxGeometry(0.58, 0.25, 0.52);
    const hair = new THREE.Mesh(hairGeo, bodyMat);
    hair.position.y = 2.25;
    hair.castShadow = true;
    this.mesh.add(hair);

    // Arms
    for (const side of [-1, 1]) {
      // Shoulder
      const shoulderGeo = new THREE.SphereGeometry(0.16, 8, 6);
      const shoulder = new THREE.Mesh(shoulderGeo, bodyMat);
      shoulder.position.set(side * 0.6, 1.45, 0);
      this.mesh.add(shoulder);

      // Upper arm
      const armGeo = new THREE.BoxGeometry(0.2, 0.5, 0.2);
      const arm = new THREE.Mesh(armGeo, bodyMat);
      arm.position.set(side * 0.6, 1.1, 0);
      arm.castShadow = true;
      this.mesh.add(arm);

      // Forearm (skin colored)
      const foreGeo = new THREE.BoxGeometry(0.18, 0.4, 0.18);
      const fore = new THREE.Mesh(foreGeo, skinMat);
      fore.position.set(side * 0.6, 0.7, 0);
      fore.castShadow = true;
      this.mesh.add(fore);

      // Hand
      const handGeo = new THREE.SphereGeometry(0.1, 6, 4);
      const hand = new THREE.Mesh(handGeo, skinMat);
      hand.position.set(side * 0.6, 0.5, 0);
      this.mesh.add(hand);
    }

    // Backpack (small box on back)
    const backGeo = new THREE.BoxGeometry(0.5, 0.45, 0.3);
    const back = new THREE.Mesh(backGeo, darkMat);
    back.position.set(0, 1.2, -0.4);
    back.castShadow = true;
    this.mesh.add(back);

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
    this.mesh.position.y -= 0.9;
  }

  getPosition() {
    return this.body.position;
  }
}
