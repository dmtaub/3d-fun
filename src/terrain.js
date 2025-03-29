import * as THREE from 'three';
import { State } from './state';
import * as TWEEN from '@tweenjs/tween.js';
import RAPIER from '@dimforge/rapier3d-compat';
// Import the Terrain class from the .mjs file
import 'three.terrain.js/build/THREE.Terrain.js';
window.THREE = THREE;


export class Terrain {
  constructor(scene, world, afterLoad) {
    this.xS = 63;
    this.yS = 63;
    this.xSize = 128;
    this.ySize = 128;
    this.maxHeight = State.max_height;
    this.minHeight = -20;
    this.snowTop = 20;
    this.scene = scene;
    this.world = world; // Rapier physics world
    this.afterLoad = afterLoad;

    // Create debug surface immediately
    if (State.debug) {
      this.debugSurface();
    }

    this.addEarth();
  }

  debugSurface({
    size = 50,
    height = 1,
    y = -5,
    color = 0xff0000,
    opacity = 0.5
  } = {}) {
    // Remove existing debug objects if they exist
    if (this.testCollider) {
        this.world.removeCollider(this.testCollider, true);
    }
    if (this.testCube) {
        this.scene.remove(this.testCube);
    }

    // Create physics collider
    const groundRigidBody = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    const cubeColliderDesc = RAPIER.ColliderDesc.cuboid(
        size,
        height,
        size
    );
    cubeColliderDesc.setTranslation(0, y, 0);
    this.testCollider = this.world.createCollider(cubeColliderDesc, groundRigidBody);

    // Create visual representation
    const cubeGeometry = new THREE.BoxGeometry(
        size * 2,
        height * 2,
        size * 2
    );
    const cubeMaterial = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: opacity
    });
    this.testCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    this.testCube.receiveShadow = true;

    this.testCube.position.set(0, y, 0);
    this.scene.add(this.testCube);
  }

  addEarth() {
    const textureLoader = new THREE.TextureLoader();

    Promise.all([
      textureLoader.loadAsync('img/sand1.jpg'),
      textureLoader.loadAsync('img/grass1.jpg'),
      textureLoader.loadAsync('img/stone1.jpg'),
      textureLoader.loadAsync('img/snow1.jpg')
    ]).then(([sandTexture, grassTexture, stoneTexture, snowTexture]) => {
      // Set texture repeat and wrap settings
      [sandTexture, grassTexture, stoneTexture, snowTexture].forEach(texture => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
      });

      // Create blended material using THREETerrain
      const material = THREETerrain.generateBlendedMaterial([
        { texture: sandTexture },
        {
          texture: grassTexture,
          levels: [
            this.minHeight * 3/4,
            this.minHeight/2,
            0,
            this.maxHeight/2
          ]
        },
        {
          texture: stoneTexture,
          levels: [
            this.maxHeight/2,
            this.maxHeight * 3/4,
            this.maxHeight * 3/4,
            this.maxHeight
          ]
        },
        {
          texture: snowTexture,
          glsl: `1.0 - smoothstep(${20-this.snowTop}.0 + smoothstep(-${this.xSize}.0, ${this.xSize}.0, vPosition.x) * 10.0, 20.0, vPosition.z)`
        },
        {
          texture: stoneTexture,
          glsl: 'slope > 0.7853981633974483 ? 0.2 : 1.0 - smoothstep(0.47123889803846897, 0.7853981633974483, slope) + 0.2'
        }
      ]);

      // Create new terrain instance
      const terrain = new THREETerrain({
        easing: THREETerrain.Linear,
        frequency: 2.5,
        heightmap: THREETerrain.DiamondSquare,
        material: material,
        maxHeight: this.maxHeight,
        minHeight: this.minHeight,
        steps: 10,
        useBufferGeometry: true,
        xSegments: this.xS,
        xSize: this.xSize,
        ySegments: this.yS,
        ySize: this.ySize
      });

      // Get the terrain scene and mesh
      this.visual = terrain;
      const terrainMesh = this.visual.children[0];

      // Store geometry reference
      this.geo = terrainMesh.geometry;

      // Store base positions for transformations
      const positionAttribute = this.geo.getAttribute('position');
      this.geo._vBase = Float32Array.from(positionAttribute.array);

      // Create heightfield data for Rapier
      const heights = new Float32Array((this.xS + 1) * (this.yS + 1));
      for (let i = 0; i < heights.length; i++) {
        const vertexIndex = i * 3 + 2; // z-component of each vertex
        heights[i] = this.geo._vBase[vertexIndex];
      }

      // Create Rapier heightfield collider
      const terrainScale = { x: this.xSize / this.xS, y: 1, z: this.ySize / this.yS };
      const colliderDesc = RAPIER.ColliderDesc.heightfield(
        this.xS,
        this.yS,
        heights,
        terrainScale
      );

      // Position the collider at the center of the terrain
      colliderDesc.setTranslation(
        -this.xSize / 2,
        0,
        -this.ySize / 2
      );

      // Create a static rigid body for the terrain
      const rigidBodyDesc = RAPIER.RigidBodyDesc.fixed();
      const rigidBody = this.world.createRigidBody(rigidBodyDesc);

      // Create the collider and store it
      this.tangible = this.world.createCollider(colliderDesc, rigidBody);

      // Set up shadows
      terrainMesh.receiveShadow = true;
      terrainMesh.castShadow = true;

      // Add visual mesh to scene
      this.scene.add(this.visual);

      // Call afterLoad callback
      if (this.afterLoad) {
        this.afterLoad();
      }
    });
  }

  adjustTile() {
    if (!this.geo?._vBase) return;

    const positionAttribute = this.geo.getAttribute('position');
    const positions = positionAttribute.array;

    // Create new heights array for Rapier
    const heights = new Float32Array((this.xS + 1) * (this.yS + 1));

    // Update vertex positions and collect heights
    for (let i = 0, j = 0; i < positions.length; i += 3, j++) {
      const newZ = this.minHeight + (this.geo._vBase[i + 2] - this.minHeight) * this.terrainScale;
      positions[i + 2] = newZ;
      heights[j] = newZ;
    }

    // Remove old collider
    if (this.tangible) {
      this.world.removeCollider(this.tangible, true);
    }

    // Create new collider with updated heights
    const terrainScale = { x: this.xSize / this.xS, y: 1, z: this.ySize / this.yS };
    const colliderDesc = RAPIER.ColliderDesc.heightfield(
      this.xS,
      this.yS,
      heights,
      terrainScale
    );

    colliderDesc.setTranslation(
      -this.xSize / 2,
      0,
      -this.ySize / 2
    );

    this.tangible = this.world.createCollider(colliderDesc);

    // Update visual geometry
    positionAttribute.needsUpdate = true;
    this.geo.computeVertexNormals();
  }

  setTarget(fraction = 0.5) {
    if (!this.visual) return;

    if (this.terrainScale === undefined) {
      this.terrainScale = 1;
    }

    if (this.tween) {
      this.lastScale = this.terrainScale;
      this.tween.stop();
    } else {
      this.lastScale = fraction;
    }

    this.tween = new TWEEN.Tween(this)
      .to({ terrainScale: fraction }, State.transition_time)
      .onUpdate(() => this.adjustTile())
      .easing(TWEEN.Easing.Sinusoidal.InOut)
      .delay(State.staying_time)
      .start();
  }
}