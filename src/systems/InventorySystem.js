export class InventorySystem {
  constructor() {
    this.slots = [null, null, null, null, null];
    this.activeSlot = 0;
    this._listeners = [];
  }

  add(item) {
    // Try to find empty slot
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i] === null) {
        this.slots[i] = item;
        this._emit();
        return true;
      }
    }
    // Replace active slot
    this.slots[this.activeSlot] = item;
    this._emit();
    return true;
  }

  remove(slot) {
    if (slot >= 0 && slot < this.slots.length) {
      const item = this.slots[slot];
      this.slots[slot] = null;
      this._emit();
      return item;
    }
    return null;
  }

  swap(a, b) {
    if (a >= 0 && a < 5 && b >= 0 && b < 5) {
      const temp = this.slots[a];
      this.slots[a] = this.slots[b];
      this.slots[b] = temp;
      this._emit();
    }
  }

  use(slot) {
    this.activeSlot = Math.max(0, Math.min(4, slot));
    this._emit();
  }

  getActive() {
    return this.slots[this.activeSlot];
  }

  onChange(fn) {
    this._listeners.push(fn);
  }

  _emit() {
    for (const fn of this._listeners) fn(this);
  }

  handleInput(input) {
    // Number keys 1-5
    for (let i = 0; i < 5; i++) {
      if (input.isDown(`Digit${i + 1}`)) {
        this.use(i);
      }
    }
    // Mouse wheel
    const wheel = input.getWheelDelta();
    if (wheel > 0) {
      this.use((this.activeSlot + 1) % 5);
    } else if (wheel < 0) {
      this.use((this.activeSlot + 4) % 5);
    }
  }
}
