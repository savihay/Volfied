export default class Input {
  constructor() {
    this.keys = {};
    // Touch state
    this.touchDir = null;  // [dx, dy] from virtual d-pad
    this.touchSpace = false;
    this.touchEnter = false;

    this._onDown = (e) => {
      const tracked = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD',
        'Enter', 'Escape', 'KeyP', 'KeyM',
      ];
      if (tracked.includes(e.code)) e.preventDefault();
      this.keys[e.code] = true;
    };
    this._onUp = (e) => {
      this.keys[e.code] = false;
    };
  }

  attach() {
    window.addEventListener('keydown', this._onDown);
    window.addEventListener('keyup', this._onUp);
  }

  detach() {
    window.removeEventListener('keydown', this._onDown);
    window.removeEventListener('keyup', this._onUp);
  }

  // Returns [dx, dy] or null. Vertical priority (matches original arcade).
  getDir() {
    const k = this.keys;
    if (k.ArrowUp || k.KeyW) return [0, -1];
    if (k.ArrowDown || k.KeyS) return [0, 1];
    if (k.ArrowLeft || k.KeyA) return [-1, 0];
    if (k.ArrowRight || k.KeyD) return [1, 0];
    // Touch d-pad fallback
    if (this.touchDir) return this.touchDir;
    return null;
  }

  isPressed(code) {
    return !!this.keys[code];
  }

  isSpace() {
    return !!this.keys.Space || this.touchSpace;
  }

  isPause() {
    return !!this.keys.Escape || !!this.keys.KeyP;
  }

  isEnter() {
    return !!this.keys.Enter || this.touchEnter;
  }

  isMuteToggle() {
    return !!this.keys.KeyM;
  }

  consumeKey(code) {
    if (code === 'Enter' && this.touchEnter) {
      this.touchEnter = false;
      return true;
    }
    if (code === 'Space' && this.touchSpace) {
      // Don't consume space from touch - it's held
      return false;
    }
    if (this.keys[code]) {
      this.keys[code] = false;
      return true;
    }
    return false;
  }

  // Touch control setters (called from React overlay)
  setTouchDir(dir) {
    this.touchDir = dir;
  }

  setTouchSpace(pressed) {
    this.touchSpace = pressed;
  }

  setTouchEnter() {
    this.touchEnter = true;
  }
}
