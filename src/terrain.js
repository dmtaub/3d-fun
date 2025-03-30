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
    ).setFriction(State.ground_friction);

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
      // Set texture repeat and wrap settings - only called once
      this.createVisualTerrain(sandTexture, grassTexture, stoneTexture, snowTexture);
      this.createHeightfield();
      // create Physics Terrain - can be called multiple times
      this.createPhysicsTerrain();

      // Call afterLoad callback
      if (this.afterLoad) {
        this.afterLoad();
      }
    });
  }
  createPhysicsTerrain() { // from heightfield
    if (this.tangible) {
      this.world.removeCollider(this.tangible, true);
    }

    // Create Rapier heightfield collider
    // const terrainScale = { x: 1, y: 1, z: 1 };
    const terrainScale = { x: this.xSize, y: 1, z: this.ySize };
    // Create a static rigid body for the terrain
    const terrainRigidBody = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    const terrainColliderDesc = RAPIER.ColliderDesc.heightfield(
      this.xS,
      this.yS,
      this.heightsColMajor,
      terrainScale
    ).setFriction(State.ground_friction);

    // Position the collider at the center of the terrain
    terrainColliderDesc.setTranslation(0, 0, 0);

    // Create the collider and store it
    this.tangible = this.world.createCollider(terrainColliderDesc, terrainRigidBody);

  }

  createHeightfield() {
    // Store base positions for transformations
    const positionAttribute = this.terrainGeom.getAttribute('position');
    // monkeypatch the _vBase property to have the base positions
    this.terrainGeom._vBase = Float32Array.from(positionAttribute.array);

    this.heights = new Float32Array((this.xS + 1) * (this.yS + 1));
    this.heightsColMajor = new Float32Array((this.yS + 1) * (this.xS + 1));

    // set the heights to the base positions
    for (let i = 0; i < this.heights.length; i++) {
      const vertexIndex = i * 3 + 2; // z-component of each vertex
      this.heights[i] = this.terrainGeom._vBase[vertexIndex];

      // Convert linear index to row and column coordinates
      const row = Math.floor(i / (this.xS + 1));
      const col = i % (this.xS + 1);

      // for physics
      // Calculate column-major index and assign the same height value
      const colMajorIndex = col * (this.yS + 1) + row;
      this.heightsColMajor[colMajorIndex] = this.heights[i];
    }
    // Visualize the heightfield as points if debug is true
    if (State.debug) {
      this.visualizeHeightfield();
    }
  }

  createVisualTerrain(sandTexture, grassTexture, stoneTexture, snowTexture) {
    if (this.terrainGeom) {
      throw new Error('Terrain geometry already exists!');
    }

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
          this.minHeight * 3 / 4,
          this.minHeight / 2,
          0,
          this.maxHeight / 2
        ]
      },
      {
        texture: stoneTexture,
        levels: [
          this.maxHeight / 2,
          this.maxHeight * 3 / 4,
          this.maxHeight * 3 / 4,
          this.maxHeight
        ]
      },
      {
        texture: snowTexture,
        glsl: `1.0 - smoothstep(${20 - this.snowTop}.0 + smoothstep(-${this.xSize}.0, ${this.xSize}.0, vPosition.x) * 10.0, 20.0, vPosition.z)`
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

    const terrainMesh = terrain.children[0];
    // Set up shadows
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;

    // Store geometry reference
    this.terrainGeom = terrainMesh.geometry;

    // Add visual mesh to scene
    this.scene.add(terrain);
  }

  visualizeHeightfield() {
    // Remove previous visualization if it exists
    if (this.heightfieldPoints) {
      this.scene.remove(this.heightfieldPoints);
      this.heightfieldPoints = null;
    }

    // Visualize the heightfield as points
    // We need to convert the heights array to 3D positions
    const positions = new Float32Array((this.xS + 1) * (this.yS + 1) * 3);

    for (let i = 0; i <= this.yS; i++) {
      for (let j = 0; j <= this.xS; j++) {
        const index = i * (this.xS + 1) + j;
        const posIndex = index * 3;

        // Calculate x and z based on the grid position
        // Scale and center the points to match the collider
        positions[posIndex] = (j / this.xS) * this.xSize - this.xSize / 2;  // X coordinate
        positions[posIndex + 1] = this.heights[index];                      // Y coordinate (height)
        positions[posIndex + 2] = (i / this.yS) * this.ySize - this.ySize / 2;  // Z coordinate
      }
    }

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const pointsMaterial = new THREE.PointsMaterial({
      color: 0x0000ff,
      size: 0.5,
      sizeAttenuation: true
    });

    this.heightfieldPoints = new THREE.Points(pointsGeometry, pointsMaterial);
    this.scene.add(this.heightfieldPoints);
  }

  adjustTile() {
    if (!this.terrainGeom?._vBase) return;
    // Update visual geometry
    const positionAttribute = this.terrainGeom.getAttribute('position');
    const positions = positionAttribute.array;

    // Update vertex positions and collect heights
    for (let i = 0, j = 0; i < positions.length; i += 3, j++) {
      const newZ = this.minHeight + (this.terrainGeom._vBase[i + 2] - this.minHeight) * this.terrainScale;
      positions[i + 2] = newZ;

      // for physics
      const row = Math.floor(j / (this.xS + 1));
      const col = j % (this.xS + 1);
      const colMajorIndex = col * (this.yS + 1) + row;
      this.heightsColMajor[colMajorIndex] = newZ;
    }
    this.createPhysicsTerrain();

    // set flag to update the geometry
    positionAttribute.needsUpdate = true;
    this.terrainGeom.computeVertexNormals();

    if (State.debug) {
      this.visualizeHeightfield();
    }

  }

  setTarget(fraction = 0.5) {
    if (!this.terrainGeom) return;

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