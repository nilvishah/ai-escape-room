import * as THREE from 'three';
import { getArchetype, buildRoom, buildObjects } from '../rooms/index.js';
import { tickAnimationsOverride } from './animator.js';
import { setAmbientArchetype } from './audio.js';

let scene, camera, renderer, clock;
let roomObjectGroups = [];
let labelContainer;
let animationId;
let animating = false;
let flickerLights = [];
let floaters = [];
let dustSystem = null;

let themeColors = {
  ambient: 0x8899bb,
  wall:    0xd4c9b8,
  floor:   0xa89880,
  ceiling: 0xe8e0d4,
  fog:     0xc8bfb0,
  accent:  0x7c6ff7,
};

export function initScene(canvas) {
  scene = new THREE.Scene();
  clock = new THREE.Clock();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.7, 5.5);
  camera.lookAt(0, 1.4, 0);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 2.8;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  labelContainer = document.createElement('div');
  labelContainer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:10;';
  canvas.parentElement.appendChild(labelContainer);

  startLoop();
  window.addEventListener('resize', onResize);
}

export function setThemeColors(colors) {
  themeColors = { ...themeColors, ...colors };
  if (scene) {
    if (scene.fog) scene.fog.color.setHex(themeColors.fog);
    scene.background = new THREE.Color(themeColors.fog);
  }
}

export function populateRoom(blueprint) {
  roomObjectGroups.forEach(({ group, label }) => {
    scene.remove(group);
    label?.remove();
  });
  roomObjectGroups = [];
  flickerLights = [];
  floaters = [];
  labelContainer.innerHTML = '';

  while (scene.children.length > 0) scene.remove(scene.children[0]);

  const validArchetypes = ['victorian-library','ship-cabin','ancient-tomb','underground-lab','space-station','haunted-manor'];
const archetypeId = validArchetypes.includes(blueprint.archetype) ? blueprint.archetype : 'victorian-library';
  const { config } = getArchetype(archetypeId);

  // Set archetype globally for footsteps and puzzle skins
  window._currentArchetype = archetypeId;

  // Set ambient sound archetype
  setAmbientArchetype(archetypeId);

  scene.fog = new THREE.FogExp2(config.fogColor, config.fogDensity || 0.07);
  scene.background = new THREE.Color(config.background || config.fogColor);

  if (config.camera) {
    const [px, py, pz] = config.camera.position;
    const [lx, ly, lz] = config.camera.lookAt;
    camera.position.set(px, py, pz);
    camera.lookAt(lx, ly, lz);
  }

  buildRoom(scene, archetypeId);

  // Add dust particles
  addDustParticles(archetypeId);

  scene.traverse(obj => {
    if (obj.isLight && obj.userData.flicker) flickerLights.push(obj);
    if (obj.userData.floater) floaters.push(obj);
  });

  const groups = buildObjects(scene, blueprint, themeColors);

  groups.forEach(({ group, objectId, glow }) => {
    const obj = blueprint.objects.find(o => o.id === objectId);
    const label = createLabel(obj?.name || objectId);
    labelContainer.appendChild(label);
    roomObjectGroups.push({ group, objectId, label, glow });
  });
}

function createLabel(name) {
  const div = document.createElement('div');
  div.className = 'object-label';
  div.textContent = name;
  div.style.opacity = '0';
  return div;
}

export function updateLabels() {
  if (!camera || !renderer) return;
  const w = renderer.domElement.clientWidth;
  const h = renderer.domElement.clientHeight;

  roomObjectGroups.forEach(({ group, label }) => {
    if (!label) return;
    const pos = group.position.clone();
    pos.y += 2.4;
    pos.project(camera);

    if (pos.z > 1) { label.style.opacity = '0'; return; }

    const x = (pos.x * 0.5 + 0.5) * w;
    const y = (-pos.y * 0.5 + 0.5) * h;
    const dist = group.position.distanceTo(camera.position);
    const opacity = dist < 7 ? Math.max(0, 1 - (dist - 2.5) / 4.5) : 0;

    label.style.opacity = opacity.toFixed(2);
    label.style.left = x + 'px';
    label.style.top  = y + 'px';
    label.style.transform = 'translate(-50%, -50%)';
  });
}

export function raycast(mouseX, mouseY) {
  if (!camera || !renderer || roomObjectGroups.length === 0) return null;
  const canvas = renderer.domElement;
  const rect = canvas.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((mouseX - rect.left) / rect.width)  * 2 - 1,
    -((mouseY - rect.top) / rect.height) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(ndc, camera);

  const allMeshes = [];
  roomObjectGroups.forEach(ro => ro.group.traverse(c => { if (c.isMesh) allMeshes.push(c); }));

  const hits = raycaster.intersectObjects(allMeshes);
  if (hits.length === 0) return null;

  let obj = hits[0].object;
  while (obj && !obj.userData.objectId) obj = obj.parent;
  return obj?.userData.objectId || null;
}

export function setHoveredObject(objectId) {
  roomObjectGroups.forEach(ro => {
    ro.glow.intensity = ro.objectId === objectId ? 1.2 : 0;
  });
}

export function getObjectWorldPos(objectId) {
  const entry = roomObjectGroups.find(r => r.objectId === objectId);
  if (!entry) return null;
  const pos = new THREE.Vector3();
  entry.group.getWorldPosition(pos);
  pos.y += 0.8;
  return pos;
}

// ── Dust particles ─────────────────────────────────────────────
function addDustParticles(archetypeId) {
  if (dustSystem) { scene.remove(dustSystem); dustSystem = null; }

  // No particles for clean rooms
  if (archetypeId === 'underground-lab' || archetypeId === 'space-station') return;

  const configs = {
    'victorian-library': { count: 180, color: 0xddccaa, size: 0.015, speed: 0.012 },
    'ancient-tomb':      { count: 250, color: 0xc8a87a, size: 0.018, speed: 0.008 },
    'ship-cabin':        { count: 120, color: 0xaabbcc, size: 0.012, speed: 0.02  },
    'haunted-manor':     { count: 200, color: 0xbbaacc, size: 0.016, speed: 0.01  },
  };
  const cfg = configs[archetypeId] || configs['victorian-library'];

  const geo = new THREE.BufferGeometry();
  const positions  = new Float32Array(cfg.count * 3);
  const velocities = new Float32Array(cfg.count * 3);

  for (let i = 0; i < cfg.count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = Math.random() * 5 + 0.5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    velocities[i * 3]     = (Math.random() - 0.5) * cfg.speed;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * cfg.speed * 0.3;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * cfg.speed;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.userData.velocities = velocities;

  const mat = new THREE.PointsMaterial({
    color: cfg.color, size: cfg.size,
    transparent: true, opacity: 0.45, sizeAttenuation: true,
  });

  dustSystem = new THREE.Points(geo, mat);
  scene.add(dustSystem);
}

// ── Render loop ────────────────────────────────────────────────
function startLoop() {
  if (animating) return;
  animating = true;

  function loop() {
    animationId = requestAnimationFrame(loop);
    const delta = clock.getDelta();
    const t = clock.getElapsedTime();

    tickAnimationsOverride(delta);

    flickerLights.forEach(light => {
      const base = light.userData.baseIntensity || 1.0;
      light.intensity = base + (Math.random() - 0.5) * base * 0.25 + Math.sin(t * 8.3) * base * 0.08;
    });

    floaters.forEach(obj => {
      const offset = obj.userData.floatOffset || 0;
      obj.position.y = 1.5 + Math.sin(t * 0.5 + offset) * 0.08;
    });

    roomObjectGroups.forEach((ro, i) => {
      ro.group.position.y += Math.sin(t * 0.5 + i * 1.2) * 0.0001;
      ro.group.traverse(c => {
        if (c.geometry?.type === 'OctahedronGeometry') c.rotation.y += 0.01;
        if (c.geometry?.type === 'SphereGeometry' && c.parent?.userData?.objectId) c.rotation.y += 0.005;
      });
    });

    // Animate dust
    if (dustSystem) {
      const pos = dustSystem.geometry.attributes.position;
      const vel = dustSystem.geometry.userData.velocities;
      for (let i = 0; i < pos.count; i++) {
        pos.array[i * 3]     += vel[i * 3]     + Math.sin(t * 0.3 + i) * 0.0005;
        pos.array[i * 3 + 1] += vel[i * 3 + 1];
        pos.array[i * 3 + 2] += vel[i * 3 + 2];
        if (pos.array[i * 3]     >  6) pos.array[i * 3]     = -6;
        if (pos.array[i * 3]     < -6) pos.array[i * 3]     =  6;
        if (pos.array[i * 3 + 1] > 5.5) pos.array[i * 3 + 1] = 0.5;
        if (pos.array[i * 3 + 1] < 0.5) pos.array[i * 3 + 1] = 5.5;
        if (pos.array[i * 3 + 2] >  6) pos.array[i * 3 + 2] = -6;
        if (pos.array[i * 3 + 2] < -6) pos.array[i * 3 + 2] =  6;
      }
      pos.needsUpdate = true;
    }

    updateLabels();
    renderer.render(scene, camera);
  }
  loop();
}

export function stopScene() {
  cancelAnimationFrame(animationId);
  animating = false;
}

function onResize() {
  if (!renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
}

export { scene, camera, renderer };