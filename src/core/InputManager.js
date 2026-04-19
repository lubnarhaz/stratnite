export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Map();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.mouseDown = false;
    this.mouseButtons = 0;
    this.sensitivity = 0.002;
    this._locked = false;
    this.enabled = false;

    // Touch state
    this.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.touchMove = { x: 0, y: 0 };  // joystick direction
    this.touchLook = { dx: 0, dy: 0 }; // camera delta
    this.touchShooting = false;
    this._activeTouches = {};

    this._wheelDelta = 0;

    // Keyboard
    this._onKeyDown = (e) => { this.keys.set(e.code, true); e.preventDefault(); };
    this._onKeyUp = (e) => { this.keys.set(e.code, false); };

    // Mouse
    this._onMouseMove = (e) => {
      if (this._locked) {
        this.mouseDX += e.movementX;
        this.mouseDY += e.movementY;
      }
    };
    this._onMouseDown = (e) => {
      this.mouseDown = true;
      this.mouseButtons = e.buttons;
      if (!this._locked && this.enabled && e.target === this.canvas) {
        this.canvas.requestPointerLock();
      }
    };
    this._onMouseUp = () => { this.mouseDown = false; this.mouseButtons = 0; };
    this._onPointerLockChange = () => {
      this._locked = document.pointerLockElement === this.canvas;
    };
    this._onWheel = (e) => { this._wheelDelta = e.deltaY; };

    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mouseup', this._onMouseUp);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
    document.addEventListener('wheel', this._onWheel);

    // Touch controls
    if (this.isMobile) {
      this._setupTouchControls();
    }
  }

  _setupTouchControls() {
    // Create mobile UI overlay
    this._touchUI = document.createElement('div');
    this._touchUI.id = 'touch-controls';
    this._touchUI.style.cssText = 'position:absolute;inset:0;z-index:50;pointer-events:none;display:none;';

    // Left joystick area
    const joyArea = document.createElement('div');
    joyArea.style.cssText = `
      position:absolute; bottom:30px; left:30px; width:140px; height:140px;
      border-radius:50%; background:rgba(255,255,255,0.1);
      border:2px solid rgba(255,255,255,0.25); pointer-events:auto;
    `;
    const joyKnob = document.createElement('div');
    joyKnob.id = 'joy-knob';
    joyKnob.style.cssText = `
      position:absolute; top:50%; left:50%; width:50px; height:50px;
      margin:-25px 0 0 -25px; border-radius:50%;
      background:rgba(255,255,255,0.35); border:2px solid rgba(255,255,255,0.4);
    `;
    joyArea.appendChild(joyKnob);
    this._touchUI.appendChild(joyArea);

    // Right side - shoot button
    const shootBtn = document.createElement('div');
    shootBtn.style.cssText = `
      position:absolute; bottom:40px; right:40px; width:80px; height:80px;
      border-radius:50%; background:rgba(255,60,60,0.35);
      border:2px solid rgba(255,100,100,0.5); pointer-events:auto;
      display:flex; align-items:center; justify-content:center;
      font-size:28px; color:rgba(255,255,255,0.7);
    `;
    shootBtn.textContent = '🎯';
    this._touchUI.appendChild(shootBtn);

    // Jump button
    const jumpBtn = document.createElement('div');
    jumpBtn.style.cssText = `
      position:absolute; bottom:140px; right:45px; width:60px; height:60px;
      border-radius:50%; background:rgba(100,200,255,0.3);
      border:2px solid rgba(100,200,255,0.4); pointer-events:auto;
      display:flex; align-items:center; justify-content:center;
      font-size:18px; color:rgba(255,255,255,0.7);
    `;
    jumpBtn.textContent = '⬆';
    this._touchUI.appendChild(jumpBtn);

    // Ability button
    const abilBtn = document.createElement('div');
    abilBtn.style.cssText = `
      position:absolute; bottom:220px; right:50px; width:50px; height:50px;
      border-radius:50%; background:rgba(255,200,0,0.3);
      border:2px solid rgba(255,200,0,0.4); pointer-events:auto;
      display:flex; align-items:center; justify-content:center;
      font-size:16px; color:rgba(255,255,255,0.7);
    `;
    abilBtn.textContent = 'F';
    this._touchUI.appendChild(abilBtn);

    document.body.appendChild(this._touchUI);

    // Joystick touch handling
    let joyCenter = null;
    joyArea.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = joyArea.getBoundingClientRect();
      joyCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });
    joyArea.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!joyCenter) return;
      const touch = e.touches[0];
      const dx = (touch.clientX - joyCenter.x) / 60;
      const dy = (touch.clientY - joyCenter.y) / 60;
      this.touchMove.x = Math.max(-1, Math.min(1, dx));
      this.touchMove.y = Math.max(-1, Math.min(1, dy));
      joyKnob.style.transform = `translate(${dx * 25}px, ${dy * 25}px)`;
    });
    joyArea.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.touchMove.x = 0; this.touchMove.y = 0;
      joyKnob.style.transform = 'translate(0,0)';
      joyCenter = null;
    });

    // Shoot button
    shootBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.touchShooting = true; });
    shootBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.touchShooting = false; });

    // Jump button
    jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys.set('Space', true); });
    jumpBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys.set('Space', false); });

    // Ability
    abilBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys.set('KeyF', true); });
    abilBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys.set('KeyF', false); });

    // Camera look - touch on canvas (right half of screen)
    let lastLookTouch = null;
    this.canvas.addEventListener('touchstart', (e) => {
      for (const touch of e.changedTouches) {
        if (touch.clientX > window.innerWidth * 0.35) {
          lastLookTouch = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
        }
      }
    });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        if (lastLookTouch && touch.identifier === lastLookTouch.id) {
          this.touchLook.dx += (touch.clientX - lastLookTouch.x) * 0.004;
          this.touchLook.dy += (touch.clientY - lastLookTouch.y) * 0.004;
          lastLookTouch.x = touch.clientX;
          lastLookTouch.y = touch.clientY;
        }
      }
    });
    this.canvas.addEventListener('touchend', (e) => {
      for (const touch of e.changedTouches) {
        if (lastLookTouch && touch.identifier === lastLookTouch.id) {
          lastLookTouch = null;
        }
      }
    });
  }

  showTouchControls() {
    if (this._touchUI) this._touchUI.style.display = 'block';
  }

  hideTouchControls() {
    if (this._touchUI) this._touchUI.style.display = 'none';
  }

  isDown(code) {
    return this.keys.get(code) === true;
  }

  getMouseDelta() {
    // Combine mouse + touch look
    let dx = this.mouseDX * this.sensitivity + this.touchLook.dx;
    let dy = this.mouseDY * this.sensitivity + this.touchLook.dy;
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.touchLook.dx = 0;
    this.touchLook.dy = 0;
    return { dx, dy };
  }

  getWheelDelta() {
    const d = this._wheelDelta;
    this._wheelDelta = 0;
    return d;
  }

  isPointerLocked() {
    return this._locked || this.isMobile;
  }

  isShooting() {
    return this.mouseDown || this.touchShooting;
  }

  // Get mobile joystick movement as WASD equivalent
  getTouchMoveDir() {
    return this.touchMove;
  }

  destroy() {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mousedown', this._onMouseDown);
    document.removeEventListener('mouseup', this._onMouseUp);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    document.removeEventListener('wheel', this._onWheel);
  }
}
