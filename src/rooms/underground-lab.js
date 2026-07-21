import * as THREE from 'three';
import { box, cylinder, mat, blendHex, emissiveMat, addFluorescentStrip } from './helpers.js';

export const UNDERGROUND_LAB = {
  id: 'underground-lab',
  camera: { position: [0, 1.7, 5], lookAt: [0, 1.5, 0] },
  fogColor: 0x0a0f14,
  fogDensity: 0.06,
  background: 0x080c10,
};

export function buildUndergroundLab(scene) {
  const concrete = mat(0x2a2e32, 0.95);
  const darkConc = mat(0x1a1e22, 0.98);
  const metal    = mat(0x3a4048, 0.5, 0.4);
  const grating  = mat(0x252a2e, 0.7, 0.5);

  // Concrete floor with grating sections
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), concrete);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Metal grating strips
  for (let z = -5; z <= 3; z += 2.5) {
    const grate = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.04, 0.8), grating);
    grate.position.set(-4, 0.02, z);
    grate.receiveShadow = true;
    scene.add(grate);
  }

  // Concrete walls with exposed conduit
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), concrete);
  backWall.position.set(0, 3, -7);
  scene.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), darkConc);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-8, 3, 0);
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), darkConc);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(8, 3, 0);
  scene.add(rightWall);

  // Drop ceiling with panels
  for (let x = -3; x <= 3; x++) {
    for (let z = -3; z <= 2; z++) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.04, 1.9), mat(0x22262a, 0.9));
      panel.position.set(x * 2, 5.98, z * 2);
      scene.add(panel);
    }
  }
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), darkConc);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = 6;
  scene.add(ceil);

  // Conduit pipes on walls
  addConduits(scene);

  // Fluorescent lights on ceiling
  addFluorescentStrip(scene, -3, 5.9, -3, 3.5);
  addFluorescentStrip(scene,  3, 5.9, -3, 3.5);
  addFluorescentStrip(scene,  0, 5.9,  1, 3.5);

  // Lab benches
  addLabBench(scene, -4, 0, -5, 3);
  addLabBench(scene,  4, 0, -5, 3);

  // Server rack on back wall
  addServerRack(scene, -3, 0, -6.8);
  addServerRack(scene,  3, 0, -6.8);

  // Warning stripes on floor
  addWarningStripes(scene);

  // Emergency exit sign
  addExitSign(scene, 6.5, 3.5, -3);

  addLabLighting(scene);
}

function addConduits(scene) {
  const pipeMat = mat(0x3a4048, 0.5, 0.5);
  const clampMat = mat(0x555a60, 0.4, 0.6);

  // Horizontal runs along left wall
  [1.5, 2.5, 3.5].forEach(y => {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 12, 6), pipeMat);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(0, y, -6.9);
    scene.add(pipe);
  });

  // Clamps
  for (let x = -5; x <= 5; x += 2) {
    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.08), clampMat);
    clamp.position.set(x, 2.5, -6.85);
    scene.add(clamp);
  }
}

function addLabBench(scene, x, y, z, length) {
  const benchMat = mat(0x2a3038, 0.6, 0.2);
  const legMat   = mat(0x3a4048, 0.4, 0.6);
  const topMat   = mat(0x1a2028, 0.4, 0.1);

  // Top
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(length, 0.06, 0.85), topMat); _m.position.set(x, y + 0.9, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  // Body
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(length - 0.1, 0.82, 0.78), benchMat); _m.position.set(x, y + 0.47, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  // Legs
  const hw = length / 2 - 0.1;
  [[-hw, -0.33], [hw, -0.33], [-hw, 0.33], [hw, 0.33]].forEach(([lx, lz]) => {
    { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.88, 0.06), legMat); _m.position.set(x + lx, y + 0.44, z + lz); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  });

  // Beakers/equipment on bench
  addLabEquipment(scene, x, y + 0.93, z);
}

function addLabEquipment(scene, x, y, z) {
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x88aacc, roughness: 0.1, metalness: 0.0, transparent: true, opacity: 0.5 });
  const liquidColors = [0x22ccaa, 0xcc2244, 0xaacc22, 0x2244cc];

  for (let i = 0; i < 3; i++) {
    // Flask
    const flask = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.22, 10), glassMat);
    flask.position.set(x - 0.6 + i * 0.3, y + 0.13, z + 0.1);
    scene.add(flask);

    // Liquid inside
    const liquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.085, 0.1, 10),
      emissiveMat(liquidColors[i % 4], liquidColors[i % 4], 0.3, 0.8)
    );
    liquid.position.set(x - 0.6 + i * 0.3, y + 0.07, z + 0.1);
    scene.add(liquid);
  }
}

function addServerRack(scene, x, y, z) {
  const rackMat   = mat(0x1a1e22, 0.6, 0.3);
  const serverMat = mat(0x252a2e, 0.5, 0.4);
  const led1 = emissiveMat(0x00ff44, 0x00ff44, 0.8, 0.3);
  const led2 = emissiveMat(0xff4400, 0xff4400, 0.8, 0.3);

  // Rack frame
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.2, 0.55), rackMat); _m.position.set(x, y + 1.1, z + 0.3); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };

  // Server units
  for (let i = 0; i < 8; i++) {
    { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.22, 0.48), serverMat); _m.position.set(x, y + 0.18 + i * 0.25, z + 0.28); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
    // LEDs
    const color = Math.random() > 0.3 ? led1 : led2;
    { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.02), color); _m.position.set(x + 0.22, y + 0.18 + i * 0.25, z + 0.54); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  }
}

function addWarningStripes(scene) {
  const yellow = mat(0xddcc00, 0.9);
  const black  = mat(0x111111, 0.9);

  for (let i = 0; i < 6; i++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.005, 1.5), i % 2 === 0 ? yellow : black);
    stripe.position.set(-7.5 + i * 0.28, 0.003, 2.5);
    scene.add(stripe);
  }
}

function addExitSign(scene, x, y, z) {
  const signMat = emissiveMat(0x00cc44, 0x00ff44, 0.9, 0.3);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.05), signMat);
  sign.rotation.y = Math.PI / 2;
  sign.position.set(x, y, z);
  scene.add(sign);

  const light = new THREE.PointLight(0x00ff44, 0.4, 2);
  light.position.set(x - 0.2, y, z);
  scene.add(light);
}

function addLabLighting(scene) {
  scene.add(new THREE.AmbientLight(0x1a2028, 0.7));
  const fill = new THREE.DirectionalLight(0xccddee, 0.5);
  fill.position.set(0, 5, 3);
  scene.add(fill);
}
