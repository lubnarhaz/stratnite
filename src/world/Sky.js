import * as THREE from 'three';

export class Sky {
  constructor() {
    this.group = new THREE.Group();

    // Daytime sky sphere - bright blue gradient like Fortnite
    const skyGeo = new THREE.SphereGeometry(1200, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x1e90ff) },    // bright blue
        bottomColor: { value: new THREE.Color(0x87ceeb) },  // light sky blue
        horizonColor: { value: new THREE.Color(0xc9e8f5) }, // pale horizon
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform vec3 horizonColor;
        varying vec3 vWorldPos;
        void main() {
          float h = normalize(vWorldPos).y;
          vec3 col;
          if (h > 0.0) {
            col = mix(horizonColor, topColor, pow(h, 0.6));
          } else {
            col = mix(horizonColor, bottomColor, pow(-h, 0.4));
          }
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.BackSide
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.group.add(skyMesh);

    // Clouds - flat white translucent planes scattered in sky
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    for (let i = 0; i < 30; i++) {
      const cloudGroup = new THREE.Group();
      // Each cloud = cluster of stretched spheres
      const puffs = 3 + Math.floor(Math.random() * 4);
      for (let p = 0; p < puffs; p++) {
        const s = 15 + Math.random() * 25;
        const geo = new THREE.SphereGeometry(s, 8, 6);
        geo.scale(1, 0.3, 1);
        const puff = new THREE.Mesh(geo, cloudMat);
        puff.position.set(
          (Math.random() - 0.5) * s * 1.5,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * s * 1.2
        );
        cloudGroup.add(puff);
      }
      cloudGroup.position.set(
        (Math.random() - 0.5) * 900,
        120 + Math.random() * 100,
        (Math.random() - 0.5) * 900
      );
      this.group.add(cloudGroup);
    }

    // Sun
    const sunGeo = new THREE.SphereGeometry(15, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xffee88,
    });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(300, 350, -400);
    this.group.add(sun);

    // Sun glow
    const glowGeo = new THREE.SphereGeometry(30, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffee88,
      transparent: true,
      opacity: 0.15,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(sun.position);
    this.group.add(glow);
  }

  addToScene(scene) {
    scene.add(this.group);
  }
}
