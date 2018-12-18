SLOW = false

class State
  @slow_factor: if SLOW then 3 else 1
  @max_height: 0
  @ground_friction: 18
  @ground_restitution: .2
  @fancy_ball: false # super resource-intensive reflection on ball
  #@extend: (obj) => obj.forEach((k,v) => obj[k] = v)

module.exports = State
