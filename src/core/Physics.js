import * as CANNON from 'cannon-es';

export class Physics {
  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -20, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 10;

    this.groundMaterial = new CANNON.Material('ground');
    this.playerMaterial = new CANNON.Material('player');

    const contactMaterial = new CANNON.ContactMaterial(
      this.groundMaterial,
      this.playerMaterial,
      { friction: 0.3, restitution: 0.1 }
    );
    this.world.addContactMaterial(contactMaterial);
  }

  step(dt) {
    this.world.step(1 / 60, dt, 3);
  }

  addBody(body) {
    this.world.addBody(body);
  }

  removeBody(body) {
    this.world.removeBody(body);
  }

  syncMesh(mesh, body) {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  }
}
