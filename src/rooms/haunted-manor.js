import * as THREE from 'three';
import { box, cylinder, mat, blendHex, emissiveMat } from './helpers.js';

export const HAUNTED_MANOR = {
  id: 'haunted-manor',
  camera: { position: [0, 1.7, 5.5], lookAt: [0, 1.5, 0] },
  fogColor: 0x080510,
  fogDensity: 0.08,
  background: 0x060408,
};

export function buildHauntedManor(scene) {
  const darkWood  = mat(0x1a1218, 0.9);
  const wallpaper = mat(0x1e1525, 0.85);
  const purple    = mat(0x2a1a3a, 0.9);

  // Floor — dark parquet
  for (let x = -7; x <= 7; x++) {
    for (let z = -8; z <= 5; z++) {
      const even = (x + z) % 2 === 0;
      const tile = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.02, 0.98), mat(even ? 0x1a1018 : 0x120c14, 0.9));
      tile.position.set(x, 0.01, z);
      tile.receiveShadow = true;
      scene.add(tile);
    }
  }

  // Wallpapered walls with dado rail
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), wallpaper);
  backWall.position.set(0, 3.5, -8);
  scene.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 7), purple);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-8, 3.5, 0);
  scene.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 7), purple);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(8, 3.5, 0);
  scene.add(rightWall);

  // Ceiling
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), mat(0x100c18, 0.9));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = 7;
  scene.add(ceil);

  // Dado rail
  const dadoMat = mat(0x2a1e30, 0.7);
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(16, 0.1, 0.07), dadoMat); _m.position.set(0, 1.1, -7.96); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 14), dadoMat); _m.position.set(-7.96, 1.1, 0); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 14), dadoMat); _m.position.set( 7.96, 1.1, 0); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };

  // Picture rail near ceiling
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(16, 0.07, 0.05), dadoMat); _m.position.set(0, 5.8, -7.96); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };

  // Four-poster bed
  addFourPosterBed(scene, 0, 0, -5.5);

  // Tall gothic window with moonlight
  addGothicWindow(scene, -7.96, 3.5, -2, Math.PI / 2);

  // Ornate fireplace
  addManorFireplace(scene, 0, 0, -7.8);

  // Candelabras
  addCandelabra(scene, -4, 0, 1);
  addCandelabra(scene,  4, 0, 1);

  // Grandfather clock
  addGrandfatherClock(scene, 5.5, 0, -4);

  // Portrait frames on wall
  addPortrait(scene, -3, 2.8, -7.9, 0);
  addPortrait(scene,  3, 2.8, -7.9, 0);

  // Cobweb corners
  addCobweb(scene, -7.5, 6.5, -7.5);
  addCobweb(scene,  7.5, 6.5, -7.5);

  addManorLighting(scene);
}

function addFourPosterBed(scene, x, y, z) {
  const darkWood = mat(0x1a0e14, 0.85);
  const fabric   = mat(0x2a1530, 0.95);
  const pillow   = mat(0x3a2040, 0.9);

  // Base frame
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 2.8), darkWood); _m.position.set(x, y + 0.225, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  // Mattress
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.25, 2.6), fabric); _m.position.set(x, y + 0.575, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  // Pillows
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.5), pillow); _m.position.set(x - 0.45, y + 0.73, z - 1.0); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.5), pillow); _m.position.set(x + 0.45, y + 0.73, z - 1.0); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };

  // Four posts
  [[-0.9, -1.3], [0.9, -1.3], [-0.9, 1.3], [0.9, 1.3]].forEach(([px, pz]) => {
    { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.8, 0.1), darkWood); _m.position.set(x + px, y + 1.4, z + pz); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  });

  // Canopy frame
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.06, 0.08), darkWood); _m.position.set(x, y + 2.77, z - 1.3); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.06, 0.08), darkWood); _m.position.set(x, y + 2.77, z + 1.3); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 2.68), darkWood); _m.position.set(x - 0.9, y + 2.77, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 2.68), darkWood); _m.position.set(x + 0.9, y + 2.77, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };

  // Canopy fabric
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.02, 2.6), fabric); _m.position.set(x, y + 2.8, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
}

function addGothicWindow(scene, x, y, z, rotY) {
  const frameMat  = mat(0x1a1220, 0.7, 0.2);
  const glassMat  = new THREE.MeshStandardMaterial({ color: 0x080a14, roughness: 0.1, transparent: true, opacity: 0.8 });
  const moonMat   = emissiveMat(0x8899bb, 0xaabbdd, 0.5, 0.2);

  // Frame
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.8, 0.12), frameMat);
  frame.rotation.y = rotY;
  frame.position.set(x, y, z);
  scene.add(frame);

  // Glass panes
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.4, 0.04), glassMat);
  glass.rotation.y = rotY;
  glass.position.set(rotY > 0 ? x + 0.05 : x, y, z);
  scene.add(glass);

  // Gothic arch top
  const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 8, 1, false, 0, Math.PI), frameMat);
  arch.rotation.z = Math.PI / 2;
  arch.rotation.y = rotY;
  arch.position.set(rotY > 0 ? x + 0.01 : x, y + 1.6, z);
  scene.add(arch);

  // Moonbeam
  const moonbeam = new THREE.SpotLight(0x6677aa, 1.5, 8, Math.PI / 8, 0.5);
  moonbeam.position.set(rotY > 0 ? x + 1 : x, y + 0.5, z);
  moonbeam.target.position.set(rotY > 0 ? x + 5 : x, y - 1, z);
  scene.add(moonbeam);
  scene.add(moonbeam.target);
}

function addManorFireplace(scene, x, y, z) {
  const marbleMat = mat(0x2a2530, 0.6, 0.1);
  const darkMat   = mat(0x0a0810, 0.95);
  const ember     = emissiveMat(0xff4400, 0xff2200, 0.6, 0.5);

  { const _m = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.18, 0.55), marbleMat); _m.position.set(x, y + 2.2, z + 0.3); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.0, 0.5), marbleMat); _m.position.set(x - 1.35, y + 1.1, z + 0.3); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.0, 0.5), marbleMat); _m.position.set(x + 1.35, y + 1.1, z + 0.3); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 0.55), darkMat); _m.position.set(x, y + 0.9, z + 0.35); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.12), mat(0xddaa22, 0.4, 0.7)); _m.position.set(x, y + 2.31, z + 0.12); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); }

  const fireLight = new THREE.PointLight(0xff5500, 3.0, 7);
  fireLight.position.set(x, y + 0.8, z + 0.5);
  fireLight.userData.flicker = true;
  fireLight.userData.baseIntensity = 3.0;
  scene.add(fireLight);
}

function addCandelabra(scene, x, y, z) {
  const metalMat  = mat(0x2a1a2a, 0.4, 0.5);
  const waxMat    = mat(0xeeeedd, 0.9);
  const flameMat  = emissiveMat(0xffcc44, 0xff9900, 0.8, 0.3);

  { const _m = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.06, 8), metalMat); _m.position.set(x, y + 0.03, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  { const _m = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 6), metalMat); _m.position.set(x, y + 0.58, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  // Arms
  [-0.25, 0, 0.25].forEach((offset, i) => {
    { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.3), metalMat); _m.position.set(x + offset * 0.8, y + 1.1, z + 0.05); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
    { const _m = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.18, 6), waxMat); _m.position.set(x + offset, y + 1.2, z + 0.05); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
    { const _m = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), flameMat); _m.position.set(x + offset, y + 1.31, z + 0.05); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };

    const cl = new THREE.PointLight(0xffaa33, 0.4, 2.5);
    cl.position.set(x + offset, y + 1.32, z + 0.05);
    cl.userData.flicker = true;
    cl.userData.baseIntensity = 0.4;
    scene.add(cl);
  });
}

function addGrandfatherClock(scene, x, y, z) {
  const darkWood = mat(0x1a0e0a, 0.85);
  const faceMat  = mat(0xf5f0e0, 0.9);
  const brassMat = mat(0xddaa22, 0.3, 0.7);

  // Base
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.45), darkWood); _m.position.set(x, y + 0.175, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  // Waist
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 0.38), darkWood); _m.position.set(x, y + 0.9, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  // Hood
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.5), darkWood); _m.position.set(x, y + 1.85, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  // Clock face
  { const _m = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 20), faceMat); _m.position.set(x, y + 1.95, z + 0.26); _m.rotation.set(Math.PI / 2, 0, 0); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  // Pendulum
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.7, 0.02), brassMat); _m.position.set(x, y + 1.15, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  { const _m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 12), brassMat); _m.position.set(x, y + 0.7, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
}

function addPortrait(scene, x, y, z, rotY) {
  const frameMat  = mat(0x2a1a0a, 0.6, 0.2);
  const canvasMat = mat(0x1a1220, 0.9);
  const ghostMat  = emissiveMat(0x334455, 0x445566, 0.1, 0.8);

  { const _m = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 0.08), frameMat); _m.position.set(x, y, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.2, 0.04), canvasMat); _m.position.set(x, y, z + 0.05); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.02), ghostMat); _m.position.set(x, y + 0.1, z + 0.07); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
}

function addCobweb(scene, x, y, z) {
  const webMat = new THREE.MeshStandardMaterial({ color: 0x8888aa, roughness: 1.0, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
  for (let i = 0; i < 5; i++) {
    const strand = new THREE.Mesh(new THREE.BoxGeometry(0.6 - i * 0.1, 0.003, 0.003), webMat);
    strand.position.set(x + 0.1, y - i * 0.08, z + 0.1);
    strand.rotation.z = i * 0.2;
    scene.add(strand);
  }
}

function addManorLighting(scene) {
  scene.add(new THREE.AmbientLight(0x0d0814, 0.4));
  const fill = new THREE.DirectionalLight(0x6655aa, 0.2);
  fill.position.set(-3, 5, 3);
  scene.add(fill);
}
