SLOW = false
STATS = true

class State
  @enable_stats: STATS
  @slow_factor: if SLOW then 3 else 1
  @max_height: 0
  @min_height: -20
  @ground_friction: 18
  @ground_restitution: .2
  @fancy_ball: false # super resource-intensive reflection on ball
  @ball_lat_divs = 6 #30
  @ball_long_divs = 12 #30
  #@extend: (obj) => obj.forEach((k,v) => obj[k] = v)
  @map_size: 128
  @player_camera_max_distance: 75
  @player_camera_min_distance: 22

  @transition_time = 1500
  @staying_time = 500
module.exports = State
