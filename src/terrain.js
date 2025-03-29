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

    this.addEarth();
  }

  addEarth() {
    const textureLoader = new THREE.TextureLoader();

    // Load textures
    Promise.all([
      textureLoader.loadAsync('img/sand1.jpg'),
      textureLoader.loadAsync('img/grass1.jpg'),
      textureLoader.loadAsync('img/stone1.jpg'),
      textureLoader.loadAsync('img/snow1.jpg')
    ]).then(([sandTexture, grassTexture, stoneTexture, snowTexture]) => {
      // Create terrain geometry
      const geometry = new THREE.PlaneGeometry(this.xSize, this.ySize, this.xS, this.yS);

      // Create material with texture blending
      const material = new THREE.MeshStandardMaterial({
        map: grassTexture,
        roughness: 0.8,
        metalness: 0.2
      });

      // Create terrain mesh
      this.visual = new THREE.Mesh(geometry, material);
      this.visual.rotation.x = -Math.PI / 2;
      this.visual.receiveShadow = true;

      // Add to scene
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
    if (!this.visual) return;

    const geometry = this.visual.geometry;
    const vertices = geometry.attributes.position.array;

    for (let i = 0; i < vertices.length; i += 3) {
      const z = vertices[i + 2];
      const newZ = this.minHeight + (z - this.minHeight) * this.terrainScale;
      vertices[i + 2] = newZ;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  }
}