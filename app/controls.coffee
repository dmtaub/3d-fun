
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
  linearFactor: 30 * State.slow_factor
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
    distance = @camera.position.distanceTo(@player.shape.position)

    if distance > State.player_camera_max_distance or
       distance < State.player_camera_min_distance
      @enablePlayerCamera() # reset position
    @mouseControls.target = @player.shape.position
    @mouseControls.update()
  ## end camera module

  moveWithKeys: =>
    # // arrow keys
    v3 = new THREE.Vector3()
    u3 = new THREE.Vector3()
    contactGround = @player.shape._physijs.touches.length > 0

    if kd.RIGHT.isDown() or kd.D.isDown()
      v3.x -= @linearFactor
      if contactGround
        u3.x -= @rotationalFactor
        u3.z -= @rotationalFactor
      else
        # lose rotation inertia in air
        #u3.x = 0
        #u3.z = 0
    if kd.LEFT.isDown()
      v3.x += @linearFactor
      if contactGround
        u3.x += @rotationalFactor
        u3.z += @rotationalFactor
      else
        # lose rotation inertia in air
        #u3.x = 0
        #u3.z = 0
    if kd.UP.isDown()
      v3.z += @linearFactor
      if contactGround
        u3.x -= @rotationalFactor
        u3.z += @rotationalFactor
      else
        # lose rotation inertia in air
        #u3.x = 0
        #u3.z = 0
    if kd.DOWN.isDown()
      v3.z -= @linearFactor
      if contactGround
        u3.x += @rotationalFactor
        u3.z -= @rotationalFactor
      else
        # lose rotation inertia in air
        #u3.x = 0
        #u3.z = 0
    if kd.SPACE.isDown() and contactGround
      v3.y = @jumpVelocity

    linV = @player.shape.getLinearVelocity()
    angV = @player.shape.getAngularVelocity()

    axis = new THREE.Vector3(0,1,0)

    vector = new THREE.Vector3()
    @camera.getWorldDirection(vector)
    theta = Math.atan2(vector.x,vector.z)
    console.log(theta)
    #q = new THREE.Quaternion()
    #@camera.getWorldQuaternion(q)
    #rot = @player.shape.position.clone().applyQuaternion(q)
    v3.applyAxisAngle(axis,theta)
    #@player.shape.worldToLocal(v3)
    #linV.rotate
    #console.log(rot)
    linV.add(v3)
    #angV.add(u3)

    linV.clamp minVector, maxVector
    angV.clamp minVector, maxVector

    @player.shape.setAngularVelocity angV
    @player.shape.setLinearVelocity linV
    return