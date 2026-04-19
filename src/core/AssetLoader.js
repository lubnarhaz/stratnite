import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class AssetLoader {
  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.textureLoader = new THREE.TextureLoader();
    this.cache = new Map();
  }

  async loadGLTF(url) {
    if (this.cache.has(url)) return this.cache.get(url);

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          // Enable shadows on all meshes
          gltf.scene.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          this.cache.set(url, gltf);
          resolve(gltf);
        },
        undefined,
        (err) => {
          console.warn(`Failed to load ${url}:`, err);
          reject(err);
        }
      );
    });
  }

  // Clone a loaded GLTF model for reuse
  cloneGLTF(gltf) {
    const clone = gltf.scene.clone(true);
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }

  async loadTexture(url) {
    return new Promise((resolve) => {
      this.textureLoader.load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        resolve(tex);
      });
    });
  }
}

// Singleton
export const assetLoader = new AssetLoader();
