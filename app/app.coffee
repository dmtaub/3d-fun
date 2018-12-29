# references:
# https://gamedevelopment.tutsplus.com/tutorials/creating-a-simple-3d-physics-game-using-threejs-and-physijs--cms-29453
# https://github.com/chandlerprall/Physijs/blob/master/physi.js
# http://learningthreejs.com/blog/2011/08/17/tweenjs-for-smooth-animation/
#
State = require('state')
Terrain = require('terrain')
Controls = require('controls')
Player = require('player')
Stats = require('three/examples/js/libs/stats.min')
TWEEN = require('tween.js')

class App
  constructor: ->
    @initScene()
    window.addEventListener( 'resize', (() =>
        @camera.aspect = window.innerWidth / window.innerHeight
        @camera.updateProjectionMatrix()
        @renderer.setSize( window.innerWidth, window.innerHeight );
      ), false )

  initScene: =>
    @renderer = new (THREE.WebGLRenderer)(antialias: true)
    @renderer.setSize window.innerWidth, window.innerHeight
    @renderer.shadowMap.enabled = true
    #renderer.shadowMap.type = THREE.PCFSoftShadowMap
    @renderer.shadowMapSoft = true
    document.getElementById('viewport').appendChild @renderer.domElement
    if State.enable_stats
      # add frame rate (top)
      @renderStats = new Stats
      @renderStats.domElement.style.position = 'absolute'
      @renderStats.domElement.style.top = '0px'
      @renderStats.domElement.style.zIndex = 100
      @renderStats.domElement.title = 'for rendering'
      document.getElementById('viewport').appendChild @renderStats.domElement
      # add simulation rate (bot)
      @physicsStats = new Stats
      @physicsStats.domElement.style.position = 'absolute'
      @physicsStats.domElement.style.top = '50px'
      @physicsStats.domElement.style.zIndex = 100
      @physicsStats.domElement.title = 'for physics'
      document.getElementById('viewport').appendChild @physicsStats.domElement

    @scene = new (Physijs.Scene)(fixedTimeStep: State.slow_factor / 120)

    @scene.setGravity new (THREE.Vector3)(0, -80 , 0)
    # runs when worldUpdate message comes from worker
    @scene.addEventListener 'update', =>
      TWEEN.update()
      @scene.simulate undefined, 1
      if State.enable_stats
        @physicsStats.update()
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

    if State.fancy_ball
      @cubeCamera = new THREE.CubeCamera(1, 200, 512)

    # todo: await
    terrain = new Terrain(@scene, =>
      requestAnimationFrame @render
      @scene.simulate()

      @player = new Player()
      @controls = new Controls(@player)

      if State.fancy_ball
        @player.shape.material.envMap = @cubeCamera.renderTarget.texture

      @scene.add @player.shape

      @scene.addEventListener 'update', =>
        kd.E.up ->
          terrain.setTarget(Math.random())

        @controls.moveWithKeys()
        if State.fancy_ball
          @cubeCamera.update(@renderer, @scene)
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
    if State.enable_stats
      @renderStats.update()
    return

module.exports = App
