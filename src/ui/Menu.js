export class Menu {
  constructor(onAction) {
    this.container = document.getElementById('ui');
    this.onAction = onAction;
    this.currentScreen = null;
    this._overlay = null;
  }

  showScreen(name, data = {}) {
    this.hideAll();
    this.currentScreen = name;

    this._overlay = document.createElement('div');
    this._overlay.id = 'menu-overlay';
    this._overlay.style.cssText = `
      position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
      background:rgba(5,5,15,0.95); z-index:100; pointer-events:auto;
      font-family:'Courier New',monospace;
    `;

    switch (name) {
      case 'MENU': this._buildMainMenu(); break;
      case 'CHAR_SELECT': this._buildCharSelect(data); break;
      case 'LOADING': this._buildLoading(); break;
      case 'DEAD': this._buildDead(data); break;
      case 'WIN': this._buildWin(data); break;
    }

    this.container.appendChild(this._overlay);
  }

  _buildMainMenu() {
    this._overlay.innerHTML = `
      <div style="text-align:center;">
        <h1 style="
          font-size:72px; font-weight:900; letter-spacing:8px; margin-bottom:8px;
          background:linear-gradient(135deg,#00ffcc,#4488ff,#ff44ff);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          text-shadow:none; filter:drop-shadow(0 0 30px rgba(0,255,204,0.3));
        ">STRATNITE</h1>
        <p style="color:#00ffcc;opacity:0.6;font-size:14px;margin-bottom:50px;letter-spacing:4px;">BATTLE ROYALE</p>
        <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
          ${this._menuBtn('JOUER', 'play')}
          ${this._menuBtn('CONTRÔLES', 'controls')}
        </div>
        <div id="controls-panel" style="display:none;margin-top:30px;color:#888;font-size:12px;text-align:left;max-width:300px;margin-left:auto;margin-right:auto;">
          <p>WASD — Déplacement</p>
          <p>Souris — Regarder</p>
          <p>Clic gauche — Tirer</p>
          <p>Espace — Sauter</p>
          <p>E — Interagir</p>
          <p>F — Capacité spéciale</p>
          <p>1-5 — Changer d'arme</p>
          <p>Molette — Zoom</p>
        </div>
      </div>
    `;

    this._overlay.querySelector('[data-action="play"]').onclick = () => {
      this.onAction('charSelect');
    };
    this._overlay.querySelector('[data-action="controls"]').onclick = () => {
      const panel = document.getElementById('controls-panel');
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    };
  }

  _buildCharSelect(data) {
    // Delegated to CharSelect component
    if (this.onAction) this.onAction('showCharSelect');
  }

  _buildLoading() {
    this._overlay.innerHTML = `
      <div style="text-align:center;width:400px;">
        <h2 style="color:#00ffcc;font-size:24px;margin-bottom:30px;letter-spacing:4px;">CHARGEMENT</h2>
        <div style="background:rgba(0,255,204,0.1);border-radius:8px;height:12px;overflow:hidden;border:1px solid rgba(0,255,204,0.3);">
          <div id="loading-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#00ffcc,#4488ff);border-radius:8px;transition:width 0.3s;"></div>
        </div>
        <p id="loading-tip" style="color:#666;font-size:11px;margin-top:20px;">Génération du terrain...</p>
      </div>
    `;
  }

  updateLoading(pct, tip) {
    const bar = document.getElementById('loading-bar');
    const tipEl = document.getElementById('loading-tip');
    if (bar) bar.style.width = pct + '%';
    if (tipEl && tip) tipEl.textContent = tip;
  }

  _buildDead(data) {
    this._overlay.innerHTML = `
      <div style="text-align:center;">
        <h2 style="color:#ff4444;font-size:42px;margin-bottom:10px;">ÉLIMINÉ</h2>
        <p style="color:#888;font-size:14px;margin-bottom:30px;">Position #${data.position || '?'}</p>
        <div style="color:#aaa;font-size:13px;margin-bottom:30px;">
          <p>Kills : ${data.kills || 0}</p>
          <p>Durée : ${data.duration || '0:00'}</p>
          <p>Dégâts infligés : ${data.damage || 0}</p>
        </div>
        ${this._menuBtn('REJOUER', 'replay')}
        <div style="margin-top:12px;">${this._menuBtn('MENU', 'menu')}</div>
      </div>
    `;

    this._overlay.querySelector('[data-action="replay"]').onclick = () => this.onAction('replay');
    this._overlay.querySelector('[data-action="menu"]').onclick = () => this.onAction('mainMenu');
  }

  _buildWin(data) {
    this._overlay.innerHTML = `
      <div style="text-align:center;">
        <h2 style="
          font-size:48px;margin-bottom:10px;
          background:linear-gradient(135deg,#ffd700,#ffaa00,#ff8800);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;
          filter:drop-shadow(0 0 20px rgba(255,215,0,0.4));
        ">VICTOIRE ROYALE</h2>
        <p style="color:#ffd700;font-size:14px;margin-bottom:30px;">🏆</p>
        <div style="color:#aaa;font-size:13px;margin-bottom:30px;">
          <p>Kills : ${data.kills || 0}</p>
          <p>Durée : ${data.duration || '0:00'}</p>
        </div>
        ${this._menuBtn('REJOUER', 'replay')}
        <div style="margin-top:12px;">${this._menuBtn('MENU', 'menu')}</div>
      </div>
    `;

    this._overlay.querySelector('[data-action="replay"]').onclick = () => this.onAction('replay');
    this._overlay.querySelector('[data-action="menu"]').onclick = () => this.onAction('mainMenu');
  }

  _menuBtn(label, action) {
    return `<button data-action="${action}" style="
      background:transparent; border:1px solid rgba(0,255,204,0.4); color:#00ffcc;
      padding:12px 40px; font-size:16px; font-family:'Courier New',monospace;
      letter-spacing:3px; cursor:pointer; border-radius:4px;
      transition:all 0.2s; min-width:200px;
    " onmouseover="this.style.background='rgba(0,255,204,0.15)';this.style.borderColor='#00ffcc'"
       onmouseout="this.style.background='transparent';this.style.borderColor='rgba(0,255,204,0.4)'"
    >${label}</button>`;
  }

  hideAll() {
    this.currentScreen = null;
    const existing = document.getElementById('menu-overlay');
    if (existing) existing.remove();
    const charSelect = document.getElementById('char-select-overlay');
    if (charSelect) charSelect.remove();
  }

  isVisible() {
    return this.currentScreen !== null;
  }
}
