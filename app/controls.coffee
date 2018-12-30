State = require('state')

module.exports = (player) => new Controls(player)

class Controls
  jumpVelocity: 22
  linearDamping: 0.5
  angularDamping: 0.8 #/ State.slow_factor
  linearFactor: 0.3 * State.slow_factor
  rotationalFactor: 10 * State.slow_factor

  constructor: (@player) ->
    @player.shape.setDamping @linearDamping, @angularDamping


  jump: (scale = 2) =>
    v = @player.shape.getLinearVelocity()
    v.y = @jumpVelocity*scale
    @player.shape.setLinearVelocity v

  setupActions: (@terrain) =>
    doAfterDelay = =>
      @jump()
    delay = State.transition_time / 2

    kd.W.up =>
      @terrain.setTarget(2) #hehehe "forward"
      if @terrain.lastScale < 1
        @jump()
        setTimeout( doAfterDelay, delay )
    kd.A.up =>
      @terrain.setTarget(@terrain.lastScale)
      # little hop
      if @terrain.lastScale > 1
        @jump()
        setTimeout( doAfterDelay, delay )

    kd.S.up =>
      @terrain.setTarget(0)
    kd.D.up =>
      @terrain.setTarget(1)

    # legacy for Onyi and Steven
    kd.E.up =>
      @terrain.setTarget(Math.random())



  moveWithKeys: =>
    if State.disable_arrows
      return
    # // arrow keys
    v3 = @player.shape.getLinearVelocity()
    u3 = @player.shape.getAngularVelocity()
    contactGround = @player.shape._physijs.touches.length > 0
    if kd.RIGHT.isDown()
      v3.x += @linearFactor
      v3.z -= @linearFactor
      if contactGround
        u3.x -= @rotationalFactor
        u3.z -= @rotationalFactor
      else
        # lose rotation inertia in air
        #u3.x = 0
        #u3.z = 0
    if kd.LEFT.isDown()
      v3.x -= @linearFactor
      v3.z += @linearFactor
      if contactGround
        u3.x += @rotationalFactor
        u3.z += @rotationalFactor
      else
        # lose rotation inertia in air
        #u3.x = 0
        #u3.z = 0
    if kd.UP.isDown()
      v3.x -= @linearFactor
      v3.z -= @linearFactor
      if contactGround
        u3.x -= @rotationalFactor
        u3.z += @rotationalFactor
      else
        # lose rotation inertia in air
        #u3.x = 0
        #u3.z = 0
    if kd.DOWN.isDown()
      v3.x += @linearFactor
      v3.z += @linearFactor
      if contactGround
        u3.x += @rotationalFactor
        u3.z -= @rotationalFactor
      else
        # lose rotation inertia in air
        #u3.x = 0
        #u3.z = 0
    if kd.SPACE.isDown() and contactGround
      v3.y = @jumpVelocity

    u3.clamp State.min_vector, State.max_vector
    v3.clamp State.min_vector, State.max_vector
    @player.shape.setAngularVelocity u3
    @player.shape.setLinearVelocity v3
    return