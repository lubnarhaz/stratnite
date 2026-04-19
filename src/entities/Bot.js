import * as THREE from 'three';
import { Character } from './Character.js';
import { Projectile } from './Projectile.js';
import { WEAPONS, getRandomWeapon } from '../items/WeaponTypes.js';

const BOT_NAMES = [
  'NeonWraith', 'ShadowPulse', 'VoidRunner', 'DataGhost',
  'CyberFang', 'GridHawk', 'ByteStorm', 'PixelReaper',
  'TechSpectre', 'PulseRider', 'QuantumWolf', 'NightCode',
  'FluxHunter', 'DarkWave', 'IonBlade', 'NetPhantom',
  'CircuitX', 'BinaryFury', 'WarpShade', 'ZeroHex'
];

export class Bot extends Character {
  constructor(index, terrain) {
    const hp = 60 + Math.random() * 60;
    const colors = [0xff4444, 0xff8844, 0xffaa00, 0xff44aa, 0xaa44ff, 0x44aaff, 0x44ffaa, 0xff6666];
    super({
      hp,
      maxShield: Math.random() > 0.5 ? 25 : 0,
      speed: 3 + Math.random() * 3,
      color: colors[index % colors.length]
    });

    this.name = BOT_NAMES[index % BOT_NAMES.length];
    this.terrain = terrain;
    this.state = 'wander';
    this.stateTimer = 0;
    this.target = null;
    this.weapon = null;
    this.lastShot = 0;
    this.wanderDir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
    this.wanderTimer = 3 + Math.random() * 5;
    this.slowTimer = 0;
    this._originalSpeed = this.speed;
    this.detectionRange = 40 + Math.random() * 20;
    this.accuracy = 0.6 + Math.random() * 0.3;
  }

  update(dt, playerPos, storm, scene) {
    if (!this.alive) return;

    // Slow effect
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.speed = this._originalSpeed;
      }
    }

    // Keep above terrain
    if (this.terrain) {
      const groundY = this.terrain.getHeightAt(this.body.position.x, this.body.position.z) + 1.0;
      if (this.body.position.y < groundY) {
        this.body.position.y = groundY;
        this.body.velocity.y = Math.max(0, this.body.velocity.y);
      }
    }

    // Storm check - flee toward center
    if (storm && storm.isOutside(this.body.position.x, this.body.position.z)) {
      this.state = 'flee';
      this.target = storm.center.clone();
    }

    this.stateTimer += dt;

    switch (this.state) {
      case 'wander':
        this._wander(dt);
        this._checkForPlayer(playerPos);
        break;
      case 'combat':
        this._combat(dt, playerPos, scene);
        break;
      case 'flee':
        this._moveToward(this.target, dt);
        if (!storm || !storm.isOutside(this.body.position.x, this.body.position.z)) {
          this.state = 'wander';
        }
        break;
      case 'loot':
        if (this.target) {
          this._moveToward(this.target, dt);
        }
        if (this.stateTimer > 5) {
          this.state = 'wander';
          this.stateTimer = 0;
        }
        break;
    }

    // Storm damage
    if (storm && storm.isOutside(this.body.position.x, this.body.position.z)) {
      this.takeDamage(storm.getStormDamage(dt));
    }

    super.update(dt);
  }

  _wander(dt) {
    this.wanderTimer -= dt;
    if (this.wanderTimer <= 0) {
      this.wanderDir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
      this.wanderTimer = 3 + Math.random() * 5;
    }

    const speed = this.speed * 2;
    this.body.velocity.x = this.wanderDir.x * speed;
    this.body.velocity.z = this.wanderDir.z * speed;
    this.mesh.rotation.y = Math.atan2(this.wanderDir.x, this.wanderDir.z);

    // Stay in bounds
    if (Math.abs(this.body.position.x) > 240 || Math.abs(this.body.position.z) > 240) {
      this.wanderDir.set(-this.body.position.x, 0, -this.body.position.z).normalize();
    }
  }

  _checkForPlayer(playerPos) {
    if (!playerPos) return;
    const dx = playerPos.x - this.body.position.x;
    const dz = playerPos.z - this.body.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < this.detectionRange && this.weapon) {
      this.state = 'combat';
      this.stateTimer = 0;
    }
  }

  _combat(dt, playerPos, scene) {
    if (!playerPos) { this.state = 'wander'; return; }

    const dx = playerPos.x - this.body.position.x;
    const dz = playerPos.z - this.body.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Lost target
    if (dist > this.detectionRange * 1.5) {
      this.state = 'wander';
      this.stateTimer = 0;
      return;
    }

    // Face player
    this.mesh.rotation.y = Math.atan2(dx, dz);

    // Strafe
    const strafeDir = new THREE.Vector3(-dz, 0, dx).normalize();
    const strafeAmount = Math.sin(this.stateTimer * 2) * this.speed * 2;
    this.body.velocity.x = strafeDir.x * strafeAmount;
    this.body.velocity.z = strafeDir.z * strafeAmount;

    // Keep distance
    if (dist < 10) {
      this.body.velocity.x -= (dx / dist) * this.speed * 2;
      this.body.velocity.z -= (dz / dist) * this.speed * 2;
    } else if (dist > 25) {
      this.body.velocity.x += (dx / dist) * this.speed * 2;
      this.body.velocity.z += (dz / dist) * this.speed * 2;
    }

    // Shoot
    if (this.weapon && dist < this.weapon.range) {
      this._tryShoot(playerPos, scene);
    }
  }

  _tryShoot(targetPos, scene) {
    if (!this.weapon) return null;
    const now = performance.now() / 1000;
    if (now - this.lastShot < 1 / this.weapon.rate) return null;
    if (this.weapon.currentAmmo === 0) return null;

    this.lastShot = now;
    if (this.weapon.currentAmmo > 0) this.weapon.currentAmmo--;

    const origin = new THREE.Vector3().copy(this.body.position);
    origin.y += 1.2;

    const dir = new THREE.Vector3(
      targetPos.x - origin.x,
      targetPos.y - origin.y + 1,
      targetPos.z - origin.z
    ).normalize();

    // Add inaccuracy
    const jitter = (1 - this.accuracy) * 0.15;
    dir.x += (Math.random() - 0.5) * jitter;
    dir.y += (Math.random() - 0.5) * jitter;
    dir.z += (Math.random() - 0.5) * jitter;
    dir.normalize();

    const proj = new Projectile(origin, dir, this.weapon, true);
    scene.add(proj.mesh);
    return proj;
  }

  _moveToward(target, dt) {
    if (!target) return;
    const dx = target.x - this.body.position.x;
    const dz = target.z - this.body.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 2) return;

    const speed = this.speed * 2.5;
    this.body.velocity.x = (dx / dist) * speed;
    this.body.velocity.z = (dz / dist) * speed;
    this.mesh.rotation.y = Math.atan2(dx, dz);
  }

  equipWeapon(weapon) {
    this.weapon = weapon;
  }
}
