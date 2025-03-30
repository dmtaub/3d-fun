import { State } from './state';

export class Controls {
  constructor(player) {
    this.player = player;
    this.jumpVelocity = State.default_jump_velocity || 22;
    this.linearDamping = 0.5;
    this.angularDamping = 0.8;
    this.linearFactor = 0.3 * State.slow_factor;
    this.rotationalFactor = 10 * State.slow_factor;

    // Set up keyboard controls with repeat
    this.keys = {};
    this.keyIntervals = {};

    window.addEventListener('keydown', (e) => {
      if (!this.keys[e.key]) {
        this.keys[e.key] = true;
        // console.log("KEY DOWN: ", e.key);
        this.handleKeyPress(e.key);
        // Start interval for held keys
        this.keyIntervals[e.key] = setInterval(() => {
          this.handleKeyPress(e.key);
        }, 16); // ~60fps - TODO: confirm, make dynamic
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
      if (this.keyIntervals[e.key]) {
        clearInterval(this.keyIntervals[e.key]);
        delete this.keyIntervals[e.key];
      }
    });

    // Add convenience methods for querying key states
    this.isDown = this.isDown.bind(this);
    this.areDown = this.areDown.bind(this);
    this.isAnyDown = this.isAnyDown.bind(this);
  }

  // Returns true if the specified key is currently pressed down
  isDown(key) {
    return this.keys[key] === true;
  }

  // Returns true if all of the specified keys are currently pressed down
  areDown(keyArray) {
    return keyArray.every(key => this.isDown(key));
  }

  // Returns true if any of the specified keys are currently pressed down
  isAnyDown(keyArray) {
    return keyArray.some(key => this.isDown(key));
  }

  // Returns a copy of the current key state object
  getKeyStates() {
    return {...this.keys};
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


  handleKeyPress(key) {
    if (!this.player.rigidBody || State.disable_arrows) return;

    const velocity = this.player.rigidBody.linvel();
    const angVelocity = this.player.rigidBody.angvel();
    let newVel = { x: velocity.x, y: velocity.y, z: velocity.z };
    let newAngVel = { x: angVelocity.x, y: angVelocity.y, z: angVelocity.z };

    // todo: consider moving this to game loop to sounds etc
    const contactGround = this.player.isOnGround();
    const useLinearVelocity = !State.roll_only;
    // Use the new API to check for key states
    if (this.isAnyDown(['ArrowRight', 'd'])) {
      if (useLinearVelocity) {
        newVel.x += this.linearFactor;
        newVel.z -= this.linearFactor;
      }
      if (contactGround) {
        newAngVel.x -= this.rotationalFactor;
        newAngVel.z -= this.rotationalFactor;
      }
    }

    if (this.isAnyDown(['ArrowLeft', 'a'])) {
      if (useLinearVelocity) {
        newVel.x -= this.linearFactor;
        newVel.z += this.linearFactor;
      }
      if (contactGround) {
        newAngVel.x += this.rotationalFactor;
        newAngVel.z += this.rotationalFactor;
      }
    }

    if (this.isAnyDown(['ArrowUp', 'w'])) {
      if (useLinearVelocity) {
        newVel.x -= this.linearFactor;
        newVel.z -= this.linearFactor;
      }
      if (contactGround) {
        newAngVel.x -= this.rotationalFactor;
        newAngVel.z += this.rotationalFactor;
      }
    }

    if (this.isAnyDown(['ArrowDown', 's'])) {
      if (useLinearVelocity) {
        newVel.x += this.linearFactor;
        newVel.z += this.linearFactor;
      }
      if (contactGround) {
        newAngVel.x += this.rotationalFactor;
        newAngVel.z -= this.rotationalFactor;
      }
    }

    if (this.isDown(' ') && contactGround) {
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
}