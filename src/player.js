import * as THREE from 'three';
import { State } from './state';
import TWEEN from '@tweenjs/tween.js';
import * as RAPIER from '@dimforge/rapier3d-compat';

const BASE_MASS = 14.1 * 8;

export class Player {
  constructor(world) {
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

    // Create Three.js mesh
    this.shape = new THREE.Mesh(sphereGeometry, this.material);
    this.shape.castShadow = true;

    // Create Rapier rigid body
    const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0, State.max_height + 5, 0)
      .setLinearDamping(0.5)
      .setAngularDamping(0.8);

    this.rigidBody = world.createRigidBody(rigidBodyDesc);

    // Create collision shape
    const colliderDesc = RAPIER.ColliderDesc.ball(1.5)
      .setRestitution(State.ground_restitution)
      .setFriction(State.ground_friction)
      .setMass(playerMass);

    this.collider = world.createCollider(colliderDesc, this.rigidBody);

    console.log("MASS: ", playerMass);
    this.resetPosition();
  }

  resetPosition() {
    this.material.opacity = 0;
    const x = Math.random() * 30 - 15;
    const y = State.max_height + 5;
    const z = Math.random() * 30 - 15;

    // Reset both Three.js mesh and Rapier body
    this.shape.position.set(x, y, z);
    this.shape.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    this.rigidBody.setTranslation({ x, y, z }, true);
    this.rigidBody.setRotation({
      x: Math.random() * Math.PI,
      y: Math.random() * Math.PI,
      z: Math.random() * Math.PI,
    }, true);

    new TWEEN.Tween(this.material)
      .to({ opacity: 1 }, 1500)
      .start();
  }

  update() {
    // Sync Three.js mesh with Rapier physics body
    const position = this.rigidBody.translation();
    const rotation = this.rigidBody.rotation();

    this.shape.position.set(position.x, position.y, position.z);
    this.shape.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
  }
}