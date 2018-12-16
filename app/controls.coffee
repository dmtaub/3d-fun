
maxVector = new THREE.Vector3(20, 5000, 20)
minVector = maxVector.clone().multiplyScalar(-1)

State = require('state')

module.exports = (player) -> new Controls(player)

class Controls
  jumpVelocity: 22
  linearDamping: 0.5
  angularDamping: 0.8
  linearFactor: 0.6 / State.slow_factor
  rotationalFactor: 20 / State.slow_factor

  constructor: (@player) ->
    @player.shape.setDamping @linearDamping, @angularDamping

  moveWithKeys: =>
    # // arrow keys
    v3 = @player.shape.getLinearVelocity()
    u3 = @player.shape.getAngularVelocity()
    contactGround = @player.shape._physijs.touches.length > 0
    if kd.RIGHT.isDown() or kd.D.isDown()
      v3.x += @linearFactor
      v3.z -= @linearFactor
      if contactGround
        u3.x -= @rotationalFactor
        u3.z -= @rotationalFactor
      else
        # lose rotation inertia in air
        u3.x = 0
        u3.z = 0
    if kd.LEFT.isDown()
      v3.x -= @linearFactor
      v3.z += @linearFactor
      if contactGround
        u3.x += @rotationalFactor
        u3.z += @rotationalFactor
      else
        # lose rotation inertia in air
        u3.x = 0
        u3.z = 0
    if kd.UP.isDown()
      v3.x -= @linearFactor
      v3.z -= @linearFactor
      if contactGround
        u3.x -= @rotationalFactor
        u3.z += @rotationalFactor
      else
        # lose rotation inertia in air
        u3.x = 0
        u3.z = 0
    if kd.DOWN.isDown()
      v3.x += @linearFactor
      v3.z += @linearFactor
      if contactGround
        u3.x += @rotationalFactor
        u3.z -= @rotationalFactor
      else
        # lose rotation inertia in air
        u3.x = 0
        u3.z = 0
    if kd.SPACE.isDown() and contactGround
      v3.y = @jumpVelocity

    u3.clamp minVector, maxVector
    v3.clamp minVector, maxVector
    @player.shape.setAngularVelocity u3
    @player.shape.setLinearVelocity v3
    return