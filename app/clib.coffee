# needs to be global for terrain to work
window.THREE = require('three.js')
require('three.terrain.js')

class App
  constructor: ->
    console.log "hello coffee"
    @initScene()

  initScene: =>
    TWEEN.start()
    @renderer = new (THREE.WebGLRenderer)(antialias: true)
    @renderer.setSize window.innerWidth, window.innerHeight
    @renderer.shadowMap.enabled = true
    @renderer.shadowMapSoft = true
    document.getElementById('viewport').appendChild @renderer.domElement
    # render_stats = new Stats
    # render_stats.domElement.style.position = 'absolute'
    # render_stats.domElement.style.top = '0px'
    # render_stats.domElement.style.zIndex = 100
    # document.getElementById('viewport').appendChild render_stats.domElement
    # physics_stats = new Stats
    # physics_stats.domElement.style.position = 'absolute'
    # physics_stats.domElement.style.top = '50px'
    # physics_stats.domElement.style.zIndex = 100
    # document.getElementById('viewport').appendChild physics_stats.domElement
    @scene = new (Physijs.Scene)(fixedTimeStep: 1 / 120)
    @scene.setGravity new (THREE.Vector3)(0, -80, 0)
    @scene.addEventListener 'update', =>
      @scene.simulate undefined, 1
      # physics_stats.update()
      if @player.position.y < -10
        @scene.remove @player
        @player = @createShape()
        @scene.add @player
      return
    @camera = new (THREE.PerspectiveCamera)(35, window.innerWidth / window.innerHeight, 1, 1000)
    @camera.position.set 60, 50, 60
    @camera.lookAt @scene.position
    @scene.add @camera
    # Light
    light = new (THREE.DirectionalLight)(0xFFFFFF)
    light.position.set 20, 40, -15
    light.target.position.copy @scene.position
    light.castShadow = true
    light.shadowCameraLeft = -60
    light.shadowCameraTop = -60
    light.shadowCameraRight = 60
    light.shadowCameraBottom = 60
    light.shadowCameraNear = 20
    light.shadowCameraFar = 200
    light.shadowBias = -.0001
    light.shadowMapWidth = light.shadowMapHeight = 2048
    light.shadowDarkness = .7
    @scene.add light
    # Loader
    loader = new (THREE.TextureLoader)
    # Materials
    ground_material = Physijs.createMaterial(new (THREE.MeshLambertMaterial)(map: loader.load('images/grass.png')), .8, .4)
    ground_material.map.wrapS = ground_material.map.wrapT = THREE.RepeatWrapping
    ground_material.map.repeat.set 2.5, 2.5
    # Ground
    # NoiseGen = new SimplexNoise
    ground_geometry = new (THREE.PlaneGeometry)(75, 75, 50, 50)
    # fun!
    # i = 0
    # while i < ground_geometry.vertices.length
    #   vertex = ground_geometry.vertices[i]
    #   vertex.z = NoiseGen.noise(vertex.x / 10, vertex.y / 10) * 2
    #   i++
    # ground_geometry.computeFaceNormals()
    # ground_geometry.computeVertexNormals()
    # If your plane is not square as far as face count then the HeightfieldMesh
    # takes two more arguments at the end: # of x faces and # of y faces that were passed to THREE.PlaneMaterial
    ground = new (Physijs.HeightfieldMesh)(ground_geometry, ground_material, 0, 50, 50)
    ground.rotation.x = Math.PI / -2
    ground.receiveShadow = true
    @scene.add ground
    requestAnimationFrame @render
    @scene.simulate()
    @player = @createShape()
    linearDamping = 0.5
    angularDamping = 0.8
    @player.setDamping linearDamping, angularDamping
    # @player2 = @createShape();
    JUMP = 22
    v3 = undefined
    u3 = undefined
    contactGround = undefined
    linearFactor = 0.3
    rotationalFactor = 10
    maxVector = new (THREE.Vector3)(20, 5000, 20)
    minVector = maxVector.clone().multiplyScalar(-1)

  moveWithKeys: =>
    # // arrow keys
    v3 = @player.getLinearVelocity()
    u3 = @player.getAngularVelocity()
    contactGround = @player._physijs.touches.length > 0
    if kd.RIGHT.isDown()
      v3.x += linearFactor
      v3.z -= linearFactor
      if contactGround
        u3.x -= rotationalFactor
        u3.z -= rotationalFactor
      else
        # lose rotation inertia in air
        u3.x = 0
        u3.z = 0
    if kd.LEFT.isDown()
      v3.x -= linearFactor
      v3.z += linearFactor
      if contactGround
        u3.x += rotationalFactor
        u3.z += rotationalFactor
      else
        # lose rotation inertia in air
        u3.x = 0
        u3.z = 0
    if kd.UP.isDown()
      v3.x -= linearFactor
      v3.z -= linearFactor
      if contactGround
        u3.x -= rotationalFactor
        u3.z += rotationalFactor
      else
        # lose rotation inertia in air
        u3.x = 0
        u3.z = 0
    if kd.DOWN.isDown()
      v3.x += linearFactor
      v3.z += linearFactor
      if contactGround
        u3.x += rotationalFactor
        u3.z -= rotationalFactor
      else
        # lose rotation inertia in air
        u3.x = 0
        u3.z = 0
    if kd.SPACE.isDown() and contactGround
      v3.y = JUMP
    else
    u3.clamp minVector, maxVector
    v3.clamp minVector, maxVector
    @player.setAngularVelocity u3
    @player.setLinearVelocity v3
    return

  @scene.addEventListener 'update', @moveWithKeys
  return

  render: =>
    requestAnimationFrame @render
    @renderer.render @scene, @camera
    # render_stats.update()
    return

  createShape: =>
    sphere_geometry = new (THREE.SphereGeometry)(1.5, 32, 32)
    doCreateShape = undefined

    doCreateShape = =>
      shape = undefined
      material = new (THREE.MeshLambertMaterial)(
        opacity: 0
        transparent: true)
      shape = new (Physijs.SphereMesh)(sphere_geometry, material, undefined, restitution: Math.random() * 1.5)
      shape.material.color.setRGB Math.random() * 100 / 100, Math.random() * 100 / 100, Math.random() * 100 / 100
      shape.castShadow = true
      shape.receiveShadow = true
      shape.position.set Math.random() * 30 - 15, 20, Math.random() * 30 - 15
      shape.rotation.set Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI
      @scene.add shape
      new (TWEEN.Tween)(shape.material).to({ opacity: 1 }, 500).start()
      shape

    doCreateShape()


module.exports = App
