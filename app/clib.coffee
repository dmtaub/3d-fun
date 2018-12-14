# needs to be global for terrain to work
require('three.terrain.js')

linearDamping = 0.5
angularDamping = 0.8
jumpVelocity = 22
linearFactor = 0.6
rotationalFactor = 20
maxVector = new THREE.Vector3(20, 5000, 20)
minVector = maxVector.clone().multiplyScalar(-1)

brown = 0x875f2d

randomIntBetween = (a, b) ->
  range = (b - a) + 1
  b - Math.round(Math.random() * range - 0.5)

class Tree
  weight: 9
  barkColor: brown
  fallOver: (speedOfBall) ->
    console.log("OUCH!")
  constructor: ->
    @weight = randomIntBetween(6, 10)

class PineTree extends Tree
  weight: 20


newTree = new Tree()

class App
  constructor: ->
    console.log "hello coffee"
    @initScene()

    window.addEventListener( 'resize', (() =>
        @camera.aspect = window.innerWidth / window.innerHeight
        @camera.updateProjectionMatrix()
        @renderer.setSize( window.innerWidth, window.innerHeight );
      ), false )

  initScene: =>
    TWEEN.start()
    @renderer = new (THREE.WebGLRenderer)(antialias: true)
    @renderer.setSize window.innerWidth, window.innerHeight
    @renderer.shadowMap.enabled = true
    #renderer.shadowMap.type = THREE.PCFSoftShadowMap
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
    @scene = new (Physijs.Scene)(fixedTimeStep: 1 / 60)
    @scene.setGravity new (THREE.Vector3)(0, -40, 0)
    @scene.addEventListener 'update', =>
      @scene.simulate undefined, 1
      # physics_stats.update()
      if @playerCamera
        x = @player.position.x+20
        y = @player.position.y+20
        z = @player.position.z+20
        @camera.position.set(x,y,z)
        @camera.lookAt @player.position
      if @player.position.y < -20
        @scene.remove @player
        @player = @createShape()
        @scene.add @player
      return
    x=2.5
    @camera = new (THREE.PerspectiveCamera)(35, window.innerWidth / window.innerHeight, 1, 1000)
    @camera.position.set 60*x, 50*x, 60*x
    @camera.lookAt @scene.position
    @scene.add @camera
    @playerCamera = false
    kd.ESC.up ()=>
      if @playerCamera
        @playerCamera = false
        @camera.position.set 60*x, 50*x, 60*x
        @camera.lookAt @scene.position
      else
        @playerCamera = true

    # Light
    light = new THREE.DirectionalLight(0xFFFFFF)
    light.position.set 20, 40, -15
    light.target.position.copy @scene.position
    light.castShadow = true
    light.shadow.camera.left = -60
    light.shadow.camera.top = -60
    light.shadow.camera.right = 60
    light.shadow.camera.bottom = 60
    light.shadow.camera.near = 20
    light.shadow.camera.far = 200
    light.shadow.bias = -.0001
    light.shadow.mapSize.width = light.shadow.mapSize.height = 2048
    @scene.add light
    # Loader
    # loader = new THREE.TextureLoader
    # Materials
    #ground_material = Physijs.createMaterial(new THREE.MeshLambertMaterial(color: 0x2194ce, wireframe:true))

    # OLD WAY:
    # ground_material = Physijs.createMaterial(new (THREE.MeshLambertMaterial)(map: loader.load('images/grass.png')), .8, .4)
    # ground_material.map.wrapS = ground_material.map.wrapT = THREE.RepeatWrapping
    # ground_material.map.repeat.set 2.5, 2.5
    # Ground
    # NoiseGen = new SimplexNoise
    ground = new GenTerrain(@scene, =>
      requestAnimationFrame @render
      @scene.simulate()
      @player = @createShape()
      @player.setDamping linearDamping, angularDamping
      # @player2 = @createShape();
      @scene.addEventListener 'update', @moveWithKeys
    )
    # ground_geometry = new THREE.PlaneGeometry(75, 75, 50, 50)
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
    # ground = new Physijs.HeightfieldMesh(ground_geometry, ground_material, 0, 50, 50)
    # ground.rotation.x = Math.PI / -2
    # ground.receiveShadow = true
    # @scene.add ground

    return

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
      v3.y = jumpVelocity

    u3.clamp minVector, maxVector
    v3.clamp minVector, maxVector
    @player.setAngularVelocity u3
    @player.setLinearVelocity v3
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
      material = new THREE.MeshLambertMaterial(
        opacity: 0
        transparent: true
      )
      shape = new Physijs.SphereMesh(sphere_geometry, material, undefined, restitution: Math.random() * 1.5)
      shape.material.color.setRGB Math.random() * 100 / 100, Math.random() * 100 / 100, Math.random() * 100 / 100
      shape.castShadow = true
      #shape.receiveShadow = true
      shape.position.set Math.random() * 30 - 15, 20, Math.random() * 30 - 15
      shape.rotation.set Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI
      @scene.add shape
      new TWEEN.Tween(shape.material).to({ opacity: 1 }, 1500).start()
      shape

    doCreateShape()

  class GenTerrain
    # Generate a terrain
    @TextureLoader: new THREE.TextureLoader()
    xS: 63
    yS: 63
    xSize: 128
    ySize: 128
    maxHeight: 30
    minHeight: 20
    constructor: (scene, @afterLoad) ->
      #@addDefault(scene)
      #@addSky(scene)
      @addEarth(scene, @afterLoad)

    addDefault: (scene) =>
      @material = new THREE.MeshBasicMaterial(color: 0x5566aa)
      @regenerate(scene)

    scatterMeshes: =>
      # Get the geometry of the terrain across which you want to scatter meshes
      geo = @terrainScene.children[0].geometry
      # Add randomly distributed foliage
      decoScene = THREE.Terrain.ScatterMeshes(geo,
        mesh: new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 12, 6))
        w: @xS
        h: @yS
        spread: 0.02
        randomness: Math.random)
      @terrainScene.add decoScene

    addSky: (scene) =>
      GenTerrain.TextureLoader.load('img/sky1.jpg', (t1) ->
        t1.minFilter = THREE.LinearFilter
        # Texture is not a power-of-two size; use smoother interpolation.
        skyDome = new THREE.Mesh(new THREE.SphereGeometry(8192/12, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), new (THREE.MeshBasicMaterial)(
          map: t1
          side: THREE.BackSide
          fog: false)
        )
        skyDome.position.y = 0#-99
        skyDome.rotation.x = Math.PI
        scene.add skyDome
      )
    regenerate: (scene) =>
      @terrainScene = THREE.Terrain(
        easing: THREE.Terrain.Linear
        frequency: 2.5
        heightmap: THREE.Terrain.DiamondSquare
        material: @material or new THREE.MeshLambertMaterial(color: 0x2194ce)
        maxHeight: @maxHeight
        minHeight: -@minHeight
        steps: 10
        useBufferGeometry: false
        xSegments: @xS
        xSize: @xSize
        ySegments: @yS
        ySize: @ySize
        #turbulent: true
      )
      scene.remove(@terrainScene) if @terrainScene
      scene.remove(ground) if ground

      ground_material = Physijs.createMaterial(new THREE.MeshBasicMaterial(
        color: 0xffffff
        transparent: true
        opacity: 0.02
        wireframe: true
      ))

      ground_geometry = @terrainScene.children[0].geometry
      console.log(ground_geometry)
      ground_geometry.computeFaceNormals()
      ground_geometry.computeVertexNormals()
      ground = new Physijs.HeightfieldMesh(
        ground_geometry
        ground_material
        0
        @xS
        @yS
      )
      ground.rotation.x = Math.PI / -2
      # doesn't work w/ basicMaterial
      @terrainScene.children[0].receiveShadow = true

      scene.add(ground)
      scene.add @terrainScene


    addEarth: (scene, cb) =>
      loader = GenTerrain.TextureLoader
      loader.load 'img/sand1.jpg', (t1) =>
        # TODO: use this layer to determine when ball goes off the terrain
        # t1.wrapS = t1.wrapT = THREE.RepeatWrapping
        # sand = new THREE.Mesh(
        #   new THREE.PlaneBufferGeometry(@xSize, @ySize, 64, 64)
        #   new THREE.MeshLambertMaterial(map: t1)
        # )
        # sand.position.y = -@minHeight-0.01 # prevent zfighting
        # sand.rotation.x = -0.5 * Math.PI
        # scene.add sand
        loader.load 'img/grass1.jpg', (t2) =>
          loader.load 'img/stone1.jpg', (t3) =>
            loader.load 'img/snow1.jpg', (t4) =>
              # t2.repeat.x = t2.repeat.y = 2;
              @material = THREE.Terrain.generateBlendedMaterial([
                { texture: t1 }
                {
                  texture: t2
                  levels: [
                    -15
                    -10
                    -5
                    0
                  ]
                }
                {
                  texture: t3
                  levels: [
                    -20
                    0
                    10
                    15
                  ]
                }
                {
                  texture: t4
                  glsl: '1.0 - smoothstep(5.0 + smoothstep(-256.0, 256.0, vPosition.x) * 10.0, 28.0, vPosition.z)'
                }
                {
                  texture: t3
                  glsl: 'slope > 0.7853981633974483 ? 0.2 : 1.0 - smoothstep(0.47123889803846897, 0.7853981633974483, slope) + 0.2'
                }
              ])
              @regenerate(scene)
              cb() if cb

module.exports = App
