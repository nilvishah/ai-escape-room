import * as THREE from 'three';
import { box, cylinder, mat, blendHex, emissiveMat, addTorch } from './helpers.js';

export const ANCIENT_TOMB = {
  id: 'ancient-tomb',
  camera: { position: [0, 1.7, 5], lookAt: [0, 1.4, 0] },
  fogColor: 0x0a0805,
  fogDensity: 0.09,
  background: 0x070504,
};

export function buildAncientTomb(scene) {
  const stone     = mat(0x2a2520, 0.95);
  const darkStone = mat(0x1a1810, 0.98);
  const sandMat   = mat(0x5a4a2a, 0.98);

  // Sand floor with texture variation
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), sandMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Scattered sand drifts
  for (let i = 0; i < 8; i++) {
    const drift = new THREE.Mesh(
      new THREE.SphereGeometry(0.3 + Math.random() * 0.4, 8, 4),
      mat(0x6a5a3a, 0.99)
    );
    drift.scale.y = 0.2;
    drift.position.set((Math.random() - 0.5) * 10, 0.05, (Math.random() - 0.5) * 8 - 1);
    drift.receiveShadow = true;
    scene.add(drift);
  }

  // Stone block walls — hand-cut blocks
  buildStoneWall(scene, 0, 0, -7, 14, 5.5, false);    // back
  buildStoneWall(scene, -7, 0, 0, 14, 5.5, true);     // left
  buildStoneWall(scene,  7, 0, 0, 14, 5.5, true);     // right

  // Vaulted ceiling
  buildVaultedCeiling(scene);

  // Hieroglyph panels on walls
  addHieroglyphPanel(scene, -2.5, 1.5, -6.9, 0);
  addHieroglyphPanel(scene,  2.5, 1.5, -6.9, 0);
  addHieroglyphPanel(scene, -6.9, 1.5,  0,   Math.PI / 2);

  // Sarcophagus
  addSarcophagus(scene, 0, 0, -4);

  // Stone pillars
  addPillar(scene, -3, 0, -2);
  addPillar(scene,  3, 0, -2);
  addPillar(scene, -3, 0, -5);
  addPillar(scene,  3, 0, -5);

  // Torch sconces
  addTorch(scene, -6.5, 2.5, -3);
  addTorch(scene,  6.5, 2.5, -3);
  addTorch(scene, -6.5, 2.5, 0.5);
  addTorch(scene, -2.5, 2.5, -6.8);
  addTorch(scene,  2.5, 2.5, -6.8);

  // Treasure pots
  addUrn(scene, -5, 0, -1);
  addUrn(scene,  5.5, 0, 0.5);
  addUrn(scene, -1.5, 0, 1.5);

  // Rubble piles
  addRubble(scene, 4, 0, 2);
  addRubble(scene, -5, 0, 1);

  addTombLighting(scene);
}

function buildStoneWall(scene, x, y, z, width, height, isLeft) {
  const blockW = 1.4;
  const blockH = 0.7;
  const cols = Math.ceil(width / blockW);
  const rows = Math.ceil(height / blockH);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const offset = row % 2 === 0 ? 0 : blockW / 2;
      const shade = 0x22201a + Math.floor(Math.random() * 0x080808);
      const blockMat = mat(shade, 0.9 + Math.random() * 0.08);

      const block = new THREE.Mesh(
        new THREE.BoxGeometry(blockW - 0.04, blockH - 0.04, 0.3),
        blockMat
      );

      if (isLeft) {
        block.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
        block.position.set(x, y + blockH / 2 + row * blockH, -width / 2 + offset + col * blockW);
      } else {
        block.position.set(-width / 2 + offset + col * blockW, y + blockH / 2 + row * blockH, z);
      }
      block.receiveShadow = true;
      block.castShadow = true;
      scene.add(block);
    }
  }
}

function buildVaultedCeiling(scene) {
  const stoneMat = mat(0x1e1c16, 0.95);
  const keystone = mat(0x2a2820, 0.9);

  // Ribs of the vault
  for (let z = -6; z <= 3; z += 1.5) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI;
      const r = 5.5;
      const bx = Math.cos(angle - Math.PI / 2) * r;
      const by = Math.sin(angle - Math.PI / 2) * r + r;
      const segment = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, 0.25), i === 4 ? keystone : stoneMat);
      segment.position.set(bx, by + 1, z);
      segment.rotation.z = angle - Math.PI / 2;
      segment.castShadow = true;
      scene.add(segment);
    }
  }

  // Flat ceiling fill
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), mat(0x120e0a, 0.98));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = 6.5;
  scene.add(ceil);
}

function addHieroglyphPanel(scene, x, y, z, rotY) {
  const stoneMat = mat(0x2e2a22, 0.9);
  const glyphMat = emissiveMat(0x6a5a20, 0x8a7a30, 0.2, 0.8);

  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 0.08), stoneMat);
  panel.rotation.y = rotY;
  panel.position.set(x, y, z);
  panel.castShadow = true;
  scene.add(panel);

  // Glyph rows
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const glyph = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.03), glyphMat);
      const offX = -0.45 + col * 0.3;
      const offY = 0.5 - row * 0.5;
      if (rotY === 0) {
        glyph.position.set(x + offX, y + offY, z + 0.06);
      } else {
        glyph.position.set(x + 0.06, y + offY, z + offX);
        glyph.rotation.y = rotY;
      }
      scene.add(glyph);
    }
  }
}

function addSarcophagus(scene, x, y, z) {
  const stoneMat = mat(0x3a3028, 0.85);
  const goldMat  = mat(0xddaa22, 0.3, 0.7);
  const faceMat  = emissiveMat(0xddaa22, 0xccaa00, 0.15, 0.5);

  // Base
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 2.4), stoneMat); _m.position.set(x, y + 0.25, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  // Lid (slightly ajar)
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.2, 2.38), stoneMat);
  lid.position.set(x + 0.1, y + 0.6, z);
  lid.rotation.z = 0.08;
  scene.add(lid);

  // Gold trim
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.06, 2.44), goldMat); _m.position.set(x, y + 0.5, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };

  // Face carving
  const face = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.06), faceMat);
  face.position.set(x + 0.1, y + 0.65, z + 0.9);
  scene.add(face);
}

function addPillar(scene, x, y, z) {
  const stoneMat = mat(0x2e2a22, 0.9);
  const capMat   = mat(0x3a3428, 0.85);

  // Base
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.7), capMat); _m.position.set(x, y + 0.15, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  // Shaft
  { const _m = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 4.5, 8), stoneMat); _m.position.set(x, y + 2.55, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  // Capital
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.7), capMat); _m.position.set(x, y + 4.95, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  { const _m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.15, 0.9), capMat); _m.position.set(x, y + 5.17, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
}

function addUrn(scene, x, y, z) {
  const clayMat = mat(0x6a4a2a, 0.9);
  const goldMat = mat(0xccaa22, 0.35, 0.6);

  // Body
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.55, 10), clayMat);
  body.position.set(x, y + 0.35, z);
  scene.add(body);
  // Neck
  { const _m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 0.2, 8), clayMat); _m.position.set(x, y + 0.7, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  // Rim
  { const _m = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.05, 8), goldMat); _m.position.set(x, y + 0.82, z); _m.castShadow=true; _m.receiveShadow=true; scene.add(_m); };
  // Handles
  [-1, 1].forEach(side => {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 10), clayMat);
    handle.rotation.y = Math.PI / 2;
    handle.position.set(x + side * 0.2, y + 0.45, z);
    scene.add(handle);
  });
}

function addRubble(scene, x, y, z) {
  const stoneMat = mat(0x2a2520, 0.95);
  for (let i = 0; i < 6; i++) {
    const size = 0.1 + Math.random() * 0.2;
    const chunk = new THREE.Mesh(new THREE.DodecahedronGeometry(size, 0), stoneMat);
    chunk.position.set(
      x + (Math.random() - 0.5) * 0.8,
      y + size * 0.5,
      z + (Math.random() - 0.5) * 0.8
    );
    chunk.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    chunk.castShadow = true;
    scene.add(chunk);
  }
}

function addTombLighting(scene) {
  scene.add(new THREE.AmbientLight(0x110d08, 0.4));
  // Subtle fill so nothing is pure black
  const fill = new THREE.DirectionalLight(0x443322, 0.3);
  fill.position.set(0, 5, 3);
  scene.add(fill);
}
