State = require('state')
BASE_MASS = 14.1 * 2;
TWEEN = require('tween.js')

module.exports =
  class Player
   constructor: ->
    sphere_geometry = new THREE.SphereGeometry(1.5, State.ball_long_divs, State.ball_lat_divs)
    @material = new THREE.MeshPhongMaterial(
      opacity: 0
      transparent: true
      reflectivity  : 0.9,
      combine : THREE.AddOperation,
      flatShading: THREE.FlatShading,
      color   : 'gray',
      specular  : 'white',
      emissive  : '#222',
      shininess : 40,
    )
    playerMass = BASE_MASS * State.slow_factor
    @shape = new Physijs.SphereMesh(sphere_geometry, @material, playerMass)
    console.log("MASS: ", playerMass)
    @material.color.setRGB Math.random() * 100 / 100, Math.random() * 100 / 100, Math.random() * 100 / 100
    @shape.castShadow = true
    #@shape.receiveShadow = true
    @resetPosition()

   resetPosition: =>
      @material.opacity = 0
      @shape.position.set(Math.random() * 30 - 15, State.max_height + 5 , Math.random() * 30 - 15)
      @shape.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
      new TWEEN.Tween(@material).to({ opacity: 1 }, 1500).start()