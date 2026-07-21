import * as THREE from 'three';
import { makeBillboard, makeBookshelf, makeChest, makeSafe, makeDesk, mat, emissiveMat, blendHex, box, cylinder } from './helpers.js';
import { buildShipCabin,        SHIP_CABIN }        from './ship-cabin.js';
import { buildVictorianLibrary, VICTORIAN_LIBRARY } from './victorian-library.js';
import { buildUndergroundLab,   UNDERGROUND_LAB }   from './underground-lab.js';
import { buildAncientTomb,      ANCIENT_TOMB }       from './ancient-tomb.js';
import { buildSpaceStation,     SPACE_STATION }      from './space-station.js';
import { buildHauntedManor,     HAUNTED_MANOR }      from './haunted-manor.js';
import { registerObject } from '../engine/animator.js';

// Map archetype id → config + builder
const ARCHETYPES = {
  'ship-cabin':        { config: SHIP_CABIN,        build: buildShipCabin },
  'victorian-library': { config: VICTORIAN_LIBRARY, build: buildVictorianLibrary },
  'underground-lab':   { config: UNDERGROUND_LAB,   build: buildUndergroundLab },
  'ancient-tomb':      { config: ANCIENT_TOMB,       build: buildAncientTomb },
  'space-station':     { config: SPACE_STATION,      build: buildSpaceStation },
  'haunted-manor':     { config: HAUNTED_MANOR,      build: buildHauntedManor },
};

// Zone positions per archetype (all rooms share the same logical zones)
const ZONES = {
  'back-center':  { x: 0,    z: -6.5, rotY: 0 },
  'back-left':    { x: -3.5, z: -6.5, rotY: 0.1 },
  'back-right':   { x: 3.5,  z: -6.5, rotY: -0.1 },
  'left-wall':    { x: -6.2, z: -2.5, rotY:  Math.PI / 2 },
  'right-wall':   { x: 6.2,  z: -2.5, rotY: -Math.PI / 2 },
  'floor-left':   { x: -3.2, z: 0.5,  rotY: 0.2 },
  'floor-right':  { x: 3.2,  z: 0.5,  rotY: -0.2 },
  'floor-center': { x: 0,    z: 1.5,  rotY: 0 },
};

// Returns { config } for the archetype
export function getArchetype(archetypeId) {
  return ARCHETYPES[archetypeId] || ARCHETYPES['victorian-library'];
}

// Build the room shell — returns flickering lights for animation
export function buildRoom(scene, archetypeId) {
  const archetype = ARCHETYPES[archetypeId] || ARCHETYPES['victorian-library'];
  return archetype.build(scene);
}

// Place interactive objects from blueprint into the scene
export function buildObjects(scene, blueprint, themeColors) {
  const groups = [];

  blueprint.objects.forEach(obj => {
    const zone = ZONES[obj.zone] || ZONES['floor-center'];
    const group = new THREE.Group();

    // Build the prop mesh
    const prop = buildProp(obj, themeColors);
    group.add(prop);

    // Emoji billboard floating above
    const billboard = makeBillboard(obj.emoji);
    billboard.position.y = getPropHeight(obj) + 0.6;
    group.add(billboard);

    // Position
    group.position.set(
      zone.x + (Math.random() - 0.5) * 0.35,
      0,
      zone.z + (Math.random() - 0.5) * 0.35
    );
    group.rotation.y = zone.rotY + (Math.random() - 0.5) * 0.15;

    group.userData.objectId = obj.id;

    // Glow light for hover
    const glow = new THREE.PointLight(themeColors?.accent || 0x7c6ff7, 0, 2);
    glow.position.y = 1;
    group.add(glow);
    group.userData.glow = glow;

    scene.add(group);

    // Register animatable parts with animator
    const parts = extractParts(prop, obj);
    registerObject(obj.id, group, parts);

    groups.push({ group, objectId: obj.id, glow });
  });

  return groups;
}

// ── Prop builder ──────────────────────────────────────────────
function buildProp(obj, themeColors) {
  const name = (obj.name || '').toLowerCase();
  const id   = (obj.id   || '').toLowerCase();
  console.log('Building prop:', name, id);
  const color = parseInt((obj.color || '#4a2f0f').replace('#', ''), 16) || 0x4a2f0f;

  if (matchAny(name, id, ['shelf', 'bookshelf', 'book', 'library']))
    return makeBookshelf(color);
  if (matchAny(name, id, ['safe', 'vault', 'strongbox']))
    return makeSafe(color);
  if (matchAny(name, id, ['chest', 'crate', 'trunk', 'box', 'ancient']))
    return makeChest(color);
  if (matchAny(name, id, ['desk', 'table', 'workbench', 'bench']))
    return makeDesk(color);
  if (matchAny(name, id, ['cabinet', 'locker', 'wardrobe', 'cupboard', 'armoire']))
    return makeCabinet(color);
  if (matchAny(name, id, ['panel', 'console', 'terminal', 'computer', 'screen', 'monitor']))
    return makePanel(color, themeColors);
  if (matchAny(name, id, ['painting', 'portrait', 'canvas', 'picture', 'artwork', 'tapestry']))
    return makeFramedArt(color);
  if (matchAny(name, id, ['clock', 'timepiece']))
    return makeWallClock(color);
  if (matchAny(name, id, ['pedestal', 'plinth', 'pillar', 'stand']))
    return makePedestalProp(color, themeColors);
  if (matchAny(name, id, ['barrel', 'keg', 'cask']))
    return makeBarrel(color);
  if (matchAny(name, id, ['chair', 'throne', 'seat']))
    return makeChair(color);
  if (matchAny(name, id, ['sarcophagus', 'coffin', 'tomb']))
    return makeSarcophagusProp(color);
  if (matchAny(name, id, ['urn', 'vase', 'pot', 'jar']))
    return makeUrn(color);
  if (matchAny(name, id, ['wheel', 'helm']))
    return makeWheelProp(color);
  if (matchAny(name, id, ['altar', 'shrine']))
    return makeAltar(color, themeColors);
  if (matchAny(name, id, ['rack', 'server']))
    return makeServerRack(color);
  if (matchAny(name, id, ['map', 'chart', 'scroll', 'note', 'log', 'journal', 'book']))
    return makeScrollProp(color);

  return makeDisplayPlinth(color, themeColors);
}

function matchAny(name, id, keywords) {
  return keywords.some(k => name.includes(k) || id.includes(k));
}

function getPropHeight(obj) {
  const name = (obj.name || '').toLowerCase();
  if (matchAny(name, '', ['shelf', 'bookshelf', 'cabinet', 'wardrobe', 'rack'])) return 2.1;
  if (matchAny(name, '', ['safe', 'vault'])) return 1.1;
  if (matchAny(name, '', ['chest', 'trunk'])) return 0.6;
  if (matchAny(name, '', ['desk', 'table', 'bench'])) return 0.9;
  if (matchAny(name, '', ['panel', 'console', 'terminal'])) return 1.5;
  if (matchAny(name, '', ['painting', 'portrait', 'tapestry'])) return 1.6;
  if (matchAny(name, '', ['clock'])) return 1.5;
  if (matchAny(name, '', ['pedestal', 'altar'])) return 1.2;
  if (matchAny(name, '', ['barrel', 'keg'])) return 0.8;
  return 1.0;
}

// ── Extract animatable parts from a built prop ────────────────
// Each prop builder tags key meshes via userData so we can find them
function extractParts(propGroup, obj) {
  const parts = {};
  const name = (obj.name || '').toLowerCase();
  const id   = (obj.id   || '').toLowerCase();

  propGroup.traverse(child => {
    if (!child.isMesh) return;
    if (child.userData.role === 'door')        parts.door        = child;
    if (child.userData.role === 'lid')         parts.lid         = child;
    if (child.userData.role === 'cabinetDoor') parts.cabinetDoor = child;
    if (child.userData.role === 'screen')      parts.screen      = child;
    if (child.userData.role === 'gem')         parts.gem         = child;
  });

  return parts;
}

// ── Individual prop builders ──────────────────────────────────

function makeCabinet(color) {
  const g = new THREE.Group();
  const m1 = mat(color, 0.7, 0.2);
  const m2 = mat(blendHex(color, 0x000000, 0.3), 0.5);
  const metal = mat(0x99aacc, 0.3, 0.8);

  g.add(box(0.9, 1.8, 0.45, m1, 0, 0.9, 0));
  g.add(box(0.85, 0.86, 0.03, m2, 0, 1.35, 0.235));
  g.add(box(0.85, 0.86, 0.03, m2, 0, 0.45, 0.235));
  g.add(box(0.04, 0.2, 0.04, metal, 0.3, 1.35, 0.27));
  g.add(box(0.04, 0.2, 0.04, metal, 0.3, 0.45, 0.27));
  return g;
}

function makePanel(color, themeColors) {
  const g = new THREE.Group();
  const m1 = mat(color, 0.5, 0.3);
  const screenMat = emissiveMat(0x001133, 0x0033aa, 0.5, 0.3);
  const accent = themeColors?.accent || 0x4466ff;
  const btn1 = emissiveMat(0xdd3322, 0xdd3322, 0.4, 0.4);
  const btn2 = emissiveMat(accent, accent, 0.4, 0.4);

  g.add(box(1.1, 1.5, 0.2, m1, 0, 0.75, 0));
  const screenMesh = box(0.75, 0.45, 0.03, screenMat, 0, 1.1, 0.12);
  screenMesh.userData.role = 'screen';
  g.add(screenMesh);
  const btnColors = [btn1, btn2, btn1, btn2, btn2, btn1];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 8), btnColors[row * 3 + col]);
      btn.rotation.x = Math.PI / 2;
      btn.position.set(-0.22 + col * 0.22, 0.55 - row * 0.18, 0.12);
      g.add(btn);
    }
  }
  return g;
}

function makeFramedArt(color) {
  const g = new THREE.Group();
  const frameMat  = mat(color, 0.6, 0.2);
  const canvasMat = mat(blendHex(color, 0x112233, 0.5), 0.9);

  g.add(box(1.1, 0.08, 0.06, frameMat, 0, 0.75, 0));
  g.add(box(1.1, 0.08, 0.06, frameMat, 0, 1.55, 0));
  g.add(box(0.08, 0.88, 0.06, frameMat, -0.51, 1.15, 0));
  g.add(box(0.08, 0.88, 0.06, frameMat,  0.51, 1.15, 0));
  g.add(box(0.92, 0.72, 0.02, canvasMat, 0, 1.15, 0.02));
  return g;
}

function makeWallClock(color) {
  const g = new THREE.Group();
  const caseMat = mat(color, 0.6);
  const face    = mat(0xf5f0e8, 0.9);
  const hand    = mat(0x111111, 0.5);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 24), caseMat);
  body.rotation.x = Math.PI / 2;
  body.position.y = 1.2;
  g.add(body);

  const faceM = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.03, 24), face);
  faceM.rotation.x = Math.PI / 2;
  faceM.position.set(0, 1.2, 0.06);
  g.add(faceM);

  g.add(box(0.04, 0.25, 0.02, hand, 0.05, 1.3, 0.1));
  g.add(box(0.03, 0.35, 0.02, hand, -0.08, 1.28, 0.1));
  return g;
}

function makePedestalProp(color, themeColors) {
  const g = new THREE.Group();
  const m = mat(color, 0.5, 0.3);
  const accent = themeColors?.accent || 0x7c6ff7;

  g.add(box(0.5, 0.05, 0.5, m, 0, 0.025, 0));
  g.add(box(0.35, 0.9, 0.35, m, 0, 0.5, 0));
  g.add(box(0.55, 0.06, 0.55, m, 0, 0.97, 0));

  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16),
    emissiveMat(accent, accent, 0.4, 0.1));
  orb.position.y = 1.2;
  g.add(orb);
  return g;
}

function makeBarrel(color) {
  const g = new THREE.Group();
  const wood  = mat(color, 0.85);
  const metal = mat(0x555544, 0.4, 0.6);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.75, 16), wood);
  body.position.y = 0.375;
  g.add(body);

  [0.2, 0.375, 0.55].forEach(y => {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.025, 6, 24), metal);
    band.rotation.x = Math.PI / 2;
    band.position.y = y;
    g.add(band);
  });
  return g;
}

function makeChair(color) {
  const g = new THREE.Group();
  const wood    = mat(color, 0.8);
  const cushion = mat(blendHex(color, 0x660022, 0.4), 0.95);

  g.add(box(0.6, 0.06, 0.6, wood,    0,  0.45, 0));
  g.add(box(0.55, 0.06, 0.5, cushion, 0, 0.49, 0));
  g.add(box(0.6, 0.7, 0.06, wood,    0,  0.8,  -0.27));
  [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]].forEach(([x, z]) =>
    g.add(box(0.05, 0.45, 0.05, wood, x, 0.225, z))
  );
  return g;
}

function makeSarcophagusProp(color) {
  const g = new THREE.Group();
  const stone = mat(color, 0.85);
  const gold  = mat(0xddaa22, 0.3, 0.7);

  g.add(box(1.0, 0.45, 2.4, stone, 0, 0.225, 0));
  const lid = box(0.98, 0.2, 2.38, stone, 0.1, 0.6, 0);
  lid.rotation.z = 0.08;
  g.add(lid);
  g.add(box(1.04, 0.06, 2.44, gold, 0, 0.5, 0));
  return g;
}

function makeUrn(color) {
  const g = new THREE.Group();
  const clay = mat(color, 0.9);
  const gold = mat(0xccaa22, 0.35, 0.6);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.55, 10), clay);
  body.position.y = 0.35;
  g.add(body);
  { const _m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 0.2, 8), clay); _m.position.set(0, 0.7, 0); _m.castShadow=true; _m.receiveShadow=true; g.add(_m); }
  { const _m = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.05, 8), gold); _m.position.set(0, 0.82, 0); _m.castShadow=true; _m.receiveShadow=true; g.add(_m); }
  return g;
}

function makeWheelProp(color) {
  const g = new THREE.Group();
  const wood  = mat(color, 0.75);
  const brass = mat(0xddaa33, 0.3, 0.8);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 12), brass);
  hub.rotation.x = Math.PI / 2;
  hub.position.y = 1.0;
  g.add(hub);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.04, 8, 24), wood);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.0;
  g.add(rim);

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 6), wood);
    spoke.rotation.z = angle;
    spoke.position.set(Math.cos(angle) * 0.275, 1.0 + Math.sin(angle) * 0.275, 0);
    g.add(spoke);
  }
  return g;
}

function makeAltar(color, themeColors) {
  const g = new THREE.Group();
  const stone  = mat(color, 0.85);
  const accent = themeColors?.accent || 0x7c6ff7;
  const glow   = emissiveMat(accent, accent, 0.5, 0.2);

  g.add(box(1.2, 0.1, 0.8, stone, 0, 0.05, 0));
  g.add(box(0.9, 0.85, 0.6, stone, 0, 0.525, 0));
  g.add(box(1.1, 0.1, 0.75, stone, 0, 0.95, 0));

  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), glow);
  crystal.position.set(0, 1.25, 0);
  g.add(crystal);
  return g;
}

function makeServerRack(color) {
  const g = new THREE.Group();
  const rack   = mat(color, 0.6, 0.3);
  const server = mat(blendHex(color, 0xffffff, 0.1), 0.5, 0.4);
  const led    = emissiveMat(0x00ff44, 0x00ff44, 0.8, 0.3);

  g.add(box(0.6, 2.2, 0.55, rack, 0, 1.1, 0.3));
  for (let i = 0; i < 8; i++) {
    g.add(box(0.54, 0.22, 0.48, server, 0, 0.18 + i * 0.25, 0.28));
    g.add(box(0.03, 0.03, 0.02, led, 0.22, 0.18 + i * 0.25, 0.54));
  }
  return g;
}

function makeScrollProp(color) {
  const g = new THREE.Group();
  const paper = mat(0xd4c4a0, 0.95);
  const wood  = mat(color, 0.8);

  { const _m = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8), wood); _m.position.set(-0.2, 0.55, 0); _m.rotation.set(0, 0, Math.PI / 2); _m.castShadow=true; _m.receiveShadow=true; g.add(_m); }
  { const _m = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8), wood); _m.position.set(0.2, 0.55, 0); _m.rotation.set(0, 0, Math.PI / 2); _m.castShadow=true; _m.receiveShadow=true; g.add(_m); }
  g.add(box(0.35, 0.3, 0.01, paper, 0, 0.55, 0.02));
  return g;
}

function makeDisplayPlinth(color, themeColors) {
  const g = new THREE.Group();
  const m = mat(color, 0.6, 0.1);
  const accent = themeColors?.accent || 0x7c6ff7;

  g.add(box(0.7, 0.08, 0.7, m, 0, 0.04, 0));
  g.add(box(0.55, 0.65, 0.55, m, 0, 0.36, 0));
  g.add(box(0.65, 0.08, 0.65, m, 0, 0.72, 0));

  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0),
    emissiveMat(accent, accent, 0.3, 0.1));
  gem.position.y = 0.95;
  gem.userData.role = 'gem';
  g.add(gem);
  return g;
}
