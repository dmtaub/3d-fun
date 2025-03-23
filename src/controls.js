import { State } from './state';

export class Controls {
  constructor(player) {
    this.player = player;
    this.jumpVelocity = 22;
    this.linearDamping = 0.5;
    this.angularDamping = 0.8;
    this.linearFactor = 0.3 * State.slow_factor;
    this.rotationalFactor = 10 * State.slow_factor;

    // Set up keyboard controls
    this.keys = {};
    window.addEventListener('keydown', (e) => this.keys[e.key] = true);
    window.addEventListener('keyup', (e) => this.keys[e.key] = false);
  }

  jump(scale = 2) {
    // Note: We'll need to implement physics-based velocity
    // For now, we'll just move the ball up
    this.player.shape.position.y += this.jumpVelocity * scale;
  }

  setupActions(terrain) {
    const doAfterDelay = () => {
      this.jump();
    };
    const delay = State.transition_time / 2;

    // Set up key handlers
    window.addEventListener('keyup', (e) => {
      switch(e.key.toLowerCase()) {
        case 'w':
          terrain.setTarget(2);
          if (terrain.lastScale < 1) {
            this.jump();
            setTimeout(doAfterDelay, delay);
          }
          break;
        case 'a':
          terrain.setTarget(terrain.lastScale);
          if (terrain.lastScale > 1) {
            this.jump();
            setTimeout(doAfterDelay, delay);
          }
          break;
        case 's':
          terrain.setTarget(0);
          break;
        case 'd':
          terrain.setTarget(1);
          break;
        case 'e':
          terrain.setTarget(Math.random());
          break;
      }
    });
  }

  moveWithKeys() {
    if (State.disable_arrows) return;

    // Note: We'll need to implement physics-based movement
    // For now, we'll just move the ball directly
    const moveSpeed = this.linearFactor;
    const rotateSpeed = this.rotationalFactor;

    if (this.keys['ArrowRight']) {
      this.player.shape.position.x += moveSpeed;
      this.player.shape.rotation.x -= rotateSpeed;
      this.player.shape.rotation.z -= rotateSpeed;
    }
    if (this.keys['ArrowLeft']) {
      this.player.shape.position.x -= moveSpeed;
      this.player.shape.rotation.x += rotateSpeed;
      this.player.shape.rotation.z += rotateSpeed;
    }
    if (this.keys['ArrowUp']) {
      this.player.shape.position.z -= moveSpeed;
      this.player.shape.rotation.x -= rotateSpeed;
      this.player.shape.rotation.z += rotateSpeed;
    }
    if (this.keys['ArrowDown']) {
      this.player.shape.position.z += moveSpeed;
      this.player.shape.rotation.x += rotateSpeed;
      this.player.shape.rotation.z -= rotateSpeed;
    }
    if (this.keys[' ']) {
      this.jump();
    }
  }
} 