SLOW = false

class State
  @slow_factor = if not SLOW then 1 else 2

  #@extend: (obj) => obj.forEach((k,v) => obj[k] = v)

module.exports = State
