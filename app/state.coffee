SLOW = false

class State
  @slow_factor: if SLOW then 3 else 1
  @max_height: 0
  @ground_friction: 1.8
  @ground_restitution: .2
  #@extend: (obj) => obj.forEach((k,v) => obj[k] = v)

module.exports = State
