import * as THREE from 'three';
import { State } from './state';
import TWEEN from '@tweenjs/tween.js';

export class Terrain {
  constructor(scene, afterLoad) {
    this.xS = 63;
    this.yS = 63;
    this.xSize = 128;
    this.ySize = 128;
    this.maxHeight = State.max_height;
    this.minHeight = -20;
    this.snowTop = 20;
    this.scene = scene;
    this.afterLoad = afterLoad;

    // Add physics material properties
    this.groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.05,
      wireframe: true
    });

    this.addEarth();
  }

  addEarth() {
    const textureLoader = new THREE.TextureLoader();

    // Load all textures
    Promise.all([
      textureLoader.loadAsync('img/sand1.jpg'),
      textureLoader.loadAsync('img/grass1.jpg'),
      textureLoader.loadAsync('img/stone1.jpg'),
      textureLoader.loadAsync('img/snow1.jpg')
    ]).then(([sandTexture, grassTexture, stoneTexture, snowTexture]) => {
      // Create blended material using THREE.Terrain helper
      const material = THREE.Terrain.generateBlendedMaterial([
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

      // Create terrain using THREE.Terrain
      this.visual = THREE.Terrain({
        easing: THREE.Terrain.Linear,
        frequency: 2.5,
        heightmap: THREE.Terrain.DiamondSquare,
        material: material,
        maxHeight: this.maxHeight,
        minHeight: this.minHeight,
        steps: 10,
        useBufferGeometry: false,
        xSegments: this.xS,
        xSize: this.xSize,
        ySegments: this.yS,
        ySize: this.ySize
      });

      // Store base vertices for transformations
      this.geo = this.visual.children[0].geometry;
      this.geo._vBase = this.geo.vertices.map(v => v.clone());

      // Create physics mesh
      this.geo.computeFaceNormals();
      this.geo.computeVertexNormals();
      this.tangible = new Physijs.HeightfieldMesh(
        this.geo,
        this.groundMaterial,
        0,
        this.xS,
        this.yS
      );

      this.tangible.rotation.x = -Math.PI / 2;
      this.visual.children[0].receiveShadow = true;

      // Add to scene
      this.scene.add(this.tangible);
      this.scene.add(this.visual);

      // Call afterLoad callback
      if (this.afterLoad) {
        this.afterLoad();
      }
    });
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

  adjustTile() {
    if (!this.geo?._vBase) return;

    for (let i = 0; i < this.geo.vertices.length; i++) {
      const newZ = this.minHeight + (this.geo._vBase[i].z - this.minHeight) * this.terrainScale;
      this.geo.vertices[i].z = newZ;
      this.tangible.setPointByThreeGeomIndex(i, newZ);
    }

    this.tangible.flagUpdate();
    this.geo.verticesNeedUpdate = true;
  }
}