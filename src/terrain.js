import * as THREE from 'three';
import { State } from './state';
import * as TWEEN from '@tweenjs/tween.js';
import RAPIER from '@dimforge/rapier3d-compat';
// Import the Terrain class from the .mjs file
import 'three.terrain.js/build/THREE.Terrain.js';
window.THREE = THREE;


export class Terrain {
  constructor(scene, world, afterLoad) {
    // terrain generation resolution
    this.xS = 63;
    this.yS = 63;
    // terrain size
    this.xSize = 128;
    this.ySize = 128;
    // terrain height
    this.maxHeight = State.max_height;
    this.minHeight = -20;
    this.snowTop = 20;
    // scene

    this.scene = scene;
    this.world = world; // Rapier physics world
    this.afterLoad = afterLoad;

    // Add new properties for physics resolution
    this.physicsXS = 127; // Double the physics resolution
    this.physicsYS = 127;

    // Add property for physics type
    this.physicsType = State.physics_type || 'spheres'; // 'spheres' or 'heightfield'

    // Properties for sphere-based physics
    this.sphereRadius = 1;
    this.sphereSpacing = 1;
    this.sphereColliders = [];

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
  createPhysicsTerrain() {
    if (this.physicsType === 'heightfield') {
      // Remove existing physics objects first
      if (this.tangible) {
        this.world.removeCollider(this.tangible, true);
      }
      this.createHeightfieldPhysics();
    } else {
      // Remove existing sphere colliders
      for (const collider of this.sphereColliders) {
        this.world.removeCollider(collider, true);
      }
      this.sphereColliders = [];
      this.createSpherePhysics();
    }
  }

  createHeightfieldPhysics() {
    const terrainScale = { x: this.xSize, y: 1, z: this.ySize };
    const terrainRigidBody = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    const terrainColliderDesc = RAPIER.ColliderDesc.heightfield(
      this.physicsXS,
      this.physicsYS,
      this.heightsColMajor,
      terrainScale
    ).setFriction(State.ground_friction);

    terrainColliderDesc.setTranslation(0, 0, 0);
    this.tangible = this.world.createCollider(terrainColliderDesc, terrainRigidBody);
  }

  createSpherePhysics() {
    const positions = this.terrainGeom.getAttribute('position');
    const xOffset = -this.xSize / 2;
    const zOffset = -this.ySize / 2;

    // Create sensor rigid body for all spheres
    const groundRigidBody = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());

    // Place spheres based on terrain height
    for (let x = 0; x <= this.xS; x += this.sphereSpacing) {
        for (let z = 0; z <= this.yS; z += this.sphereSpacing) {
            const vertexIndex = (z * (this.xS + 1) + x) * 3;
            const height = positions.array[vertexIndex + 2];

            const worldX = (x / this.xS) * this.xSize + xOffset;
            const worldZ = (z / this.yS) * this.ySize + zOffset;

            // Create main sphere as a sensor
            const sphereDesc = RAPIER.ColliderDesc.ball(this.sphereRadius)
                .setTranslation(worldX, height-this.sphereRadius/2, worldZ)
                .setSensor(true); // Make it a sensor instead of a physical collider

            const collider = this.world.createCollider(sphereDesc, groundRigidBody);
            this.sphereColliders.push(collider);

            // Create smaller spheres between points if not at the edge
            if (x < this.xS && z < this.yS) {
                // Get height at next points
                const nextXIndex = (z * (this.xS + 1) + (x + this.sphereSpacing)) * 3;
                const nextZIndex = ((z + this.sphereSpacing) * (this.xS + 1) + x) * 3;
                const nextXZIndex = ((z + this.sphereSpacing) * (this.xS + 1) + (x + this.sphereSpacing)) * 3;

                const heightX = positions.array[nextXIndex + 2];
                const heightZ = positions.array[nextZIndex + 2];
                const heightXZ = positions.array[nextXZIndex + 2];

                // Calculate midpoints and heights as before
                const midX = worldX + (this.sphereSpacing * this.xSize) / (2 * this.xS);
                const midZ = worldZ + (this.sphereSpacing * this.ySize) / (2 * this.yS);
                const midHeightXZ = (height + heightX + heightZ + heightXZ) / 4;

                // Create smaller sphere sensor at center point
                const smallerRadius = this.sphereRadius * 0.75;
                const sphereDescCenter = RAPIER.ColliderDesc.ball(smallerRadius)
                    .setTranslation(midX, midHeightXZ-smallerRadius/2, midZ)
                    .setSensor(true);

                this.sphereColliders.push(this.world.createCollider(sphereDescCenter, groundRigidBody));
            }
        }
    }

    if (State.debug) {
        this.visualizeSphereColliders();
    }
  }

  createHeightfield() {
    const positionAttribute = this.terrainGeom.getAttribute('position');
    this.terrainGeom._vBase = Float32Array.from(positionAttribute.array);

    // Visual heights array stays the same
    this.heights = new Float32Array((this.xS + 1) * (this.yS + 1));
    // Physics heights array uses higher resolution
    this.heightsColMajor = new Float32Array((this.physicsYS + 1) * (this.physicsXS + 1));

    // Fill the visual heights array
    for (let i = 0; i < this.heights.length; i++) {
      const vertexIndex = i * 3 + 2;
      this.heights[i] = this.terrainGeom._vBase[vertexIndex];
    }

    // Interpolate heights for physics heightfield
    for (let col = 0; col <= this.physicsXS; col++) {
      for (let row = 0; row <= this.physicsYS; row++) {
        // Convert physics coordinates to visual terrain space
        const visualX = (col / this.physicsXS) * this.xS;
        const visualY = (row / this.physicsYS) * this.yS;

        // Get the four nearest visual terrain points
        const x1 = Math.floor(visualX);
        const x2 = Math.min(Math.ceil(visualX), this.xS);
        const y1 = Math.floor(visualY);
        const y2 = Math.min(Math.ceil(visualY), this.yS);

        // Bilinear interpolation
        const xAlpha = visualX - x1;
        const yAlpha = visualY - y1;

        const h11 = this.heights[y1 * (this.xS + 1) + x1];
        const h21 = this.heights[y1 * (this.xS + 1) + x2];
        const h12 = this.heights[y2 * (this.xS + 1) + x1];
        const h22 = this.heights[y2 * (this.xS + 1) + x2];

        const interpolatedHeight =
          (1 - xAlpha) * (1 - yAlpha) * h11 +
          xAlpha * (1 - yAlpha) * h21 +
          (1 - xAlpha) * yAlpha * h12 +
          xAlpha * yAlpha * h22;

        // for physics
        // Store in column-major format for physics
        const colMajorIndex = col * (this.physicsYS + 1) + row;
        this.heightsColMajor[colMajorIndex] = interpolatedHeight;
      }
    }

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
    if (this.heightfieldPoints) {
      this.scene.remove(this.heightfieldPoints);
      this.heightfieldPoints = null;
    }

    const positions = new Float32Array((this.physicsXS + 1) * (this.physicsYS + 1) * 3);

    for (let i = 0; i <= this.physicsYS; i++) {
      for (let j = 0; j <= this.physicsXS; j++) {
        const colMajorIndex = j * (this.physicsYS + 1) + i;
        const posIndex = (i * (this.physicsXS + 1) + j) * 3;
        // Calculate x and z based on the grid position
        // Scale and center the points to match the collider
        positions[posIndex] = (j / this.physicsXS) * this.xSize - this.xSize / 2;
        positions[posIndex + 1] = this.heightsColMajor[colMajorIndex];
        positions[posIndex + 2] = (i / this.physicsYS) * this.ySize - this.ySize / 2;
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

  visualizeSphereColliders() {
    // Remove existing visualization
    if (this.debugSpheres) {
      this.scene.remove(this.debugSpheres);
    }

    // Create sphere geometry and material
    const sphereGeom = new THREE.SphereGeometry(this.sphereRadius, 8, 8);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });

    // Create instanced mesh for all spheres
    this.debugSpheres = new THREE.InstancedMesh(
      sphereGeom,
      sphereMat,
      this.sphereColliders.length
    );

    // Set position for each sphere instance
    const matrix = new THREE.Matrix4();
    this.sphereColliders.forEach((collider, i) => {
      const position = collider.translation();
      matrix.setPosition(position.x, position.y, position.z);
      this.debugSpheres.setMatrixAt(i, matrix);
    });

    this.scene.add(this.debugSpheres);
  }

  adjustTile() {
    if (!this.terrainGeom?._vBase) return;
    // Update visual geometry
    const positionAttribute = this.terrainGeom.getAttribute('position');
    const positions = positionAttribute.array;

    // Update vertex positions
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 2] = this.minHeight +
        (this.terrainGeom._vBase[i + 2] - this.minHeight) * this.terrainScale;
    }

    // Update physics representation
    this.createPhysicsTerrain();

    // Update visual mesh
    positionAttribute.needsUpdate = true;
    this.terrainGeom.computeVertexNormals();

    if (State.debug) {
      if (this.physicsType === 'heightfield') {
        this.visualizeHeightfield();
      } else {
        this.visualizeSphereColliders();
      }
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