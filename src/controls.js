import { State } from './state';
import { createKeys } from './keys';

export class Controls {
  get jumpVelocity() { return State.default_jump_velocity || 22; }
  get linearFactor() { return 0.3 / State.slow_factor; }
  get rotationalFactor() { return 10 / State.slow_factor; }

  constructor(player) {
    this.player = player;
    this.keys = createKeys();

    // Set up key handlers
    this.keys.setupHandlers((code, isChanged, isPressed) => {
      if (isChanged) {
        this.handleKeyChange(code, isPressed);
      }
    });
  }

  handleKeyChange(code, isPressed) {
    // Handle specific key actions here if needed
    // For example, toggle camera or other game-specific actions
  }

  isDown(key) {
    return this.keys.oneIsPressed(key);
  }

  areDown(keyArray) {
    return keyArray.every(key => this.keys.oneIsPressed(key));
  }

  isAnyDown(keyArray) {
    return keyArray.some(key => this.keys.oneIsPressed(key));
  }

  getKeyStates() {
    return { ...this.keys.keys };
  }

  jump(scale = 2) {
    if (!this.player.rigidBody) return;
    const velocity = this.player.rigidBody.linvel();
    const newVel = {
      x: velocity.x,
      y: this.jumpVelocity * scale,
      z: velocity.z
    };
    this.player.rigidBody.setLinvel(newVel, true);
  }

  setupActions(terrain) {
    this.terrain = terrain;
    // const doAfterDelay = () => {
    //   this.jump();
    // };
    const delay = State.transition_time / 2;

    window.addEventListener('keyup', (e) => {
      switch(e.key.toLowerCase()) {
        case '=':
          this.terrain.setTarget(2); // "forward"
          // if (this.terrain.lastScale < 1) {
          //   // this.jump(); - was added to help a bug in the past
          //   setTimeout(doAfterDelay, delay);
          // }
          break;
        case '-':
          this.terrain.setTarget(this.terrain.lastScale);
          // if (this.terrain.lastScale > 1) {
          //   // this.jump(); - was added to help a bug in the past
          //   setTimeout(doAfterDelay, delay);
          // }
          break;
        case '0':
          this.terrain.setTarget(0);
          break;
        case '1':
          this.terrain.setTarget(1);
          break;
        case 'e':
          // legacy for Onyi and Steven
          this.terrain.setTarget(Math.random());
          break;
      }
    });
  }


  handleKeyPress() {
    if (!this.player.rigidBody || State.disable_arrows) return;

    const velocity = this.player.rigidBody.linvel();
    const angVelocity = this.player.rigidBody.angvel();
    let newVel = { x: velocity.x, y: velocity.y, z: velocity.z };
    let newAngVel = { x: angVelocity.x, y: angVelocity.y, z: angVelocity.z };

    const contactGround = this.player.isOnGround();
    const useLinearVelocity = !State.roll_only;

    if (this.keys.oneIsPressed('ArrowRight', 'KeyD')) {
      if (useLinearVelocity) {
        newVel.x += this.linearFactor;
        newVel.z -= this.linearFactor;
      }
      if (contactGround) {
        newAngVel.x -= this.rotationalFactor;
        newAngVel.z -= this.rotationalFactor;
      }
    }

    if (this.keys.oneIsPressed('ArrowLeft', 'KeyA')) {
      if (useLinearVelocity) {
        newVel.x -= this.linearFactor;
        newVel.z += this.linearFactor;
      }
      if (contactGround) {
        newAngVel.x += this.rotationalFactor;
        newAngVel.z += this.rotationalFactor;
      }
    }

    if (this.keys.oneIsPressed('ArrowUp', 'KeyW')) {
      if (useLinearVelocity) {
        newVel.x -= this.linearFactor;
        newVel.z -= this.linearFactor;
      }
      if (contactGround) {
        newAngVel.x -= this.rotationalFactor;
        newAngVel.z += this.rotationalFactor;
      }
    }

    if (this.keys.oneIsPressed('ArrowDown', 'KeyS')) {
      if (useLinearVelocity) {
        newVel.x += this.linearFactor;
        newVel.z += this.linearFactor;
      }
      if (contactGround) {
        newAngVel.x += this.rotationalFactor;
        newAngVel.z -= this.rotationalFactor;
      }
    }

    if (this.keys.oneIsPressed('Space') && contactGround) {
      newVel.y = this.jumpVelocity;
    }

    // Clamp velocities
    newVel = this.clampVector(newVel);
    newAngVel = this.clampVector(newAngVel);

    // Apply velocities
    this.player.rigidBody.setLinvel(newVel, true);
    this.player.rigidBody.setAngvel(newAngVel, true);
  }

  clampVector(vec) {
    return {
      x: Math.max(State.min_vector.x, Math.min(State.max_vector.x, vec.x)),
      y: Math.max(State.min_vector.y, Math.min(State.max_vector.y, vec.y)),
      z: Math.max(State.min_vector.z, Math.min(State.max_vector.z, vec.z))
    };
  }

  update() {
    // Call handleKeyPress during each update to process key states
    this.handleKeyPress();
  }
}