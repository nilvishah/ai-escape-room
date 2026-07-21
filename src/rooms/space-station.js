import * as THREE from 'three';
import { box, cylinder, mat, emissiveMat } from './helpers.js';

export const SPACE_STATION = {
  id: 'space-station',
  camera: { position: [0, 1.7, 5], lookAt: [0, 1.5, 0] },
  fogColor: 0x06080f,
  fogDensity: 0.055,
  background: 0x040608,
};

export function buildSpaceStation(scene) {
  const white    = mat(0xdde4ee, 0.5, 0.1);
  const panel    = mat(0xc8d0dc, 0.4, 0.15);
  const darkMat  = mat(0x1a1e28, 0.6, 0.2);
  const titanium = mat(0x8890a0, 0.3, 0.6);

  // Floor — white paneled with grid lines
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), mat(0xd0d8e4, 0.35, 0.1));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Grid lines on floor
  for (let i = -6; i <= 6; i++) {
    const lineH = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.004, 0.03), mat(0xaab8cc, 0.4, 0.2));
    lineH.position.set(0, 0.003, i);
    scene.add(lineH);
    const lineV = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.004, 13.8), mat(0xaab8cc, 0.4, 0.2));
    lineV.position.set(i, 0.003, 0);
    scene.add(lineV);
  }

  // Curved module walls
  const segments = 12;
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI;
    const panelMesh = new THREE.Mesh(new THREE.BoxGeometry(2.8, 5.5, 0.15), i % 2 === 0 ? white : panel);
    panelMesh.position.set(
      Math.cos(angle - Math.PI / 2) * 8,
      2.75,
      Math.sin(angle - Math.PI / 2) * 3 - 3
    );
    panelMesh.rotation.y = angle - Math.PI / 2;
    panelMesh.receiveShadow = true;
    scene.add(panelMesh);
  }

  // Back wall — observation window
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), panel);
  backWall.position.set(0, 3, -7);
  scene.add(backWall);

  // Space window
  addSpaceWindow(scene, 0, 2.5, -6.9);

  // Flat ceiling with LED strips
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), mat(0xdde4f0, 0.4, 0.1));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = 5.5;
  scene.add(ceil);

  // LED strips on ceiling
  addLEDStrip(scene, -3, 5.45, 0, 10, 0x4466ff);
  addLEDStrip(scene,  3, 5.45, 0, 10, 0x4466ff);
  addLEDStrip(scene,  0, 5.45, 0, 10, 0xffffff);

  // Edge strips on walls
  addLEDStrip(scene, 0, 0.05, -6.95, 13, 0x2244aa);
  addLEDStrip(scene, 0, 5.45, -6.95, 13, 0x2244aa);

  // Control panels on walls
  addControlArray(scene, -6.8, 1.5, -2, Math.PI / 2);
  addControlArray(scene,  6.8, 1.5, -2, -Math.PI / 2);

  // Central computer terminal
  addTerminal(scene, 0, 0, -5.5);

  // Storage lockers
  addLockerBank(scene, 5, 0, 1, 3);

  // Floating equipment (slight hover via animation)
  addFloatingEquipment(scene);

  // Danger stripe on floor
  addDangerStripe(scene);

  addSpaceLighting(scene);
}

function addSpaceWindow(scene, x, y, z) {
  const frameMat  = mat(0x8890a0, 0.3, 0.6);
  const spaceMat  = new THREE.MeshStandardMaterial({ color: 0x020408, roughness: 0.1, emissive: 0x010206, emissiveIntensity: 1.0 });
  const starMat   = emissiveMat(0xffffff, 0xffffff, 1.0, 0.0);

  // Frame
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.0, 0.12), frameMat); _m.position.set(x, y, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  // Glass
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.7, 0.05), spaceMat); _m.position.set(x, y, z + 0.05); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };

  // Stars
  for (let i = 0; i < 40; i++) {
    const star = new THREE.Mesh(new THREE.SphereGeometry(0.015, 4, 4), starMat);
    star.position.set(
      x + (Math.random() - 0.5) * 2.6,
      y + (Math.random() - 0.5) * 1.4,
      z + 0.06
    );
    scene.add(star);
  }

  // Window light
  const winLight = new THREE.PointLight(0x4466cc, 0.8, 5);
  winLight.position.set(x, y, z + 0.5);
  scene.add(winLight);
}

function addLEDStrip(scene, x, y, z, length, color) {
  const stripMat = emissiveMat(color, color, 0.9, 0.2);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(length, 0.04, 0.04), stripMat);
  strip.position.set(x, y, z);
  scene.add(strip);

  const light = new THREE.PointLight(color, 0.5, 4);
  light.position.set(x, y - 0.15, z + 0.2);
  scene.add(light);
}

function addControlArray(scene, x, y, z, rotY) {
  const panelMat  = mat(0x2a3040, 0.5, 0.3);
  const screenMat = emissiveMat(0x003366, 0x0044aa, 0.6, 0.3);

  // Panel face
  const panel = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.5, 0.15), panelMat);
  panel.rotation.y = rotY;
  panel.position.set(x, y, z);
  scene.add(panel);

  // Screens
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.05), screenMat);
      screen.rotation.y = rotY;
      const offX = rotY > 0 ? 0 : (-0.9 + col * 0.95);
      const offZ = rotY > 0 ? (-0.9 + col * 0.95) : 0;
      screen.position.set(x + offX, y + 0.5 - row * 0.7, z + offZ);
      scene.add(screen);
    }
  }
}

function addTerminal(scene, x, y, z) {
  const bodyMat   = mat(0x2a3040, 0.5, 0.3);
  const screenMat = emissiveMat(0x002244, 0x0055cc, 0.7, 0.3);
  const keyMat    = mat(0x3a4050, 0.6, 0.2);

  // Base
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.7), bodyMat); _m.position.set(x, y + 0.9, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  // Monitor
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.55, 0.05), screenMat);
  screen.position.set(x, y + 1.35, z - 0.1);
  screen.rotation.x = -0.15;
  scene.add(screen);
  // Keyboard
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.3), keyMat); _m.position.set(x, y + 0.94, z + 0.15); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  // Stand
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.08), bodyMat); _m.position.set(x, y + 1.1, z - 0.1); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
}

function addLockerBank(scene, x, y, z, count) {
  const lockerMat = mat(0x3a4050, 0.5, 0.3);
  const handleMat = mat(0x778899, 0.3, 0.7);

  for (let i = 0; i < count; i++) {
    // Locker body
    { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.0, 0.5), lockerMat); _m.position.set(x, y + 1.0, z + i * 0.58 - 0.58); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
    // Door line
    { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.52, 1.96, 0.03), mat(0x2a3040, 0.5)); _m.position.set(x, y + 1.0, z + i * 0.58 - 0.58 + 0.27); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); }
    // Handle
    { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.04), handleMat); _m.position.set(x + 0.18, y + 1.0, z + i * 0.58 - 0.58 + 0.29); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  }
}

function addFloatingEquipment(scene) {
  const toolMat = mat(0x8890a0, 0.3, 0.6);
  // Tablet
  const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.35, 0.02), mat(0x2a3040, 0.4, 0.3));
  tablet.position.set(2, 1.5, -0.5);
  tablet.rotation.set(0.2, -0.3, 0.1);
  tablet.userData.floater = true;
  tablet.userData.floatOffset = Math.random() * Math.PI * 2;
  scene.add(tablet);

  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 0.01), emissiveMat(0x0044aa, 0x0066ff, 0.5, 0.3));
  screen.position.set(2, 1.5, -0.49);
  screen.rotation.copy(tablet.rotation);
  screen.userData.floater = true;
  screen.userData.floatOffset = tablet.userData.floatOffset;
  scene.add(screen);
}

function addDangerStripe(scene) {
  const yellow = mat(0xddcc00, 0.8);
  const black  = mat(0x111122, 0.8);
  for (let i = 0; i < 8; i++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.003, 2.0), i % 2 === 0 ? yellow : black);
    stripe.position.set(-7.0 + i * 0.32, 0.002, 3.5);
    scene.add(stripe);
  }
}

function addSpaceLighting(scene) {
  scene.add(new THREE.AmbientLight(0x8899cc, 1.0));
  const fill = new THREE.DirectionalLight(0xaabbdd, 0.6);
  fill.position.set(0, 5, 3);
  scene.add(fill);
}
