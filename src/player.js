import * as THREE from 'three';
import { State } from './state';
import * as TWEEN from '@tweenjs/tween.js';
import * as RAPIER from '@dimforge/rapier3d-compat';

const BASE_MASS = 14.1 * 2;
const FADE_IN_TIME = 1000;
const BUFFER_START = 0.01;
const BUFFER_HIT = 0.3;
export class Player {
  constructor(world) {
    this.world = world;
    this.sphereRadius = 1.5; // This should match the SphereGeometry radius
    const sphereGeometry = new THREE.SphereGeometry(this.sphereRadius, State.ball_long_divs, State.ball_lat_divs);
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

    // Add random color setting after material creation
    this.material.color.setRGB(
      Math.random(),  // CoffeeScript version divided by 100, but that's unnecessary
      Math.random(),
      Math.random()
    );

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
    const colliderDesc = RAPIER.ColliderDesc.ball(this.sphereRadius)
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
      .to({ opacity: 1 }, FADE_IN_TIME)
      .start();
  }

  isOnGround() {
    // First check vertical velocity
    const velocity = this.rigidBody.linvel();
    const isAlmostStopped = Math.abs(velocity.y) < 0.2;

    // If we're moving upward with any significant velocity, we're definitely not grounded
    if (velocity.y > 0.5) return false;

    // Cast a ray downward from the player
    const position = this.rigidBody.translation();
    const rayOrigin = { x: position.x, y: position.y - this.sphereRadius - BUFFER_START, z: position.z };
    const rayDirection = { x: 0, y: -1, z: 0 };

    // Create a ray with a short maximum length (adjust based on player size)
    const ray = new RAPIER.Ray(rayOrigin, rayDirection);
    const maxToi = this.sphereRadius + BUFFER_HIT; // Slightly more than the player's radius
    const solid = true;

    // Cast the ray and check for intersection, exclude the sphere itself
    const hit = this.world.castRay(ray, maxToi, solid);

    // We're on ground if we have a hit and the vertical velocity is low
    return hit !== null && isAlmostStopped;
  }

  update() {
    // Sync Three.js mesh with Rapier physics body
    const position = this.rigidBody.translation();
    const rotation = this.rigidBody.rotation();

    this.shape.position.set(position.x, position.y, position.z);
    this.shape.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
  }
}