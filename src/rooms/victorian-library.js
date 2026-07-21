import * as THREE from 'three';
import { box, cylinder, mat, blendHex, emissiveMat, makeBookshelf } from './helpers.js';

export const VICTORIAN_LIBRARY = {
  id: 'victorian-library',
  camera: { position: [0, 1.7, 5.5], lookAt: [0, 1.5, 0] },
  fogColor: 0x0a0805,
  fogDensity: 0.05,
  background: 0x080604,
};

export function buildVictorianLibrary(scene) {
  const darkWood  = mat(0x1e1208, 0.9);
  const richWood  = mat(0x3d2008, 0.8);
  const wallMat   = mat(0x2a1f12, 0.85);
  const stoneMat  = mat(0x1a1510, 0.9);

  // Floor — dark herringbone parquet
  for (let x = -7; x <= 7; x++) {
    for (let z = -8; z <= 5; z++) {
      const even = (x + z) % 2 === 0;
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.03, 0.95),
        mat(even ? 0x2a1a0a : 0x1e1308, 0.85)
      );
      tile.position.set(x, 0.015, z);
      tile.receiveShadow = true;
      scene.add(tile);
    }
  }

  // Tall walls (6m ceiling — grand)
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), wallMat);
  backWall.position.set(0, 3.5, -8);
  scene.add(backWall);

  // Floor-to-ceiling bookshelves AS the left and right walls
  for (let z = -7; z <= 3; z += 1.3) {
    const shelf = makeBookshelf(0x3d2008, scene);
    shelf.scale.set(1, 1.4, 1);
    shelf.position.set(-7.4, 0, z);
    shelf.rotation.y = Math.PI / 2;
    scene.add(shelf);

    const shelf2 = makeBookshelf(0x2e1a08, scene);
    shelf2.scale.set(1, 1.4, 1);
    shelf2.position.set(7.4, 0, z);
    shelf2.rotation.y = -Math.PI / 2;
    scene.add(shelf2);
  }

  // Ceiling with ornate moulding
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), mat(0x120e08, 0.9));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = 7;
  scene.add(ceil);

  // Coffered ceiling panels
  for (let x = -2; x <= 2; x++) {
    for (let z = -3; z <= 1; z++) {
      const coffer = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 2.4), mat(0x1a1208, 0.9));
      coffer.position.set(x * 2.6, 6.96, z * 2.6);
      scene.add(coffer);
    }
  }

  // Fireplace on back wall
  addFireplace(scene, 0, 0, -7.8);

  // Grand chandelier
  addChandelier(scene, 0, 6.5, -1);

  // Rolling ladder rail
  addLadderRail(scene);

  // Reading table center
  addReadingTable(scene, 0, 0, 1);

  // Wainscoting
  const wainscot = new THREE.Mesh(new THREE.BoxGeometry(16, 0.9, 0.08), mat(0x2a1a0a, 0.75));
  wainscot.position.set(0, 0.45, -7.95);
  scene.add(wainscot);

  addVictorianLighting(scene);
}

function addFireplace(scene, x, y, z) {
  const stone = mat(0x2a2520, 0.9);
  const dark  = mat(0x0a0808, 0.95);
  const ember = emissiveMat(0xff4400, 0xff2200, 0.8, 0.5);

  // Mantel surround
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.18, 0.5), stone); _m.position.set(x, y + 2.2, z + 0.3); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.0, 0.45), stone); _m.position.set(x - 1.3, y + 1.1, z + 0.3); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.0, 0.45), stone); _m.position.set(x + 1.3, y + 1.1, z + 0.3); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };

  // Opening
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 0.6), dark); _m.position.set(x, y + 0.9, z + 0.35); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };

  // Embers / glow
  for (let i = 0; i < 4; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), mat(0x1a0a00, 0.95));
    log.rotation.z = Math.PI / 2;
    log.position.set(x - 0.2 + i * 0.14, y + 0.12, z + 0.3);
    scene.add(log);
  }
  const ember1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), ember);
  ember1.position.set(x, y + 0.15, z + 0.28);
  scene.add(ember1);

  // Fire light
  const fireLight = new THREE.PointLight(0xff6600, 2.5, 8);
  fireLight.position.set(x, y + 0.6, z + 0.5);
  fireLight.userData.flicker = true;
  fireLight.userData.baseIntensity = 2.5;
  scene.add(fireLight);
}

function addChandelier(scene, x, y, z) {
  const metalMat = mat(0x554433, 0.3, 0.7);
  const glassMat = emissiveMat(0xfff5c0, 0xffdd88, 0.9, 0.2);

  // Center drop rod
  { const _m = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8), metalMat); _m.position.set(x, y, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };

  // Main ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.03, 8, 24), metalMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(x, y - 0.6, z);
  scene.add(ring);

  // Candles around ring
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const cx = x + Math.cos(angle) * 0.7;
    const cz = z + Math.sin(angle) * 0.7;

    // Candle
    { const _m = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.14, 6), mat(0xeeeedd, 0.8)); _m.position.set(cx, y - 0.57, cz); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); }
    // Flame glow
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), glassMat);
    flame.position.set(cx, y - 0.48, cz);
    scene.add(flame);

    const candleLight = new THREE.PointLight(0xffcc44, 0.3, 3);
    candleLight.position.set(cx, y - 0.45, cz);
    candleLight.userData.flicker = true;
    candleLight.userData.baseIntensity = 0.3;
    scene.add(candleLight);
  }
}

function addLadderRail(scene) {
  const metalMat = mat(0x4a3820, 0.4, 0.6);

  // Rail rod along left wall at height 2.5m
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 12, 8), metalMat);
  rail.rotation.z = Math.PI / 2;
  rail.position.set(0, 2.8, -7.3);
  scene.add(rail);

  // Ladder leaning against shelf
  const rungMat = mat(0x3d2008, 0.8);
  const stile   = mat(0x2a1a08, 0.8);
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.5, 0.06), stile); _m.position.set(-5.5, 1.25, -6.8); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.5, 0.06), stile); _m.position.set(-4.9, 1.25, -6.8); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  for (let i = 0; i < 6; i++) {
    { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.04), rungMat); _m.position.set(-5.2, 0.25 + i * 0.42, -6.8); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  }
}

function addReadingTable(scene, x, y, z) {
  const wood = mat(0x3a2010, 0.75);
  const felt = mat(0x1a3a1a, 0.95);
  const brass = mat(0xddaa33, 0.3, 0.8);

  // Table top
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.0), wood); _m.position.set(x, y + 0.82, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  // Green felt surface
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.01, 0.88), felt); _m.position.set(x, y + 0.87, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  // Legs
  [[-0.95, -0.4], [0.95, -0.4], [-0.95, 0.4], [0.95, 0.4]].forEach(([lx, lz]) => {
    { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.82, 0.07), wood); _m.position.set(x + lx, y + 0.41, z + lz); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  });

  // Desk lamp
  const poleH = 0.55;
  { const _m = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, poleH, 6), brass); _m.position.set(x - 0.7, y + 0.87 + poleH / 2, z - 0.2); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.18, 8, 1, true), mat(0x1a2a1a, 0.6, 0, { side: THREE.DoubleSide }));
  shade.rotation.x = Math.PI;
  shade.position.set(x - 0.7, y + 0.87 + poleH + 0.06, z - 0.2);
  scene.add(shade);
  const lampLight = new THREE.PointLight(0xffee88, 1.2, 3.5);
  lampLight.position.set(x - 0.7, y + 0.87 + poleH - 0.05, z - 0.2);
  scene.add(lampLight);
}

function addVictorianLighting(scene) {
  scene.add(new THREE.AmbientLight(0x1a1005, 0.5));

  const fill = new THREE.DirectionalLight(0xffcc88, 1.5);
  fill.position.set(2, 5, 4);
  scene.add(fill);
}
