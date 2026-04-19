import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Character } from './Character.js';
import { Projectile } from './Projectile.js';

export class Player extends Character {
  constructor(charData) {
    super({
      hp: charData.hp,
      maxShield: charData.maxShield,
      speed: charData.speed,
      color: charData.color
    });

    this.charData = charData;
    this.charId = charData.id || 'arctic';

    // Load skin texture
    const SKIN_PATHS = {
      arctic: '/skins/arctic.webp',
      desert: '/skins/desert.webp',
      cyber: '/skins/cyber.webp',
      crystal: '/skins/crystal.webp'
    };
    const skinPath = SKIN_PATHS[this.charId];
    if (skinPath) {
      const loader = new THREE.TextureLoader();
      loader.load(skinPath, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        this.mesh.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
              map: texture,
              roughness: 0.6,
              metalness: 0.1
            });
          }
        });
      });
    }

    // Camera control
    this.phi = 0.3;   // vertical angle
    this.theta = 0;   // horizontal angle
    this.cameraDistance = 8;

    // Shooting
    this.lastShot = 0;
    this.overclock = false;

    // Ability
    this.abilityCooldown = 0;
    this.abilityMaxCD = charData.abCD;
    this.abilityActive = false;
    this.invincible = false;

    // Shield regen
    this.shieldRegen = charData.shieldRegen;
    this.shieldRegenTimer = 0;

    // Grounded
    this.grounded = true;
    this._groundCheckTimer = 0;

    // Kill count
    this.kills = 0;
  }

  update(dt, input, camera, terrain) {
    if (!this.alive) return;

    // Mouse look
    const mouse = input.getMouseDelta();
    if (input.isPointerLocked()) {
      this.theta -= mouse.dx;
      this.phi = Math.max(0.1, Math.min(Math.PI / 2.5, this.phi + mouse.dy));
    }

    // Scroll to zoom
    const wheel = input.getWheelDelta();
    if (wheel) {
      this.cameraDistance = Math.max(3, Math.min(15, this.cameraDistance + wheel * 0.005));
    }

    // WASD movement
    const forward = new THREE.Vector3(-Math.sin(this.theta), 0, -Math.cos(this.theta));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    const moveDir = new THREE.Vector3(0, 0, 0);

    if (input.isDown('KeyW') || input.isDown('ArrowUp')) moveDir.add(forward);
    if (input.isDown('KeyS') || input.isDown('ArrowDown')) moveDir.sub(forward);
    if (input.isDown('KeyA') || input.isDown('ArrowLeft')) moveDir.sub(right);
    if (input.isDown('KeyD') || input.isDown('ArrowRight')) moveDir.add(right);

    // Mobile joystick input
    const touchDir = input.getTouchMoveDir();
    if (touchDir && (Math.abs(touchDir.x) > 0.1 || Math.abs(touchDir.y) > 0.1)) {
      moveDir.add(forward.clone().multiplyScalar(-touchDir.y));
      moveDir.add(right.clone().multiplyScalar(touchDir.x));
    }

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      const speed = this.speed * 3;
      this.body.velocity.x = moveDir.x * speed;
      this.body.velocity.z = moveDir.z * speed;

      // Rotate mesh to face movement direction
      this.mesh.rotation.y = Math.atan2(moveDir.x, moveDir.z);
    }

    // Jump
    this._groundCheckTimer += dt;
    if (this._groundCheckTimer > 0.1) {
      this._groundCheckTimer = 0;
      this.grounded = this.body.position.y < (terrain ? terrain.getHeightAt(this.body.position.x, this.body.position.z) + 2.5 : 3);
    }

    if ((input.isDown('Space')) && this.grounded) {
      this.body.velocity.y = 10;
      this.grounded = false;
    }

    // Keep above terrain
    if (terrain) {
      const groundY = terrain.getHeightAt(this.body.position.x, this.body.position.z) + 1.0;
      if (this.body.position.y < groundY) {
        this.body.position.y = groundY;
        this.body.velocity.y = Math.max(0, this.body.velocity.y);
        this.grounded = true;
      }
    }

    // Update camera position (third-person)
    const camX = this.body.position.x + Math.sin(this.theta) * Math.cos(this.phi) * this.cameraDistance;
    const camY = this.body.position.y + Math.sin(this.phi) * this.cameraDistance + 2;
    const camZ = this.body.position.z + Math.cos(this.theta) * Math.cos(this.phi) * this.cameraDistance;
    camera.position.set(camX, camY, camZ);
    camera.lookAt(this.body.position.x, this.body.position.y + 1.5, this.body.position.z);

    // Shield regen
    if (this.shieldRegen && this.shield < this.maxShield) {
      this.shieldRegenTimer += dt;
      if (this.shieldRegenTimer >= 5) {
        this.shield = Math.min(this.maxShield, this.shield + 2 * dt);
      }
    }

    // Ability cooldown
    if (this.abilityCooldown > 0) {
      this.abilityCooldown -= dt;
    }

    // Call parent update
    super.update(dt);
  }

  shoot(scene, weapon, enemies) {
    if (!weapon || !this.alive) return null;
    if (weapon.utility) return null;

    const now = performance.now() / 1000;
    const rate = this.overclock ? weapon.rate * 2 : weapon.rate;
    if (now - this.lastShot < 1 / rate) return null;
    if (weapon.currentAmmo === 0) return null;

    this.lastShot = now;
    if (weapon.currentAmmo > 0) weapon.currentAmmo--;

    // Direction from camera
    const dir = new THREE.Vector3(
      -Math.sin(this.theta),
      -Math.sin(this.phi) * 0.3,
      -Math.cos(this.theta)
    ).normalize();

    const origin = new THREE.Vector3().copy(this.body.position);
    origin.y += 1.2;

    if (weapon.pellets) {
      const projectiles = [];
      for (let i = 0; i < weapon.pellets; i++) {
        const spread = new THREE.Vector3(
          dir.x + (Math.random() - 0.5) * 0.15,
          dir.y + (Math.random() - 0.5) * 0.1,
          dir.z + (Math.random() - 0.5) * 0.15
        ).normalize();
        const p = new Projectile(origin.clone(), spread, weapon);
        scene.add(p.mesh);
        projectiles.push(p);
      }
      return projectiles;
    }

    if (weapon.melee) {
      // Melee: instant damage in range
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const dist = origin.distanceTo(new THREE.Vector3().copy(enemy.body.position));
        if (dist < weapon.range) {
          enemy.takeDamage(weapon.dmg);
        }
      }
      return null;
    }

    const proj = new Projectile(origin, dir, weapon);
    scene.add(proj.mesh);
    return proj;
  }

  useAbility(scene, bots) {
    if (this.abilityCooldown > 0 || !this.alive) return;
    this.abilityCooldown = this.abilityMaxCD;

    switch (this.charId) {
      case 'arctic':
        // Slow bots in range
        for (const bot of bots) {
          if (!bot.alive) continue;
          const dist = this.body.position.distanceTo(bot.body.position);
          if (dist < 20) {
            bot.slowTimer = 6;
            bot.speed *= 0.3;
          }
        }
        break;
      case 'desert':
        // Radar pulse
        this._radarActive = true;
        setTimeout(() => { this._radarActive = false; }, 5000);
        break;
      case 'cyber':
        // Overclock
        this.overclock = true;
        setTimeout(() => { this.overclock = false; }, 5000);
        break;
      case 'crystal':
        // Invincible
        this.invincible = true;
        setTimeout(() => { this.invincible = false; }, 3000);
        break;
    }
  }

  takeDamage(amount) {
    if (this.invincible) return;
    this.shieldRegenTimer = 0;
    super.takeDamage(amount);
  }
}
