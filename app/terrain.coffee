require('three.terrain.js')

# TODO: async
State = require('state')
module.exports =
  class SquareTerrain
    # Generate a terrain
    @TextureLoader: new THREE.TextureLoader()
    xS: 63
    yS: 63
    xSize: 128
    ySize: 128
    maxHeight: State.max_height
    minHeight: 20
    snowTop: 20 # higher numbers, more snow
    constructor: (scene, @afterLoad) ->
      #@addDefault(scene)
      #@addSky(scene)
      @addEarth(scene, @afterLoad)

    addDefault: (scene) =>
      @material = new THREE.MeshBasicMaterial(color: 0x5566aa)
      @regenerate(scene)

    scatterMeshes: =>
      # Get the geometry of the terrain across which you want to scatter meshes
      geo = @visual.children[0].geometry
      # Add randomly distributed foliage
      decoScene = THREE.Terrain.ScatterMeshes(geo,
        mesh: new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 12, 6))
        w: @xS
        h: @yS
        spread: 0.02
        randomness: Math.random)
      @visual.add decoScene

    addSky: (scene) =>
      SquareTerrain.TextureLoader.load('img/sky1.jpg', (t1) ->
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
      @visual = THREE.Terrain(
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
      scene.remove(@visual) if @visual
      scene.remove(@tangible) if @tangible

      groundMaterial = Physijs.createMaterial(new THREE.MeshBasicMaterial(
	        color: 0xffffff
	        transparent: true
	        opacity: 0.05
	        wireframe: true
	      ),
	      State.ground_friction,
	      State.ground_restitution
      )

      groundGeometry = @visual.children[0].geometry
      console.log(groundGeometry)
      groundGeometry.computeFaceNormals()
      groundGeometry.computeVertexNormals()
      @tangible = new Physijs.HeightfieldMesh(
        groundGeometry
        groundMaterial
        0
        @xS
        @yS
      )

      @tangible.rotation.x = Math.PI / -2
      # doesn't work w/ basicMaterial
      @visual.children[0].receiveShadow = true

      scene.add @tangible
      scene.add @visual
      #hf=s.children[2];g=s.children[3].children[0];hf.geometry.vertices.forEach((x, i) => {x.z=-20; hf._physijs.points[i]=-20}); hf.geometry.verticesNeedUpdate = true; s.add(hf)

    addEarth: (scene, cb) =>
      loader = SquareTerrain.TextureLoader
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
                    -@minHeight * 3/4
                    -@minHeight/2
                    0
                    @maxHeight/2
                  ]
                }
                {
                  texture: t3
                  levels: [
                    @maxHeight/2
                    @maxHeight * 3/4
                   	@maxHeight * 3/4
                    @maxHeight
                  ]
                }
                {
                  texture: t4
                  glsl: "1.0 - smoothstep(#{20-@snowTop}.0 + smoothstep(-#{@xSize}.0, #{@xSize}.0, vPosition.x) * 10.0, 20.0, vPosition.z)"
                }
                {
                  texture: t3
                  glsl: 'slope > 0.7853981633974483 ? 0.2 : 1.0 - smoothstep(0.47123889803846897, 0.7853981633974483, slope) + 0.2'
                }
              ])
              @regenerate(scene)
              cb() if cb
