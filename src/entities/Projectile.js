import * as THREE from 'three';

export class Projectile {
  constructor(origin, direction, weapon, isEnemy = false) {
    this.weapon = weapon;
    this.isEnemy = isEnemy;
    this.alive = true;
    this.distance = 0;
    this.maxRange = weapon.range;
    this.speed = weapon.speed;
    this.damage = weapon.dmg;
    this.pierce = weapon.pierce || false;
    this.aoe = weapon.aoe || 0;

    this.velocity = direction.clone().multiplyScalar(this.speed);
    this.position = origin.clone();

    // Mesh
    const geo = new THREE.SphereGeometry(0.12, 6, 6);
    const mat = new THREE.MeshStandardMaterial({
      color: weapon.color,
      emissive: weapon.color,
      emissiveIntensity: 2
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(origin);

    // Point light
    this.light = new THREE.PointLight(weapon.color, 1.5, 4);
    this.mesh.add(this.light);

    // Trail
    this._trail = [];
  }

  update(dt, targets, terrain) {
    if (!this.alive) return;

    // Move
    const delta = this.velocity.clone().multiplyScalar(dt);
    this.position.add(delta);
    this.mesh.position.copy(this.position);
    this.distance += delta.length();

    // Range check
    if (this.distance > this.maxRange) {
      this.destroy();
      return;
    }

    // Ground check
    if (terrain) {
      const groundY = terrain.getHeightAt(this.position.x, this.position.z);
      if (this.position.y < groundY) {
        this._spawnImpact();
        this.destroy();
        return;
      }
    }

    // Hit check
    if (targets) {
      for (const target of targets) {
        if (!target.alive) continue;
        const tPos = new THREE.Vector3().copy(target.body.position);
        const dist = this.position.distanceTo(tPos);
        if (dist < 1.5) {
          if (this.aoe > 0) {
            // AOE damage
            for (const t of targets) {
              if (!t.alive) continue;
              const d = this.position.distanceTo(new THREE.Vector3().copy(t.body.position));
              if (d < this.aoe) {
                t.takeDamage(this.damage * (1 - d / this.aoe));
              }
            }
          } else {
            target.takeDamage(this.damage);
          }
          this._spawnImpact();
          if (!this.pierce) {
            this.destroy();
            return;
          }
        }
      }
    }
  }

  _spawnImpact() {
    // Visual impact effect - just flash the light
    if (this.light) {
      this.light.intensity = 5;
    }
  }

  destroy() {
    this.alive = false;
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    if (this.light) {
      this.light.dispose && this.light.dispose();
    }
  }
}
