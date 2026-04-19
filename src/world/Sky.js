import * as THREE from 'three';

export class Sky {
  constructor() {
    this.group = new THREE.Group();

    // Sky sphere
    const skyGeo = new THREE.SphereGeometry(1200, 32, 32);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x1a0a2a) },
        bottomColor: { value: new THREE.Color(0x0a0a1a) }
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
        varying vec3 vWorldPos;
        void main() {
          float h = normalize(vWorldPos).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.group.add(skyMesh);

    // Stars
    const starCount = 2000;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1000;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi));
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: true });
    const stars = new THREE.Points(starGeo, starMat);
    this.group.add(stars);

    // Moon
    const moonGeo = new THREE.SphereGeometry(8, 16, 16);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xffffcc,
      emissive: 0xffffcc,
      emissiveIntensity: 0.8
    });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(300, 400, -500);
    this.group.add(moon);
  }

  addToScene(scene) {
    scene.add(this.group);
  }
}
