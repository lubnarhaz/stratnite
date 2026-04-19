import { Minimap } from './Minimap.js';
import { RARITY_COLORS } from '../items/WeaponTypes.js';

export class HUD {
  constructor() {
    this.container = document.getElementById('ui');
    this.minimap = new Minimap();
    this.elements = {};
    this._killFeed = [];
    this._zoneBannerTimer = 0;
    this._lastZone = '';
    this._built = false;
  }

  build() {
    if (this._built) return;
    this._built = true;

    this.container.innerHTML = '';

    // Styles
    const style = document.createElement('style');
    style.textContent = `
      .hud-text { font-family: 'Courier New', monospace; color: #00ffcc; text-shadow: 0 0 8px rgba(0,255,204,0.5); }
      .hud-bar { height: 8px; border-radius: 4px; transition: width 0.2s; }
      .hud-panel { background: rgba(10,10,26,0.75); border: 1px solid rgba(0,255,204,0.2); border-radius: 4px; backdrop-filter: blur(4px); }
    `;
    this.container.appendChild(style);

    // Survivors count (top left)
    this.elements.survivors = this._createDiv(`
      position:absolute; top:12px; left:12px; padding:8px 14px; font-size:16px;
    `, 'hud-panel hud-text');

    // Storm timer (top center)
    this.elements.stormTimer = this._createDiv(`
      position:absolute; top:12px; left:50%; transform:translateX(-50%); padding:6px 16px; font-size:14px;
    `, 'hud-panel hud-text');

    // Zone banner (center)
    this.elements.zoneBanner = this._createDiv(`
      position:absolute; top:25%; left:50%; transform:translate(-50%,-50%);
      padding:12px 30px; font-size:24px; letter-spacing:3px; opacity:0;
      transition: opacity 0.5s;
    `, 'hud-panel hud-text');

    // HP & Shield bars (bottom center)
    this.elements.bars = this._createDiv(`
      position:absolute; bottom:80px; left:50%; transform:translateX(-50%);
      width:300px; padding:8px;
    `, 'hud-panel');

    this.elements.bars.innerHTML = `
      <div style="margin-bottom:4px;">
        <div style="background:rgba(0,150,255,0.2);border-radius:4px;height:8px;overflow:hidden;">
          <div id="hud-shield-bar" class="hud-bar" style="background:#0088ff;width:0%;"></div>
        </div>
      </div>
      <div>
        <div style="background:rgba(0,255,100,0.2);border-radius:4px;height:8px;overflow:hidden;">
          <div id="hud-hp-bar" class="hud-bar" style="background:#00ff66;width:100%;"></div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:4px;">
        <span id="hud-hp-text" class="hud-text" style="font-size:11px;"></span>
        <span id="hud-shield-text" class="hud-text" style="font-size:11px;color:#0088ff;"></span>
      </div>
    `;

    // Inventory (bottom center, above bars)
    this.elements.inventory = this._createDiv(`
      position:absolute; bottom:130px; left:50%; transform:translateX(-50%);
      display:flex; gap:4px;
    `, '');

    for (let i = 0; i < 5; i++) {
      const slot = document.createElement('div');
      slot.className = 'hud-panel';
      slot.id = `inv-slot-${i}`;
      slot.style.cssText = `
        width:52px; height:52px; display:flex; align-items:center; justify-content:center;
        font-size:22px; position:relative; cursor:pointer;
      `;
      slot.innerHTML = `<span class="hud-text" style="font-size:10px;position:absolute;top:2px;left:4px;">${i + 1}</span>`;
      this.elements.inventory.appendChild(slot);
    }

    // Ability gauge (bottom right)
    this.elements.ability = this._createDiv(`
      position:absolute; bottom:80px; right:20px; width:60px; height:60px;
    `, '');
    this.elements.ability.innerHTML = `
      <svg viewBox="0 0 60 60" style="width:60px;height:60px;">
        <circle cx="30" cy="30" r="26" fill="rgba(10,10,26,0.75)" stroke="rgba(0,255,204,0.2)" stroke-width="2"/>
        <circle id="hud-ability-ring" cx="30" cy="30" r="26" fill="none" stroke="#00ffcc"
          stroke-width="3" stroke-dasharray="163.36" stroke-dashoffset="0"
          transform="rotate(-90 30 30)" style="transition:stroke-dashoffset 0.3s;"/>
        <text id="hud-ability-text" x="30" y="34" text-anchor="middle" fill="#00ffcc"
          font-family="monospace" font-size="10">F</text>
      </svg>
    `;

    // Ammo counter (bottom right, above ability)
    this.elements.ammo = this._createDiv(`
      position:absolute; bottom:155px; right:20px; padding:6px 12px; font-size:18px; text-align:center;
    `, 'hud-panel hud-text');

    // Portrait (bottom left)
    this.elements.portrait = this._createDiv(`
      position:absolute; bottom:80px; left:20px; padding:8px; width:80px; text-align:center;
    `, 'hud-panel hud-text');

    // Kill feed (right side)
    this.elements.killFeed = this._createDiv(`
      position:absolute; top:60px; right:12px; width:220px; pointer-events:none;
    `, '');

    // Interact prompt
    this.elements.interact = this._createDiv(`
      position:absolute; bottom:200px; left:50%; transform:translateX(-50%);
      padding:8px 20px; font-size:14px; opacity:0; transition:opacity 0.3s;
    `, 'hud-panel hud-text');
    this.elements.interact.textContent = '[E] Ouvrir';

    // Crosshair
    this.elements.crosshair = this._createDiv(`
      position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
      width:20px; height:20px; pointer-events:none;
    `, '');
    this.elements.crosshair.innerHTML = `
      <svg viewBox="0 0 20 20" style="width:20px;height:20px;">
        <line x1="10" y1="3" x2="10" y2="8" stroke="#00ffcc" stroke-width="1.5" opacity="0.8"/>
        <line x1="10" y1="12" x2="10" y2="17" stroke="#00ffcc" stroke-width="1.5" opacity="0.8"/>
        <line x1="3" y1="10" x2="8" y2="10" stroke="#00ffcc" stroke-width="1.5" opacity="0.8"/>
        <line x1="12" y1="10" x2="17" y2="10" stroke="#00ffcc" stroke-width="1.5" opacity="0.8"/>
        <circle cx="10" cy="10" r="1" fill="#00ffcc" opacity="0.6"/>
      </svg>
    `;

    // Add minimap
    this.container.appendChild(this.minimap.getElement());
  }

  update(state) {
    if (!this._built) return;

    const { player, bots, chests, storm, inventory, currentZone } = state;

    // HP / Shield
    if (player) {
      const hpPct = (player.hp / player.maxHp * 100).toFixed(0);
      const shPct = player.maxShield > 0 ? (player.shield / player.maxShield * 100).toFixed(0) : 0;
      const hpBar = document.getElementById('hud-hp-bar');
      const shBar = document.getElementById('hud-shield-bar');
      if (hpBar) hpBar.style.width = hpPct + '%';
      if (shBar) shBar.style.width = shPct + '%';

      const hpText = document.getElementById('hud-hp-text');
      const shText = document.getElementById('hud-shield-text');
      if (hpText) hpText.textContent = `HP ${Math.ceil(player.hp)}/${player.maxHp}`;
      if (shText) shText.textContent = player.maxShield > 0 ? `🛡 ${Math.ceil(player.shield)}/${player.maxShield}` : '';

      // HP bar color
      if (hpBar) {
        if (player.hp / player.maxHp < 0.3) hpBar.style.background = '#ff4444';
        else if (player.hp / player.maxHp < 0.6) hpBar.style.background = '#ffaa00';
        else hpBar.style.background = '#00ff66';
      }
    }

    // Survivors
    const alive = bots ? bots.filter(b => b.alive).length + (player && player.alive ? 1 : 0) : 0;
    this.elements.survivors.textContent = `👥 ${alive} survivants`;

    // Storm timer
    if (storm) {
      const tl = storm.getTimeLeft();
      this.elements.stormTimer.innerHTML = `⚡ Zone ${storm.currentPhase + 1} — ${tl}s`;
      if (storm.shrinking) {
        this.elements.stormTimer.style.color = '#ff4444';
      } else {
        this.elements.stormTimer.style.color = '#00ffcc';
      }
    }

    // Zone banner
    if (currentZone && currentZone.name !== this._lastZone) {
      this._lastZone = currentZone.name;
      this.elements.zoneBanner.textContent = currentZone.name;
      this.elements.zoneBanner.style.opacity = '1';
      this._zoneBannerTimer = 2.5;
    }
    if (this._zoneBannerTimer > 0) {
      this._zoneBannerTimer -= 0.016;
      if (this._zoneBannerTimer <= 0) {
        this.elements.zoneBanner.style.opacity = '0';
      }
    }

    // Inventory
    if (inventory) {
      for (let i = 0; i < 5; i++) {
        const slot = document.getElementById(`inv-slot-${i}`);
        if (!slot) continue;
        const item = inventory.slots[i];
        const isActive = i === inventory.activeSlot;
        slot.style.borderColor = isActive ? '#00ffcc' : 'rgba(0,255,204,0.2)';
        slot.style.background = isActive ? 'rgba(0,255,204,0.15)' : 'rgba(10,10,26,0.75)';

        // Keep slot number, update content
        const numLabel = `<span class="hud-text" style="font-size:10px;position:absolute;top:2px;left:4px;">${i + 1}</span>`;
        if (item) {
          const rarColor = RARITY_COLORS[item.rar] || '#aaa';
          slot.innerHTML = numLabel + `
            <span style="font-size:20px;">${item.icon}</span>
            <span style="position:absolute;bottom:2px;right:4px;font-size:8px;color:${rarColor};font-family:monospace;">
              ${item.currentAmmo >= 0 ? item.currentAmmo : '∞'}
            </span>
          `;
        } else {
          slot.innerHTML = numLabel;
        }
      }

      // Ammo
      const active = inventory.getActive();
      if (active) {
        this.elements.ammo.innerHTML = `${active.icon} ${active.currentAmmo >= 0 ? active.currentAmmo : '∞'}`;
        this.elements.ammo.style.opacity = '1';
      } else {
        this.elements.ammo.style.opacity = '0.3';
        this.elements.ammo.textContent = '—';
      }
    }

    // Ability
    if (player) {
      const ring = document.getElementById('hud-ability-ring');
      const text = document.getElementById('hud-ability-text');
      const cdPct = player.abilityCooldown > 0
        ? player.abilityCooldown / player.abilityMaxCD
        : 0;
      if (ring) ring.setAttribute('stroke-dashoffset', (cdPct * 163.36).toString());
      if (text) {
        text.textContent = player.abilityCooldown > 0
          ? Math.ceil(player.abilityCooldown).toString()
          : 'F';
        text.setAttribute('fill', player.abilityCooldown > 0 ? '#666' : '#00ffcc');
      }
    }

    // Portrait
    if (player && player.charData) {
      const c = player.charData;
      this.elements.portrait.innerHTML = `
        <div style="font-size:11px;margin-bottom:4px;">${c.name}</div>
        <div style="font-size:9px;color:#888;">${c.ability}</div>
      `;
    }

    // Minimap
    this.minimap.update(player, bots, chests, storm, player && player._radarActive);

    // Interact prompt
    this.elements.interact.style.opacity = state.nearChest ? '1' : '0';

    // Kill feed cleanup
    this._killFeed = this._killFeed.filter(k => k.time > 0);
  }

  addKill(killerName, victimName) {
    const entry = document.createElement('div');
    entry.className = 'hud-text';
    entry.style.cssText = 'font-size:11px;margin-bottom:4px;opacity:1;transition:opacity 1s;padding:4px 8px;background:rgba(10,10,26,0.6);border-radius:3px;';
    entry.textContent = `${killerName} ▸ ${victimName}`;
    this.elements.killFeed.appendChild(entry);
    this._killFeed.push({ el: entry, time: 5 });

    setTimeout(() => {
      entry.style.opacity = '0';
      setTimeout(() => entry.remove(), 1000);
    }, 4000);
  }

  _createDiv(style, className) {
    const div = document.createElement('div');
    div.style.cssText = style;
    if (className) div.className = className;
    this.container.appendChild(div);
    return div;
  }

  hide() {
    this.container.style.display = 'none';
  }

  show() {
    this.container.style.display = 'block';
  }
}
