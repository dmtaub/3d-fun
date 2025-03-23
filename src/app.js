import * as THREE from 'three';
import { State } from './state';
import { Terrain } from './terrain';
import { Controls } from './controls';
import { Player } from './player';
import { Stats } from 'three/examples/jsm/libs/stats.module';
import TWEEN from '@tweenjs/tween.js';

export class App {
  constructor() {
    this.config = State;
    this.initScene();
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);
  }

  initScene() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMapSoft = true;
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

    // Note: We'll need to implement Physijs.Scene or use a different physics engine
    // For now, we'll use a basic THREE.Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background

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
    light.shadow.camera.near = 20;
    light.shadow.camera.far = 200;
    light.shadow.bias = -0.0001;
    light.shadow.mapSize.width = light.shadow.mapSize.height = 2048;
    this.scene.add(light);

    if (State.fancy_ball) {
      this.cubeCamera = new THREE.CubeCamera(1, 200, 512);
    }

    // Initialize terrain and player
    this.terrain = new Terrain(this.scene, () => {
      requestAnimationFrame(() => this.render());
      
      this.player = new Player();
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
    this.renderer.render(this.scene, this.camera);
    
    if (State.enable_stats) {
      this.renderStats.update();
    }

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

    if (State.fancy_ball) {
      this.cubeCamera.update(this.renderer, this.scene);
    }
  }
} 