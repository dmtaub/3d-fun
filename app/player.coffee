module.exports =
  class Player
   constructor: ->
    sphere_geometry = new (THREE.SphereGeometry)(1.5, 32, 32)
    @material = new THREE.MeshLambertMaterial(
      opacity: 0
      transparent: true
    )
    @shape = new Physijs.SphereMesh(sphere_geometry, @material, undefined, restitution: Math.random() * 1.5)
    @material.color.setRGB Math.random() * 100 / 100, Math.random() * 100 / 100, Math.random() * 100 / 100
    @shape.castShadow = true
    #@shape.receiveShadow = true
    @resetPosition()

   resetPosition: =>
      @material.opacity = 0
      @shape.position.set Math.random() * 30 - 15, 20, Math.random() * 30 - 15
      @shape.rotation.set Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI
      new TWEEN.Tween(@material).to({ opacity: 1 }, 1500).start()