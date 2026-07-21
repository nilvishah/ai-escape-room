// ── Animator ───────────────────────────────────────────────────
// Manages all in-world animations:
//   - Object open/solve reactions (safe door, chest lid, etc.)
//   - Item glow/float when picked up
//   - Camera zoom-to-object and zoom-back

import * as THREE from 'three';
import { camera } from './scene.js';

// Active tweens: [{ target, prop, from, to, duration, elapsed, ease, onDone }]
const tweens = [];

// Camera home position (restored after zoom)
let cameraHome = null;
let cameraHomeLookAt = null;
let isZoomed = false;

// Registry: objectId → { group, parts: { door, lid, gem, screen... } }
const objectRegistry = new Map();

// ── Public API ────────────────────────────────────────────────

export function registerObject(objectId, group, parts = {}) {
  objectRegistry.set(objectId, { group, parts });
}

// Called from scene.js render loop every frame
export function tickAnimations(delta) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const t = tweens[i];
    t.elapsed += delta;
    const progress = Math.min(t.elapsed / t.duration, 1);
    const eased = t.ease ? t.ease(progress) : progress;

    if (typeof t.from === 'number') {
      t.target[t.prop] = t.from + (t.to - t.from) * eased;
    } else if (t.from && typeof t.from === 'object') {
      // Vector3 or Euler
      for (const key of Object.keys(t.from)) {
        t.target[t.prop][key] = t.from[key] + (t.to[key] - t.from[key]) * eased;
      }
    }

    if (progress >= 1) {
      t.onDone?.();
      tweens.splice(i, 1);
    }
  }
}

// Easing functions
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function tween(target, prop, from, to, duration, ease, onDone) {
  tweens.push({ target, prop, from, to, duration, elapsed: 0, ease, onDone });
}

// ── Object reactions ──────────────────────────────────────────

export function playObjectSolvedAnimation(objectId) {
  const entry = objectRegistry.get(objectId);
  if (!entry) return;

  const { group, parts } = entry;

  // Safe door swings open
  if (parts.door) {
    tween(parts.door.rotation, 'y', parts.door.rotation.y, parts.door.rotation.y + Math.PI * 0.7, 1.0, easeOut);
  }

  // Chest lid lifts open
  if (parts.lid) {
    tween(parts.lid.rotation, 'x', parts.lid.rotation.x, -1.2, 0.8, easeOut);
  }

  // Cabinet door swings
  if (parts.cabinetDoor) {
    tween(parts.cabinetDoor.rotation, 'y', 0, -Math.PI * 0.65, 0.8, easeOut);
  }

  // Console screen turns green on solve
  if (parts.screen) {
    parts.screen.material.color.setHex(0x003300);
    parts.screen.material.emissive.setHex(0x00aa44);
    parts.screen.material.emissiveIntensity = 0.8;
  }

  // Gem/orb pulses bright then settles
  if (parts.gem) {
    tween(parts.gem.material, 'emissiveIntensity', 0.3, 2.0, 0.3, easeOut, () => {
      tween(parts.gem.material, 'emissiveIntensity', 2.0, 0.8, 0.5, easeInOut);
    });
    // Rise slightly
    tween(parts.gem.position, 'y', parts.gem.position.y, parts.gem.position.y + 0.25, 0.6, easeOut);
  }

  // Generic fallback — whole group bobs up with a shimmer
  if (!parts.door && !parts.lid && !parts.gem && !parts.screen) {
    const startY = group.position.y;
    tween(group.position, 'y', startY, startY + 0.3, 0.3, easeOut, () => {
      tween(group.position, 'y', startY + 0.3, startY, 0.4, easeInOut);
    });
  }

  // Always: glow burst on solve
  const glow = group.userData.glow;
  if (glow) {
    glow.intensity = 3.0;
    tween(glow, 'intensity', 3.0, 0.0, 1.2, easeOut);
  }
}

export function playItemPickupAnimation(objectId) {
  const entry = objectRegistry.get(objectId);
  if (!entry) return;
  const { group } = entry;

  // Float up and fade out the billboard
  const billboard = group.children.find(c => c.isSprite);
  if (billboard) {
    tween(billboard.position, 'y', billboard.position.y, billboard.position.y + 0.8, 0.6, easeOut, () => {
      billboard.visible = false;
    });
    tween(billboard.material, 'opacity', 1.0, 0.0, 0.5, easeInOut);
  }

  // Glow flash
  const glow = group.userData.glow;
  if (glow) {
    glow.color.setHex(0xffffaa);
    glow.intensity = 2.5;
    tween(glow, 'intensity', 2.5, 0.0, 0.8, easeOut);
  }
}

// ── Camera zoom ───────────────────────────────────────────────

export function zoomToObject(objectWorldPos, onArrived) {
  if (!camera) return;

  // Save home
  cameraHome = camera.position.clone();
  isZoomed = true;

  // Compute zoom target — pull toward object, stop 1.8 units away
  const dir = new THREE.Vector3()
    .subVectors(objectWorldPos, camera.position)
    .normalize();
  const zoomTarget = objectWorldPos.clone().sub(dir.multiplyScalar(1.8));
  zoomTarget.y = Math.max(1.2, Math.min(zoomTarget.y, 2.2)); // keep eye-level

  const fromPos = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
  };
  const toPos = { x: zoomTarget.x, y: zoomTarget.y, z: zoomTarget.z };

  tween(camera.position, null, fromPos, toPos, 0.5, easeInOut, () => {
    camera.lookAt(objectWorldPos);
    onArrived?.();
  });

  // Animate camera position manually since it's a special case
  tweens[tweens.length - 1].onTick = () => {
    camera.lookAt(objectWorldPos);
  };
}

export function zoomBack(onArrived) {
  if (!camera || !cameraHome) return;
  isZoomed = false;

  const fromPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
  const toPos   = { x: cameraHome.x, y: cameraHome.y, z: cameraHome.z };

  tween(camera.position, null, fromPos, toPos, 0.45, easeInOut, () => {
    onArrived?.();
  });
}

export function isZoomedIn() { return isZoomed; }

// ── Tick override for position tweens ─────────────────────────
// Position tweens need special handling since camera.position is a Vector3
// We override tick to handle the null prop case (direct Vector3 lerp)
const _origTick = tickAnimations;
export function tickAnimationsOverride(delta) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const t = tweens[i];
    t.elapsed += delta;
    const progress = Math.min(t.elapsed / t.duration, 1);
    const eased = t.ease ? t.ease(progress) : progress;

    if (t.prop === null && t.target && t.from && t.to) {
      // Direct object lerp (for camera.position)
      t.target.x = t.from.x + (t.to.x - t.from.x) * eased;
      t.target.y = t.from.y + (t.to.y - t.from.y) * eased;
      t.target.z = t.from.z + (t.to.z - t.from.z) * eased;
      t.onTick?.();
    } else if (typeof t.from === 'number') {
      t.target[t.prop] = t.from + (t.to - t.from) * eased;
    } else if (t.from && typeof t.from === 'object') {
      for (const key of Object.keys(t.from)) {
        t.target[t.prop][key] = t.from[key] + (t.to[key] - t.from[key]) * eased;
      }
    }

    if (progress >= 1) {
      t.onDone?.();
      tweens.splice(i, 1);
    }
  }
}
