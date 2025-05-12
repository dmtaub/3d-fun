import * as THREE from 'three';
import { State } from './state';
import { Terrain } from './terrain';
import { Controls } from './controls';
import { Player } from './player';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import * as TWEEN from '@tweenjs/tween.js';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { createKeys } from './keys';

export default class App {
  constructor() {
    this.keys = createKeys();
    this.keys.setupHandlers((code, isChanged, isPressed) => {
      if (code === 'Escape' && isChanged) {
        this.toggleCamera();
      }
    });

    this.config = State;
    this.initPhysics().then(() => {
      this.initScene();
    });
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);
  }

  async initPhysics() {
    // Initialize Rapier physics
    await RAPIER.init();
    const gravity = { x: 0.0, y: this.config.gravity || -9.81, z: 0.0 };
    this.world = new RAPIER.World(gravity);
  }

  initScene() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('viewport').appendChild(this.renderer.domElement);

    if (State.enable_stats) {
      // Add frame rate (top)
      this.renderStats = new Stats();
      this.renderStats.domElement.style.position = 'unset';
      this.renderStats.domElement.style.float = 'right';
      document.getElementById('heading').appendChild(this.renderStats.domElement);
    }

    // Set up the THREE.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020508); // Dark blue-black background

    // Set up the camera
    const x = 2.5;
    this.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 1000);
    this.camera.position.set(60 * x, 50 * x, 60 * x);
    this.camera.lookAt(this.scene.position);
    this.scene.add(this.camera);
    this.playerCamera = false;

    // Light
    const light = new THREE.DirectionalLight(0xFFFFFF);
    light.position.set(20, 40, -15);
    light.target.position.copy(this.scene.position);
    light.castShadow = true;
    light.shadow.camera.left = -60;
    light.shadow.camera.top = -60;
    light.shadow.camera.right = 60;
    light.shadow.camera.bottom = 60;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 200;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = light.shadow.mapSize.height = 2048;
    this.scene.add(light);

    if (State.fancy_ball) {
      this.cubeCamera = new THREE.CubeCamera(1, 200, 512);
    }

    // Initialize terrain and player
    this.terrain = new Terrain(this.scene, this.world, () => {
      requestAnimationFrame(() => this.render());

      this.player = new Player(this.world);
      this.controls = new Controls(this.player);

      if (State.fancy_ball) {
        this.player.shape.material.envMap = this.cubeCamera.renderTarget.texture;
      }

      this.scene.add(this.player.shape);
      this.controls.setupActions(this.terrain);
    });
  }

  toggleCamera() {
    if (this.playerCamera) {
      this.playerCamera = false;
      this.camera.position.set(60 * 2.5, 50 * 2.5, 60 * 2.5);
      this.camera.lookAt(this.scene.position);
    } else {
      this.playerCamera = true;
    }
  }

  render() {
    requestAnimationFrame(() => this.render());

    // Step the physics world
    this.world.step();

    // Update player physics
    if (this.player) {
      this.player.update(this.keys, 16); // Pass keys and delta time
    }
    TWEEN.update();
    this.renderer.render(this.scene, this.camera);

    if (State.enable_stats) {
      this.renderStats.update();
    }

    // Clear key changes after processing
    this.keys.clearChanges();

    if (this.player) {
      if (this.playerCamera) {
        const x = this.player.shape.position.x + 20;
        const y = this.player.shape.position.y + 20;
        const z = this.player.shape.position.z + 20;
        this.camera.position.set(x, y, z);
        this.camera.lookAt(this.player.shape.position);
      }

      if (this.player.shape.position.y < -20) {
        this.scene.remove(this.player.shape);
        this.player.resetPosition();
        this.scene.add(this.player.shape);
      }
    }

    // Update controls to process key states
    if (this.controls) {
      this.controls.update();
    }

    if (State.fancy_ball) {
      this.cubeCamera.update(this.renderer, this.scene);
    }
  }
}