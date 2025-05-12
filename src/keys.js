const controlKeys = new Set([
  "ShiftLeft",
  "ShiftRight",
  "Space",
  "KeyE",
  "KeyQ",
  "KeyW",
  "KeyS",
  "KeyA",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Enter",
]);

export function createKeys() {
  return {
    keys: {},
    toggleState: {},
    changedKeys: {},

    oneIsPressed: function (...keyCodes) {
      for (const keyCode of keyCodes) {
        if (this.keys[keyCode]) {
          return true;
        }
      }
      return false;
    },

    oneIsNowTrue: function (...keyCodes) {
      for (const keyCode of keyCodes) {
        if (this.changedKeys[keyCode]) {
          return true;
        }
      }
      return false;
    },

    setPressed: function (keyCode, isPressed) {
      const changed = this.keys[keyCode] !== isPressed;
      this.keys[keyCode] = isPressed;
      if (changed && isPressed) {
        this.toggleState[keyCode] = !this.toggleState[keyCode];
      }
      return changed;
    },

    isPressed: function (key) {
      return !!this.keys[key];
    },

    clearChanges: function () {
      this.changedKeys = {};
    },

    setupHandlers: function (handleKeyChange) {
      document.addEventListener("keydown", (event) => {
        const isChanged = this.setPressed(event.code, true);
        if (isChanged) {
          this.changedKeys[event.code] = true;
        }
        handleKeyChange(event.code, isChanged, true);
        if (controlKeys.has(event.code)) {
          event.preventDefault();
        }
      });

      document.addEventListener("keyup", (event) => {
        const isChanged = this.setPressed(event.code, false);
        if (isChanged) {
          this.changedKeys[event.code] = false;
        }
        handleKeyChange(event.code, isChanged, false);
        if (controlKeys.has(event.code)) {
          event.preventDefault();
        }
      });

      window.addEventListener("blur", () => {
        for (const key in this.keys) {
          if (this.keys[key]) {
            this.setPressed(key, false);
            this.changedKeys[key] = false;
          }
        }
      });
    },
  };
}