SLOW = false
STATS = true
MAX_VECTOR = new THREE.Vector3(20, 5000, 20)

class State
  @disable_arrows: false #todo disable wasd
  @enable_stats: STATS
  @slow_factor: if SLOW then 3 else 1
  @max_height: 0
  @ground_friction: 18
  @ground_restitution: .2
  @fancy_ball: false # super resource-intensive reflection on ball
  @ball_lat_divs: 6 #30
  @ball_long_divs: 12 #30
  #@extend: (obj) => obj.forEach((k,v) => obj[k] = v)

  #control vectors
  @max_vector: MAX_VECTOR
  @min_vector: MAX_VECTOR.clone().multiplyScalar(-1)


  @transition_time: 1500
  @staying_time: 500

module.exports = State
