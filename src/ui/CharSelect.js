import { CHARACTERS } from '../characters/CharacterData.js';

const SKIN_IMAGES = {
  arctic: '/skins/arctic.webp',
  desert: '/skins/desert.webp',
  cyber: '/skins/cyber.webp',
  crystal: '/skins/crystal.webp'
};

export class CharSelect {
  constructor(onSelect) {
    this.onSelect = onSelect;
    this.selected = 'arctic';
  }

  show() {
    const existing = document.getElementById('char-select-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'char-select-overlay';
    overlay.style.cssText = `
      position:absolute; inset:0; display:flex; flex-direction:column;
      align-items:center; justify-content:center;
      background:rgba(5,5,15,0.95); z-index:110; pointer-events:auto;
      font-family:'Courier New',monospace;
    `;

    const title = document.createElement('h2');
    title.textContent = 'CHOISIS TON HÉROS';
    title.style.cssText = 'color:#00ffcc;font-size:28px;margin-bottom:30px;letter-spacing:4px;';
    overlay.appendChild(title);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:16px;max-width:900px;padding:0 20px;';

    for (const [id, char] of Object.entries(CHARACTERS)) {
      const card = document.createElement('div');
      card.dataset.charId = id;
      const colorHex = '#' + char.color.toString(16).padStart(6, '0');
      card.style.cssText = `
        background:rgba(15,15,30,0.9);
        border:2px solid ${id === this.selected ? colorHex : 'rgba(255,255,255,0.1)'};
        border-radius:8px; padding:16px; cursor:pointer; transition:all 0.3s;
        text-align:center; min-width:180px;
      `;

      card.innerHTML = `
        <div style="width:100%;height:180px;overflow:hidden;border-radius:6px;margin-bottom:12px;background:rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <img src="${SKIN_IMAGES[id]}" alt="${char.name}"
            style="height:100%;width:auto;object-fit:contain;"
            onerror="this.style.display='none';this.parentElement.innerHTML+='<div style=\\'font-size:60px;\\'>🎮</div>'"
          />
        </div>
        <h3 style="color:${colorHex};font-size:15px;margin-bottom:6px;">${char.name}</h3>
        <div style="font-size:11px;color:#888;margin-bottom:10px;">${char.ability}</div>
        <div style="font-size:10px;color:#666;text-align:left;">
          <div style="display:flex;justify-content:space-between;margin:3px 0;">
            <span>PV</span>
            <div style="width:80px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin-top:2px;">
              <div style="width:${char.hp / 1.5}%;height:100%;background:${colorHex};border-radius:3px;"></div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;margin:3px 0;">
            <span>Bouclier</span>
            <div style="width:80px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin-top:2px;">
              <div style="width:${char.maxShield}%;height:100%;background:#0088ff;border-radius:3px;"></div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;margin:3px 0;">
            <span>Vitesse</span>
            <div style="width:80px;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin-top:2px;">
              <div style="width:${char.speed * 13}%;height:100%;background:#44ff88;border-radius:3px;"></div>
            </div>
          </div>
        </div>
        <div style="margin-top:8px;font-size:9px;color:#555;font-style:italic;">${char.desc}</div>
      `;

      card.onmouseover = () => {
        if (id !== this.selected) card.style.borderColor = 'rgba(0,255,204,0.4)';
      };
      card.onmouseout = () => {
        if (id !== this.selected) card.style.borderColor = 'rgba(255,255,255,0.1)';
      };
      card.onclick = () => {
        this.selected = id;
        // Update all cards borders
        grid.querySelectorAll('[data-char-id]').forEach(c => {
          const cid = c.dataset.charId;
          const cc = '#' + CHARACTERS[cid].color.toString(16).padStart(6, '0');
          c.style.borderColor = cid === id ? cc : 'rgba(255,255,255,0.1)';
        });
      };

      grid.appendChild(card);
    }

    overlay.appendChild(grid);

    // Buttons
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:16px;margin-top:30px;';

    const backBtn = document.createElement('button');
    backBtn.textContent = 'RETOUR';
    backBtn.style.cssText = `
      background:transparent;border:1px solid rgba(255,255,255,0.2);color:#888;
      padding:12px 30px;font-size:14px;font-family:'Courier New',monospace;
      cursor:pointer;border-radius:4px;letter-spacing:2px;
    `;
    backBtn.onclick = () => {
      overlay.remove();
      if (this.onBack) this.onBack();
    };

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'CONFIRMER';
    confirmBtn.style.cssText = `
      background:rgba(0,255,204,0.1);border:1px solid #00ffcc;color:#00ffcc;
      padding:12px 30px;font-size:14px;font-family:'Courier New',monospace;
      cursor:pointer;border-radius:4px;letter-spacing:2px;
    `;
    confirmBtn.onclick = () => {
      overlay.remove();
      this.onSelect(this.selected);
    };

    btnRow.appendChild(backBtn);
    btnRow.appendChild(confirmBtn);
    overlay.appendChild(btnRow);

    document.getElementById('ui').appendChild(overlay);
  }

  hide() {
    const el = document.getElementById('char-select-overlay');
    if (el) el.remove();
  }
}
