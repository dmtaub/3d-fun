# needs to be global for terrain to work

State = require('state')
GenTerrain = require('terrain')
Controls = require('controls')
Player = require('player')

class App
  constructor: ->
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
    @scene = new (Physijs.Scene)(fixedTimeStep: State.slow_factor / 120)
    window.s=@scene
    @scene.setGravity new (THREE.Vector3)(0, -80 , 0)
    @scene.addEventListener 'update', =>
      @scene.simulate undefined, 1
      # physics_stats.update()
      if @playerCamera
        x = @player.shape.position.x + 20
        y = @player.shape.position.y + 20
        z = @player.shape.position.z + 20
        @camera.position.set(x,y,z)
        @camera.lookAt @player.shape.position
      if @player.shape.position.y < -20
        @scene.remove @player.shape
        @player.resetPosition()
        @scene.add @player.shape
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
    @cubeCamera = new THREE.CubeCamera(1, 200, 512)

    ground = new GenTerrain(@scene, =>
      requestAnimationFrame @render
      @scene.simulate()

      @player = new Player()
      @controls = new Controls(@player)

      # texLoader = new THREE.TextureLoader();
      # texLoader.crossOrigin = '';
      # texLoader.load('https://dev.ngit.hr/vr/textures/sphere-uv.png', (tex) =>
        #@player.shape.material.map = tex
      @player.shape.material.envMap = @cubeCamera.renderTarget.texture

      @scene.add @player.shape
      # @player2 = @createShape();
      @scene.addEventListener 'update', =>
        @controls.moveWithKeys()
        #@cubeCamera.update(@renderer, @scene)
    # )
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

  render: =>
    requestAnimationFrame @render
    @renderer.render @scene, @camera
    # render_stats.update()
    return

module.exports = App
