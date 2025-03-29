import * as THREE from 'three';
import { State } from './state';
import { Terrain } from './terrain';
import { Controls } from './controls';
import { Player } from './player';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import * as TWEEN from '@tweenjs/tween.js';
import * as RAPIER from '@dimforge/rapier3d-compat';

export default class App {
  constructor() {
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
    const gravity = { x: 0.0, y: -9.81, z: 0.0 };
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
      this.renderStats.domElement.style.position = 'absolute';
      this.renderStats.domElement.style.top = '0px';
      this.renderStats.domElement.style.zIndex = 100;
      this.renderStats.domElement.title = 'for rendering';
      document.getElementById('viewport').appendChild(this.renderStats.domElement);

      // Add simulation rate (bot)
      this.physicsStats = new Stats();
      this.physicsStats.domElement.style.position = 'absolute';
      this.physicsStats.domElement.style.top = '50px';
      this.physicsStats.domElement.style.zIndex = 100;
      this.physicsStats.domElement.title = 'for physics';
      document.getElementById('viewport').appendChild(this.physicsStats.domElement);
    }

    // Set up the THREE.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background

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

  render() {
    requestAnimationFrame(() => this.render());

    // Step the physics world
    this.world.step();

    // Update player physics
    if (this.player) {
      this.player.update();
    }
    TWEEN.update();
    this.renderer.render(this.scene, this.camera);

    if (State.enable_stats) {
      this.renderStats.update();
    }

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

    if (State.fancy_ball) {
      this.cubeCamera.update(this.renderer, this.scene);
    }
  }
}