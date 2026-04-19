import * as THREE from 'three';
import { Engine } from './Engine.js';
import { Physics } from './Physics.js';
import { InputManager } from './InputManager.js';
import { GameMap, ZONES } from '../world/Map.js';
import { Storm } from '../world/Storm.js';
import { Player } from '../entities/Player.js';
import { Bot } from '../entities/Bot.js';
import { Chest } from '../items/Chest.js';
import { CHARACTERS } from '../characters/CharacterData.js';
import { WEAPONS, getRandomWeapon } from '../items/WeaponTypes.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { SoundSystem } from '../systems/SoundSystem.js';
import { HUD } from '../ui/HUD.js';
import { Menu } from '../ui/Menu.js';
import { CharSelect } from '../ui/CharSelect.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.engine = new Engine(this.canvas);
    this.physics = new Physics();
    this.input = new InputManager(this.canvas);
    this.sound = new SoundSystem();
    this.hud = new HUD();
    this.inventory = new InventorySystem();

    this.player = null;
    this.bots = [];
    this.projectiles = [];
    this.chests = [];
    this.map = null;
    this.storm = null;

    this.state = 'MENU'; // MENU, PLAYING, DEAD, WIN
    this.gameTime = 0;
    this.lastTime = 0;
    this._animFrame = null;

    // Menu system
    this.menu = new Menu((action) => this._handleMenuAction(action));
    this.charSelect = new CharSelect((charId) => this._startGame(charId));
    this.charSelect.onBack = () => this.menu.showScreen('MENU');
  }

  start() {
    this.menu.showScreen('MENU');
    this._loop(0);
  }

  _handleMenuAction(action) {
    switch (action) {
      case 'charSelect':
      case 'showCharSelect':
        this.menu.hideAll();
        this.charSelect.show();
        break;
      case 'replay':
        this.menu.hideAll();
        this.charSelect.show();
        break;
      case 'mainMenu':
        this.input.enabled = false;
        document.exitPointerLock();
        this.menu.showScreen('MENU');
        break;
    }
  }

  _startGame(charId) {
    this.menu.hideAll();
    this.charSelect.hide();
    this.menu.showScreen('LOADING');

    // Simulate loading
    let progress = 0;
    const tips = [
      'Génération du terrain...',
      'Placement des bâtiments...',
      'Chargement des armes...',
      'Déploiement des bots...',
      'Préparation de la tempête...',
      'Prêt!'
    ];

    const loadInterval = setInterval(() => {
      progress += 8 + Math.random() * 12;
      if (progress > 100) progress = 100;
      const tipIdx = Math.min(tips.length - 1, Math.floor(progress / 20));
      this.menu.updateLoading(progress, tips[tipIdx]);

      if (progress >= 100) {
        clearInterval(loadInterval);
        setTimeout(() => {
          this.menu.hideAll();
          this._initGame(charId);
        }, 300);
      }
    }, 150);
  }

  _initGame(charId) {
    this.state = 'PLAYING';
    this.input.enabled = true;
    this.gameTime = 0;

    // Clear previous
    while (this.engine.scene.children.length > 3) {
      this.engine.scene.remove(this.engine.scene.children[this.engine.scene.children.length - 1]);
    }

    // Map
    this.map = new GameMap();
    this.map.addToScene(this.engine.scene);

    // Ground physics body
    const groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: this.physics.groundMaterial
    });
    groundBody.quaternion.setFromEulerAngles(-Math.PI / 2, 0, 0);
    this.physics.addBody(groundBody);

    // Storm
    this.storm = new Storm();
    this.storm.addToScene(this.engine.scene);

    // Player
    const charData = { ...CHARACTERS[charId], id: charId };
    this.player = new Player(charData);

    // Spawn in a random zone
    const spawnZone = ZONES[Math.floor(Math.random() * (ZONES.length - 1))];
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = Math.random() * spawnZone.r * 0.5;
    const sx = spawnZone.x + Math.cos(spawnAngle) * spawnDist;
    const sz = spawnZone.z + Math.sin(spawnAngle) * spawnDist;
    const sy = this.map.terrain.getHeightAt(sx, sz) + 3;

    this.player.body.position.set(sx, sy, sz);
    this.player.body.material = this.physics.playerMaterial;
    this.physics.addBody(this.player.body);
    this.engine.scene.add(this.player.mesh);

    // Give player a starting weapon
    const startWeapon = { ...WEAPONS.laser, id: 'laser', currentAmmo: WEAPONS.laser.ammo };
    this.inventory.add(startWeapon);

    // Bots
    this.bots = [];
    for (let i = 0; i < 20; i++) {
      const bot = new Bot(i, this.map.terrain);
      const zone = ZONES[i % ZONES.length];
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * zone.r * 0.7;
      const bx = zone.x + Math.cos(angle) * dist;
      const bz = zone.z + Math.sin(angle) * dist;
      const by = this.map.terrain.getHeightAt(bx, bz) + 3;

      bot.body.position.set(bx, by, bz);
      this.physics.addBody(bot.body);
      this.engine.scene.add(bot.mesh);

      // Give some bots weapons
      if (Math.random() > 0.3) {
        bot.equipWeapon(getRandomWeapon());
      }

      this.bots.push(bot);
    }

    // Chests
    this.chests = [];
    for (const zone of ZONES) {
      const chestCount = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < chestCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * zone.r * 0.6;
        const cx = zone.x + Math.cos(angle) * dist;
        const cz = zone.z + Math.sin(angle) * dist;
        const cy = this.map.terrain.getHeightAt(cx, cz) + 0.5;
        const chest = new Chest(cx, cy, cz);
        this.engine.scene.add(chest.group);
        this.chests.push(chest);
      }
    }

    // Projectiles
    this.projectiles = [];

    // HUD
    this.hud.build();
    this.hud.show();

    this.lastTime = performance.now() / 1000;
  }

  _loop(timestamp) {
    this._animFrame = requestAnimationFrame((t) => this._loop(t));

    if (this.state !== 'PLAYING') {
      this.engine.render();
      return;
    }

    const now = timestamp / 1000;
    const dt = Math.min(now - this.lastTime, 0.05);
    this.lastTime = now;
    this.gameTime += dt;

    this._update(dt);
    this.engine.render();
  }

  _update(dt) {
    // Physics
    this.physics.step(dt);

    // Player
    if (this.player && this.player.alive) {
      this.player.update(dt, this.input, this.engine.camera, this.map.terrain);

      // Shooting
      if (this.input.mouseDown && this.input.isPointerLocked()) {
        const weapon = this.inventory.getActive();
        if (weapon) {
          const result = this.player.shoot(this.engine.scene, weapon, this.bots);
          if (result) {
            this.sound.playShoot(weapon.id);
            if (Array.isArray(result)) {
              this.projectiles.push(...result);
            } else {
              this.projectiles.push(result);
            }
          }
        }
      }

      // Ability
      if (this.input.isDown('KeyF')) {
        this.player.useAbility(this.engine.scene, this.bots);
        if (this.player.abilityCooldown === this.player.abilityMaxCD) {
          this.sound.playAbility();
        }
      }

      // Interact with chests
      if (this.input.isDown('KeyE')) {
        this._interactChest();
      }

      // Inventory slot keys
      for (let i = 0; i < 5; i++) {
        if (this.input.isDown(`Digit${i + 1}`)) {
          this.inventory.use(i);
        }
      }

      // Storm damage
      if (this.storm.isOutside(this.player.body.position.x, this.player.body.position.z)) {
        this.player.takeDamage(this.storm.getStormDamage(dt));
      }

      // Death check
      if (!this.player.alive) {
        this._onPlayerDeath();
      }
    }

    // Bots
    const playerPos = this.player && this.player.alive ? this.player.body.position : null;
    for (const bot of this.bots) {
      if (!bot.alive) continue;
      const prevAlive = bot.alive;
      bot.update(dt, playerPos, this.storm, this.engine.scene);

      // Collect bot projectiles
      if (bot.weapon && bot.state === 'combat' && playerPos) {
        // Bot shooting handled internally, projectile returned
      }

      // Check if bot died
      if (prevAlive && !bot.alive) {
        this.engine.scene.remove(bot.mesh);
        if (this.player) this.player.kills++;
        this.hud.addKill('Vous', bot.name);
      }
    }

    // Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (!proj.alive) {
        this.projectiles.splice(i, 1);
        continue;
      }

      const targets = proj.isEnemy ? (this.player && this.player.alive ? [this.player] : []) : this.bots;
      proj.update(dt, targets, this.map.terrain);

      if (!proj.alive) {
        this.sound.playHit();
        this.projectiles.splice(i, 1);
      }
    }

    // Storm
    this.storm.update(dt);

    // Chests
    for (const chest of this.chests) {
      chest.update(dt);
    }

    // Detect near chest
    let nearChest = false;
    if (this.player && this.player.alive) {
      for (const chest of this.chests) {
        if (chest.opened) continue;
        const dist = this.player.body.position.distanceTo(
          new CANNON.Vec3(chest.getPosition().x, chest.getPosition().y, chest.getPosition().z)
        );
        if (dist < 3) {
          nearChest = true;
          break;
        }
      }
    }

    // Current zone
    const currentZone = this.player
      ? this.map.getZoneAt(this.player.body.position.x, this.player.body.position.z)
      : null;

    // HUD
    this.hud.update({
      player: this.player,
      bots: this.bots,
      chests: this.chests,
      storm: this.storm,
      inventory: this.inventory,
      currentZone,
      nearChest
    });

    // Win check
    const aliveBots = this.bots.filter(b => b.alive).length;
    if (aliveBots === 0 && this.player && this.player.alive) {
      this._onWin();
    }
  }

  _interactChest() {
    if (!this.player || !this.player.alive) return;

    for (const chest of this.chests) {
      if (chest.opened) continue;
      const dist = this.player.body.position.distanceTo(
        new CANNON.Vec3(chest.getPosition().x, chest.getPosition().y, chest.getPosition().z)
      );
      if (dist < 3) {
        const items = chest.open();
        this.sound.playChestOpen();
        for (const item of items) {
          this.inventory.add(item);
        }
        break;
      }
    }
  }

  _onPlayerDeath() {
    this.state = 'DEAD';
    this.input.enabled = false;
    document.exitPointerLock();
    this.hud.hide();
    const aliveBots = this.bots.filter(b => b.alive).length;
    const mins = Math.floor(this.gameTime / 60);
    const secs = Math.floor(this.gameTime % 60);
    this.menu.showScreen('DEAD', {
      position: aliveBots + 1,
      kills: this.player.kills,
      duration: `${mins}:${secs.toString().padStart(2, '0')}`,
      damage: 0
    });
  }

  _onWin() {
    this.state = 'WIN';
    this.input.enabled = false;
    document.exitPointerLock();
    this.hud.hide();
    const mins = Math.floor(this.gameTime / 60);
    const secs = Math.floor(this.gameTime % 60);
    this.menu.showScreen('WIN', {
      kills: this.player.kills,
      duration: `${mins}:${secs.toString().padStart(2, '0')}`
    });
  }

  resize(w, h) {
    this.engine.resize(w, h);
  }

  pause() {
    this.state = 'PAUSED';
  }
}

// Make CANNON available globally for Game.js usage
import * as CANNON from 'cannon-es';
