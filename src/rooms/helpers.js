import * as THREE from 'three';

// ── Primitive shortcuts ────────────────────────────────────────
export function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function cylinder(rTop, rBot, h, segs, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, segs), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function sphere(r, segs, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, segs, segs), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

// ── Color utilities ────────────────────────────────────────────
export function blendHex(hexA, hexB, t) {
  const a = new THREE.Color(hexA);
  const b = new THREE.Color(hexB);
  return a.lerp(b, t).getHex();
}

export function mat(color, roughness = 0.8, metalness = 0.0, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
}

export function emissiveMat(color, emissive, intensity = 0.4, roughness = 0.4) {
  return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, roughness });
}

// ── Common furniture used across multiple rooms ────────────────

export function makeBookshelf(color = 0x5a3a1a, scene) {
  const g = new THREE.Group();
  const wood = mat(color, 0.8);
  const darkWood = mat(blendHex(color, 0x000000, 0.3), 0.85);

  g.add(box(0.07, 2.1, 1.1, darkWood, 0, 1.05, 0));       // back panel
  g.add(box(1.15, 0.07, 0.38, wood,   0, 2.07, -0.1));    // top
  g.add(box(1.15, 0.07, 0.38, wood,   0, 0.035, -0.1));   // bottom
  g.add(box(0.07, 2.1, 0.38, wood,  -0.54, 1.05, -0.1)); // left side
  g.add(box(0.07, 2.1, 0.38, wood,   0.54, 1.05, -0.1)); // right side
  [0.55, 1.05, 1.58].forEach(y => g.add(box(1.0, 0.05, 0.35, wood, 0, y, -0.1)));

  const bookColors = [0xcc4444, 0x4488cc, 0x44aa66, 0xcc8833, 0x8844cc, 0xcc44aa, 0x44cccc, 0xaa6644];
  for (let shelf = 0; shelf < 3; shelf++) {
    let x = -0.44;
    while (x < 0.44) {
      const w = 0.04 + Math.random() * 0.055;
      const h = 0.22 + Math.random() * 0.14;
      const bm = mat(bookColors[Math.floor(Math.random() * bookColors.length)], 0.7);
      g.add(box(w, h, 0.28, bm, x + w / 2, 0.55 + shelf * 0.53 + h / 2 + 0.05, -0.12));
      x += w + 0.008;
    }
  }
  return g;
}

export function makeChest(color = 0x4a2f0f) {
  const g = new THREE.Group();
  const wood  = mat(color, 0.8);
  const metal = mat(0x887744, 0.3, 0.8);

  g.add(box(1.0, 0.45, 0.65, wood,  0, 0.225, 0));
  const lid = box(1.0, 0.18, 0.65, wood, 0, 0.09, 0);
  lid.rotation.x = -0.3;
  lid.position.set(0, 0.51, -0.06);
  lid.userData.role = 'lid';
  g.add(lid);
  [-0.32, 0.32].forEach(x => g.add(box(0.05, 0.52, 0.68, metal, x, 0.26, 0)));
  g.add(box(0.14, 0.11, 0.07, metal, 0, 0.43, 0.34));
  return g;
}

export function makeSafe(color = 0x2a2a2a) {
  const g = new THREE.Group();
  const metal  = mat(color, 0.4, 0.7);
  const dark   = mat(0x111111, 0.5, 0.8);
  const brass  = mat(0xddbb44, 0.3, 0.9);

  g.add(box(0.9, 1.1, 0.7, metal,  0, 0.55, 0));
  const safeDoor = box(0.76, 0.96, 0.05, dark, 0, 0.55, 0.375);
  safeDoor.userData.role = 'door';
  g.add(safeDoor);
  g.add(box(0.06, 0.06, 0.16, brass, 0.25, 0.55, 0.43));
  for (let i = 0; i < 4; i++) {
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 12), brass);
    dial.rotation.x = Math.PI / 2;
    dial.position.set(-0.22 + i * 0.15, 0.55, 0.42);
    g.add(dial);
  }
  return g;
}

export function makeDesk(color = 0xc4a882) {
  const g = new THREE.Group();
  const wood = mat(color, 0.75);
  const dark = mat(blendHex(color, 0x000000, 0.35), 0.85);

  g.add(box(1.4, 0.07, 0.75, wood, 0, 0.8, 0));
  [[-0.62, -0.3], [0.62, -0.3], [-0.62, 0.3], [0.62, 0.3]].forEach(([x, z]) =>
    g.add(box(0.07, 0.78, 0.07, dark, x, 0.39, z))
  );
  g.add(box(0.55, 0.15, 0.6, wood, 0.2, 0.65, 0.02));
  const knob = sphere(0.025, 8, mat(0x887755, 0.3, 0.7), 0.2, 0.65, 0.37);
  g.add(knob);
  return g;
}

// Emoji sprite billboard
export function makeBillboard(emoji) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.font = '80px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size / 2, size / 2);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sprite.scale.set(0.5, 0.5, 0.5);
  return sprite;
}

// Torch flame light
export function addTorch(scene, x, y, z) {
  const torchMat = mat(0x4a2800, 0.7);
  const handle = cylinder(0.03, 0.03, 0.5, 6, torchMat, x, y - 0.1, z);
  scene.add(handle);
  const flame = new THREE.PointLight(0xff6600, 1.8, 5);
  flame.position.set(x, y + 0.2, z);
  scene.add(flame);

  // Animate flicker
  flame.userData.flicker = true;
  flame.userData.baseIntensity = 1.8;
  return flame;
}

// Fluorescent strip light
export function addFluorescentStrip(scene, x, y, z, length = 2) {
  const stripMat = emissiveMat(0xeeeeff, 0xaaaaff, 0.8, 0.2);
  const strip = box(length, 0.06, 0.12, stripMat, x, y, z);
  scene.add(strip);
  const light = new THREE.PointLight(0xdde8ff, 2.0, 8);
  light.position.set(x, y - 0.2, z);
  scene.add(light);
  light.userData.flicker = false;
  return light;
}
