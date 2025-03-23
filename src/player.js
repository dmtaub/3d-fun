import * as THREE from 'three';
import { State } from './state';
import TWEEN from '@tweenjs/tween.js';

const BASE_MASS = 14.1 * 8;

export class Player {
  constructor() {
    const sphereGeometry = new THREE.SphereGeometry(1.5, State.ball_long_divs, State.ball_lat_divs);
    this.material = new THREE.MeshPhongMaterial({
      opacity: 0,
      transparent: true,
      reflectivity: 0.9,
      combine: THREE.AddOperation,
      flatShading: THREE.FlatShading,
      color: 'gray',
      specular: 'white',
      emissive: '#222',
      shininess: 40,
    });

    const playerMass = BASE_MASS * State.slow_factor;
    // Note: We'll need to implement Physijs.SphereMesh or use a different physics engine
    // For now, we'll use a basic THREE.Mesh
    this.shape = new THREE.Mesh(sphereGeometry, this.material);
    console.log("MASS: ", playerMass);
    
    this.material.color.setRGB(
      Math.random() * 100 / 100,
      Math.random() * 100 / 100,
      Math.random() * 100 / 100
    );
    
    this.shape.castShadow = true;
    this.resetPosition();
  }

  resetPosition() {
    this.material.opacity = 0;
    this.shape.position.set(
      Math.random() * 30 - 15,
      State.max_height + 5,
      Math.random() * 30 - 15
    );
    this.shape.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    
    new TWEEN.Tween(this.material)
      .to({ opacity: 1 }, 1500)
      .start();
  }
} 