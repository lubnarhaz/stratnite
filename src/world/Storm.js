import * as THREE from 'three';

export class Storm {
  constructor() {
    this.phases = [450, 350, 260, 180, 110, 60, 30];
    this.intervals = [120, 90, 75, 60, 45, 30];
    this.currentPhase = 0;
    this.radius = this.phases[0];
    this.targetRadius = this.phases[0];
    this.timer = this.intervals[0];
    this.shrinking = false;
    this.shrinkSpeed = 0;
    this.damagePerSec = 5;
    this.center = new THREE.Vector3(0, 0, 0);
    this.group = new THREE.Group();

    // Outer wall
    const outerGeo = new THREE.CylinderGeometry(this.radius, this.radius, 500, 64, 1, true);
    this.outerMat = new THREE.MeshBasicMaterial({
      color: 0x4466ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      depthWrite: false
    });
    this.outerMesh = new THREE.Mesh(outerGeo, this.outerMat);
    this.outerMesh.position.y = 150;
    this.group.add(this.outerMesh);

    // Inner wall
    const innerGeo = new THREE.CylinderGeometry(this.radius - 2, this.radius - 2, 500, 64, 1, true);
    this.innerMat = new THREE.MeshBasicMaterial({
      color: 0x4466ff,
      transparent: true,
      opacity: 0.3,
      side: THREE.FrontSide,
      depthWrite: false
    });
    this.innerMesh = new THREE.Mesh(innerGeo, this.innerMat);
    this.innerMesh.position.y = 150;
    this.group.add(this.innerMesh);

    // Particles in wall
    const partCount = 500;
    const partGeo = new THREE.BufferGeometry();
    this._partPositions = new Float32Array(partCount * 3);
    this._partAngles = new Float32Array(partCount);
    this._partHeights = new Float32Array(partCount);
    for (let i = 0; i < partCount; i++) {
      this._partAngles[i] = Math.random() * Math.PI * 2;
      this._partHeights[i] = Math.random() * 400 - 50;
      this._partPositions[i * 3] = Math.cos(this._partAngles[i]) * this.radius;
      this._partPositions[i * 3 + 1] = this._partHeights[i];
      this._partPositions[i * 3 + 2] = Math.sin(this._partAngles[i]) * this.radius;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(this._partPositions, 3));
    const partMat = new THREE.PointsMaterial({ color: 0x6688ff, size: 2, transparent: true, opacity: 0.6 });
    this.particles = new THREE.Points(partGeo, partMat);
    this.group.add(this.particles);

    // Light
    this.light = new THREE.PointLight(0x4466ff, 2, 100);
    this.light.position.set(this.radius, 50, 0);
    this.group.add(this.light);
  }

  update(dt) {
    this.timer -= dt;

    if (this.timer <= 0 && this.currentPhase < this.phases.length - 1) {
      if (!this.shrinking) {
        this.shrinking = true;
        this.targetRadius = this.phases[this.currentPhase + 1];
        this.shrinkSpeed = (this.radius - this.targetRadius) / 30; // shrink over 30s
      }
    }

    if (this.shrinking) {
      this.radius -= this.shrinkSpeed * dt;
      if (this.radius <= this.targetRadius) {
        this.radius = this.targetRadius;
        this.shrinking = false;
        this.currentPhase++;
        if (this.currentPhase < this.intervals.length) {
          this.timer = this.intervals[this.currentPhase];
        }
        this.damagePerSec = 5 + this.currentPhase * 3;
      }
    }

    // Update mesh scale
    const scale = this.radius / this.phases[0];
    this.outerMesh.scale.set(scale, 1, scale);
    this.innerMesh.scale.set(scale, 1, scale);

    // Update particles
    for (let i = 0; i < this._partAngles.length; i++) {
      this._partAngles[i] += dt * 0.5;
      this._partPositions[i * 3] = Math.cos(this._partAngles[i]) * this.radius;
      this._partPositions[i * 3 + 1] = this._partHeights[i];
      this._partPositions[i * 3 + 2] = Math.sin(this._partAngles[i]) * this.radius;
    }
    this.particles.geometry.attributes.position.needsUpdate = true;

    // Light position
    this.light.position.x = Math.cos(Date.now() * 0.001) * this.radius;
    this.light.position.z = Math.sin(Date.now() * 0.001) * this.radius;
  }

  isOutside(x, z) {
    const dx = x - this.center.x;
    const dz = z - this.center.z;
    return Math.sqrt(dx * dx + dz * dz) > this.radius;
  }

  getStormDamage(dt) {
    return this.damagePerSec * dt;
  }

  getTimeLeft() {
    return Math.max(0, Math.ceil(this.timer));
  }

  addToScene(scene) {
    scene.add(this.group);
  }
}
