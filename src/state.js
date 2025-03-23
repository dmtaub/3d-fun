import * as THREE from 'three';

const SLOW = false;
const STATS = true;
const MAX_VECTOR = new THREE.Vector3(20, 5000, 20);

export const State = {
  disable_arrows: false,
  enable_stats: STATS,
  slow_factor: SLOW ? 3 : 1,
  max_height: 0,
  ground_friction: 0,
  ground_restitution: 0.2,
  fancy_ball: false,
  ball_lat_divs: 6,
  ball_long_divs: 12,
  max_vector: MAX_VECTOR,
  min_vector: MAX_VECTOR.clone().multiplyScalar(-1),
  transition_time: 1500,
  staying_time: 500
}; 