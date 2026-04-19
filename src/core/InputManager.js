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

    this._onKeyDown = (e) => {
      this.keys.set(e.code, true);
    };
    this._onKeyUp = (e) => {
      this.keys.set(e.code, false);
    };
    this._onMouseMove = (e) => {
      if (this._locked) {
        this.mouseDX += e.movementX;
        this.mouseDY += e.movementY;
      }
    };
    this._onMouseDown = (e) => {
      this.mouseDown = true;
      this.mouseButtons = e.buttons;
      if (!this._locked) {
        this.canvas.requestPointerLock();
      }
    };
    this._onMouseUp = () => {
      this.mouseDown = false;
      this.mouseButtons = 0;
    };
    this._onPointerLockChange = () => {
      this._locked = document.pointerLockElement === this.canvas;
    };
    this._onWheel = (e) => {
      this._wheelDelta = e.deltaY;
    };

    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mouseup', this._onMouseUp);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
    document.addEventListener('wheel', this._onWheel);

    this._wheelDelta = 0;
  }

  isDown(code) {
    return this.keys.get(code) === true;
  }

  getMouseDelta() {
    const dx = this.mouseDX * this.sensitivity;
    const dy = this.mouseDY * this.sensitivity;
    this.mouseDX = 0;
    this.mouseDY = 0;
    return { dx, dy };
  }

  getWheelDelta() {
    const d = this._wheelDelta;
    this._wheelDelta = 0;
    return d;
  }

  isPointerLocked() {
    return this._locked;
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
