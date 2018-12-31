
maxVector = new THREE.Vector3(20, 5000, 20)
minVector = maxVector.clone().multiplyScalar(-1)

State = require('state')

module.exports = (player) -> new Controls(player)

#require('three/examples/js/controls/PointerLockControls')
require('three/examples/js/controls/OrbitControls')


class Controls
  jumpVelocity: 22
  linearDamping: 0.5
  angularDamping: 0.8 #/ State.slow_factor
  linearFactor: 0.3 * State.slow_factor
  rotationalFactor: 10 * State.slow_factor

  constructor: (@player) ->
    @player.shape.setDamping @linearDamping, @angularDamping

  ## this should be in camera module
  setCameraAndScene: (@camera, @scene, @renderer) =>
    if @mouseControls
      console.error("already initialized")
      return
    @mouseControls = new THREE.OrbitControls(@camera, @renderer.domElement)
    @mouseControls.enableKeys = false
    @mouseControls.enablePan = false
    @mouseControls.saveState() # for restore

  enablePlayerCamera: =>
    x = @player.shape.position.x + 20
    y = @player.shape.position.y + 20
    z = @player.shape.position.z + 20
    @camera.position.set(x,y,z)

  disablePlayerCamera: =>
    @mouseControls.target = @scene.position
    @camera.lookAt @scene.position
    @mouseControls.reset()

  updateCameraPosition: =>
    if not @mouseControls
      throw new Error("Need to initialize mouseControls")
    @mouseControls.target = @player.shape.position
    @mouseControls.update()
  ## end camera module

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

    u3.clamp minVector, maxVector
    v3.clamp minVector, maxVector
    @player.shape.setAngularVelocity u3
    @player.shape.setLinearVelocity v3
    return