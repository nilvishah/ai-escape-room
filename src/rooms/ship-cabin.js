import * as THREE from 'three';
import { box, cylinder, mat, blendHex, emissiveMat } from './helpers.js';

export const SHIP_CABIN = {
  id: 'ship-cabin',
  camera: { position: [0, 1.5, 3.5], lookAt: [0, 1.3, 0] },
  fogColor: 0x1a120a,
  fogDensity: 0.07,
  background: 0x0f0c08,
};

export function buildShipCabin(scene) {
  const planks = mat(0x3d2410, 0.9);
  const darkPlank = mat(0x2e1a0c, 0.95);
  const rope = mat(0x8a7055, 0.9);

  // Low ceiling (3.5m — cramped)
  // Floor with diagonal planks
  for (let i = -6; i <= 6; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.02, 10), i % 2 === 0 ? planks : darkPlank);
    m.position.set(i * 0.3, 0, -1);
    m.receiveShadow = true;
    scene.add(m);
  }

  // Curved hull walls — layered boxes to fake curvature
  const hullMat = mat(0x2a1a0a, 0.9);
  const ribMat  = mat(0x1e1208, 0.85);
  [-1, -0.5, 0, 0.5, 1].forEach((t, i) => {
    const curve = Math.sin(t * Math.PI * 0.5) * 0.4;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.6, 0.12), hullMat);
    panel.position.set(-6.5 + curve, 1.8, -2 + i * 0.9);
    panel.rotation.y = Math.PI / 2 + t * 0.08;
    panel.receiveShadow = true;
    scene.add(panel);

    const panel2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.6, 0.12), hullMat);
    panel2.position.set(6.5 - curve, 1.8, -2 + i * 0.9);
    panel2.rotation.y = -Math.PI / 2 - t * 0.08;
    panel2.receiveShadow = true;
    scene.add(panel2);
  });

  // Ribs (structural beams across hull)
  for (let z = -5; z <= 3; z += 1.5) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(14, 0.12, 0.12), ribMat);
    rib.position.set(0, 3.3, z);
    scene.add(rib);
  }

  // Back wall (stern)
  const stern = new THREE.Mesh(new THREE.BoxGeometry(14, 3.8, 0.15), hullMat);
  stern.position.set(0, 1.9, -6);
  scene.add(stern);

  // Low ceiling with beams
  const ceilMat = mat(0x1e1208, 0.9);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = 3.6;
  scene.add(ceil);
  for (let z = -4; z <= 3; z += 1.4) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(14, 0.22, 0.18), ribMat);
    beam.position.set(0, 3.5, z);
    beam.castShadow = true;
    scene.add(beam);
  }

  // Porthole on left wall
  addPorthole(scene, -6.4, 2.0, -1.5);
  addPorthole(scene, -6.4, 2.0,  1.2);

  // Hanging lanterns
  addLantern(scene, -2, 3.2, -2);
  addLantern(scene,  2, 3.2, -2);
  addLantern(scene,  0, 3.2,  1);

  // Rope coils on floor
  addRopeCoil(scene, -4, 0, 1);
  addRopeCoil(scene,  5, 0, 2);

  // Ship's wheel mounted on back wall
  addShipsWheel(scene, 0, 2.2, -5.8);

  // Narrow bunk on right side
  addBunk(scene, 5.5, 0, 0);

  return {
    lights: addShipLighting(scene),
    ambientNote: 'dark_tense',
  };
}

function addPorthole(scene, x, y, z) {
  const frameMat = mat(0x887744, 0.3, 0.8);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x112233, roughness: 0.1, metalness: 0.2,
    transparent: true, opacity: 0.7,
  });

  // Frame ring
  const outer = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.07, 8, 20), frameMat);
  outer.rotation.y = Math.PI / 2;
  outer.position.set(x, y, z);
  outer.castShadow = true;
  scene.add(outer);

  // Glass
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.31, 20), glassMat);
  glass.rotation.y = Math.PI / 2;
  glass.position.set(x + 0.02, y, z);
  scene.add(glass);

  // Moonlight through porthole
  const moonbeam = new THREE.SpotLight(0x8899cc, 1.2, 6, Math.PI / 10, 0.4);
  moonbeam.position.set(x + 0.5, y, z);
  moonbeam.target.position.set(x + 4, y - 0.5, z);
  scene.add(moonbeam);
  scene.add(moonbeam.target);
}

function addLantern(scene, x, y, z) {
  const metalMat = mat(0x554433, 0.4, 0.6);
  const glassMat = emissiveMat(0xff9933, 0xff6600, 0.5, 0.3);

  // Chain
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.3, 4), metalMat);
  chain.position.set(x, y + 0.15, z);
  scene.add(chain);

  // Body
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.28, 8), metalMat);
  body.position.set(x, y, z);
  body.castShadow = true;
  scene.add(body);

  // Glass panels
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.2, 0.02), glassMat);
    panel.position.set(x + Math.cos(angle) * 0.1, y, z + Math.sin(angle) * 0.1);
    panel.rotation.y = angle;
    scene.add(panel);
  }

  // Light
  const light = new THREE.PointLight(0xff8833, 1.4, 4.5);
  light.position.set(x, y - 0.1, z);
  light.userData.flicker = true;
  light.userData.baseIntensity = 1.4;
  scene.add(light);
  return light;
}

function addRopeCoil(scene, x, y, z) {
  const ropeMat = mat(0x8a7055, 0.95);
  for (let i = 0; i < 4; i++) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.25 - i * 0.04, 0.025, 6, 16), ropeMat);
    coil.rotation.x = Math.PI / 2;
    coil.position.set(x, y + 0.025 + i * 0.05, z);
    coil.castShadow = true;
    scene.add(coil);
  }
}

function addShipsWheel(scene, x, y, z) {
  const woodMat = mat(0x5a3a1a, 0.75);
  const brassMat = mat(0xddaa33, 0.3, 0.8);

  // Hub
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12), brassMat);
  hub.rotation.x = Math.PI / 2;
  hub.position.set(x, y, z);
  scene.add(hub);

  // Rim
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.04, 8, 24), woodMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(x, y, z);
  scene.add(rim);

  // Spokes
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 6), woodMat);
    spoke.rotation.z = angle;
    spoke.position.set(x + Math.cos(angle) * 0.275, y + Math.sin(angle) * 0.275, z + 0.02);
    scene.add(spoke);
  }
}

function addBunk(scene, x, y, z) {
  const woodMat = mat(0x3d2410, 0.85);
  const mattress = mat(0x556677, 0.9);

  // Frame
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 2.2), woodMat); _m.position.set(x, y + 0.8, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  // Mattress
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 2.0), mattress); _m.position.set(x, y + 0.9, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  // Posts
  [[-0.45, -1.0], [0.45, -1.0], [-0.45, 1.0], [0.45, 1.0]].forEach(([px, pz]) => {
    { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.5, 0.07), woodMat); _m.position.set(x + px, y + 0.75, z + pz); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  });
}

function addShipLighting(scene) {
  const lights = [];
  const ambient = new THREE.AmbientLight(0x442211, 0.6);
  scene.add(ambient);

  // Warm fill
  const fill = new THREE.DirectionalLight(0xffd080, 0.5);
  fill.position.set(2, 3, 4);
  scene.add(fill);

  return lights;
}
