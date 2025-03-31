import * as THREE from 'three';

const SLOW = false;
const STATS = true;
const MAX_VECTOR = new THREE.Vector3(20, 5000, 20);

export const State = {
  disable_arrows: false,
  enable_stats: STATS,

  slow_factor: localStorage.getItem('slow') === 'true' ? 3 : 1,
  roll_only: localStorage.getItem('rollOnly') == 'true',

  max_height: 0,

  // Physics parameters - comment out to use default values
  gravity: -98.1,
  default_jump_velocity: 44,
  ball_mass: 440,

  ball_friction: 5,
  ball_restitution: 0.2,

  ground_friction: 10,
  ground_restitution: 0.2,
  fancy_ball: localStorage.getItem('fancy') === 'true',
  ball_lat_divs: 6,
  ball_long_divs: 12,
  max_vector: MAX_VECTOR,
  min_vector: MAX_VECTOR.clone().multiplyScalar(-1),
  transition_time: 1500,
  staying_time: 500,

  debug: localStorage.getItem('debug') === 'true',

  physics_type: localStorage.getItem('physics_type') == 'spheres' ? 'spheres' : 'heightfield', // 'spheres' or 'heightfield'
};

console.log(State);