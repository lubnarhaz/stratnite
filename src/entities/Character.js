import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gltfLoader = new GLTFLoader();
let _soldierCache = null;
let _soldierLoading = null;

function loadSoldierModel() {
  if (_soldierCache) return Promise.resolve(_soldierCache);
  if (_soldierLoading) return _soldierLoading;
  _soldierLoading = new Promise((resolve) => {
    gltfLoader.load('/models/threejs_soldier.glb', (gltf) => {
      _soldierCache = gltf;
      resolve(gltf);
    }, undefined, () => {
      resolve(null);
    });
  });
  return _soldierLoading;
}

export class Character {
  constructor(options = {}) {
    this.hp = options.hp || 100;
    this.maxHp = options.hp || 100;
    this.shield = 0;
    this.maxShield = options.maxShield || 0;
    this.speed = options.speed || 6;
    this.alive = true;
    this.color = options.color || 0x00ffcc;
    this.mixer = null;
    this._actions = {};

    this.mesh = new THREE.Group();

    // Build procedural fallback immediately
    this._buildProceduralModel(options);

    // Try to load GLTF model async
    this._loadModel(options);

    // Physics body
    this.body = new CANNON.Body({
      mass: 5,
      shape: new CANNON.Cylinder(0.5, 0.5, 1.8, 8),
      fixedRotation: true,
      linearDamping: 0.9
    });
  }

  async _loadModel(options) {
    const gltf = await loadSoldierModel();
    if (!gltf) return;

    const model = gltf.scene.clone(true);
    model.scale.setScalar(0.55);
    model.position.y = -0.22;

    // Tint the model with character color
    const col = new THREE.Color(options.color || 0x00ffcc);
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Tint materials
        if (child.material) {
          child.material = child.material.clone();
          child.material.color.lerp(col, 0.35);
        }
      }
    });

    // Remove procedural meshes
    const toRemove = [];
    this.mesh.children.forEach(c => { if (c.userData._procedural) toRemove.push(c); });
    toRemove.forEach(c => this.mesh.remove(c));

    this.mesh.add(model);
    this._glbModel = model;

    // Setup animations
    if (gltf.animations && gltf.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(model);
      for (const clip of gltf.animations) {
        const action = this.mixer.clipAction(clip);
        this._actions[clip.name.toLowerCase()] = action;
      }
      // Play idle by default
      const idle = this._actions['idle'] || this._actions['tpose'] || Object.values(this._actions)[0];
      if (idle) { idle.play(); this._currentAction = idle; }
    }
  }

  playAnimation(name) {
    const action = this._actions[name.toLowerCase()];
    if (!action || action === this._currentAction) return;
    if (this._currentAction) {
      this._currentAction.fadeOut(0.2);
    }
    action.reset().fadeIn(0.2).play();
    this._currentAction = action;
  }

  _buildProceduralModel(options) {
    const col = new THREE.Color(options.color || 0x00ffcc);
    const darkCol = col.clone().multiplyScalar(0.55);
    const skinColor = 0xdba882;

    const bodyMat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.55 });
    const darkMat = new THREE.MeshStandardMaterial({ color: darkCol, roughness: 0.6 });
    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.65 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });

    const group = new THREE.Group();
    group.userData._procedural = true;

    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.85, 10), bodyMat);
    torso.position.y = 1.05; torso.castShadow = true;
    group.add(torso);

    // Belt
    group.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 10), darkMat), { position: new THREE.Vector3(0, 0.62, 0) }));

    // Legs
    for (const s of [-1, 1]) {
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.38, 8), darkMat);
      upper.position.set(s * 0.16, 0.4, 0); upper.castShadow = true; group.add(upper);
      const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.35, 8), bodyMat);
      lower.position.set(s * 0.16, 0.05, 0); lower.castShadow = true; group.add(lower);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.3), shoeMat);
      boot.position.set(s * 0.16, -0.14, 0.03); boot.castShadow = true; group.add(boot);
    }

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), skinMat);
    head.position.y = 1.76; head.castShadow = true; group.add(head);
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), bodyMat);
    helmet.position.y = 1.8; group.add(helmet);

    // Arms
    for (const s of [-1, 1]) {
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), bodyMat);
      shoulder.position.set(s * 0.48, 1.38, 0); group.add(shoulder);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.35, 8), bodyMat);
      arm.position.set(s * 0.48, 1.13, 0); arm.castShadow = true; group.add(arm);
      const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.3, 8), skinMat);
      fore.position.set(s * 0.48, 0.8, 0); fore.castShadow = true; group.add(fore);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 4), skinMat);
      hand.position.set(s * 0.48, 0.64, 0); group.add(hand);
    }

    // Backpack
    const bp = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.2), darkMat);
    bp.position.set(0, 1.12, -0.33); bp.castShadow = true; group.add(bp);

    this.mesh.add(group);
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
    if (this.hp <= 0) { this.hp = 0; this.alive = false; }
  }

  heal(amount) { this.hp = Math.min(this.maxHp, this.hp + amount); }
  addShield(amount) { this.shield = Math.min(this.maxShield, this.shield + amount); }

  update(dt) {
    if (!this.alive) return;
    this.mesh.position.copy(this.body.position);
    this.mesh.position.y -= 0.9;
    if (this.mixer) this.mixer.update(dt);
  }

  getPosition() { return this.body.position; }
}
