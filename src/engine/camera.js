import { camera } from './scene.js';
import * as THREE from 'three';
import { soundFootstep } from './audio.js';

let isDragging = false;
let lastX = 0, lastY = 0;
let yaw = 0, pitch = 0;
let canvas;
let onClickCallback = null;
let onHoverCallback = null;
let moveStart = { x: 0, y: 0 };
const CLICK_THRESHOLD = 5;

// ── Movement ──────────────────────────────────────────────────
const keys = {};
const velocity = new THREE.Vector3();
const MOVE_SPEED = 3.5;
const DAMPING = 0.88;
let moveLoop = null;

// ── Init ──────────────────────────────────────────────────────
export function initCamera(canvasEl, onClick, onHover) {
  canvas = canvasEl;
  onClickCallback = onClick;
  onHoverCallback = onHover;

  yaw = 0;
  pitch = -0.08;

  canvas.addEventListener('mousedown', onDown);
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', onTouchStart, { passive: true });
  canvas.addEventListener('touchmove', onTouchMove, { passive: true });
  canvas.addEventListener('touchend', onTouchEnd);

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  startMoveLoop();
}

// ── WASD movement ─────────────────────────────────────────────
function onKeyDown(e) {
  keys[e.code] = true;
  // Prevent page scroll
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
    e.preventDefault();
  }
}

function onKeyUp(e) { keys[e.code] = false; }

function startMoveLoop() {
  let lastTime = performance.now();

  function loop() {
    moveLoop = requestAnimationFrame(loop);
    const now = performance.now();
    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    if (!camera) return;

    // Get forward/right vectors from current camera orientation
    const euler = new THREE.Euler(0, yaw, 0, 'YXZ');
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(euler);
    const right   = new THREE.Vector3(1, 0, 0).applyEuler(euler);

    const move = new THREE.Vector3();
    if (keys['KeyW'] || keys['ArrowUp'])    move.add(forward);
    if (keys['KeyS'] || keys['ArrowDown'])  move.sub(forward);
    if (keys['KeyA'] || keys['ArrowLeft'])  move.sub(right);
    if (keys['KeyD'] || keys['ArrowRight']) move.add(right);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(MOVE_SPEED * delta);
      velocity.add(move);
    }

    velocity.multiplyScalar(DAMPING);

    if (velocity.lengthSq() > 0.00001) {
      // Clamp to room bounds
      const next = camera.position.clone().add(velocity);
      next.x = Math.max(-6.5, Math.min(6.5, next.x));
      next.z = Math.max(-6.5, Math.min(5.0, next.z));
      next.y = camera.position.y;
      camera.position.copy(next);

      // Head bob while moving
      const t = performance.now() / 1000;
      camera.position.y = 1.7 + Math.sin(t * 8) * 0.018 * Math.min(velocity.length() * 10, 1);

      // Footstep sound
      const archetype = window._currentArchetype || 'victorian-library';
      soundFootstep(archetype);
    }
  }
  loop();
}

// ── Mouse look ────────────────────────────────────────────────
function onDown(e) {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  moveStart = { x: e.clientX, y: e.clientY };
}

function onMove(e) {
  if (!isDragging && onHoverCallback) {
    onHoverCallback(e.clientX, e.clientY);
  }
  if (!isDragging) return;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
  rotateCam(dx, dy);
}

function onUp(e) {
  if (!isDragging) return;
  isDragging = false;
  const dist = Math.hypot(e.clientX - moveStart.x, e.clientY - moveStart.y);
  if (dist < CLICK_THRESHOLD && onClickCallback) {
    onClickCallback(e.clientX, e.clientY);
  }
}

function onTouchStart(e) {
  if (e.touches.length !== 1) return;
  isDragging = true;
  lastX = e.touches[0].clientX;
  lastY = e.touches[0].clientY;
  moveStart = { x: lastX, y: lastY };
}

function onTouchMove(e) {
  if (!isDragging || e.touches.length !== 1) return;
  const dx = e.touches[0].clientX - lastX;
  const dy = e.touches[0].clientY - lastY;
  lastX = e.touches[0].clientX;
  lastY = e.touches[0].clientY;
  rotateCam(dx, dy);
}

function onTouchEnd(e) {
  if (!isDragging) return;
  isDragging = false;
  if (e.changedTouches.length > 0) {
    const t = e.changedTouches[0];
    const dist = Math.hypot(t.clientX - moveStart.x, t.clientY - moveStart.y);
    if (dist < CLICK_THRESHOLD && onClickCallback) {
      onClickCallback(t.clientX, t.clientY);
    }
  }
}

function rotateCam(dx, dy) {
  const sensitivity = 0.004;
  yaw   -= dx * sensitivity;
  pitch -= dy * sensitivity;
  pitch = Math.max(-0.7, Math.min(0.55, pitch));
  applyRotation();
}

function applyRotation() {
  const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
  const dir   = new THREE.Vector3(0, 0, -1).applyEuler(euler);
  camera.lookAt(camera.position.clone().add(dir));
}

// ── Zoom to world position ────────────────────────────────────
let zoomHomePos   = null;
let zoomHomePitch = 0;
let zoomHomeYaw   = 0;
let zoomTween     = null;

export function zoomToWorldPos(targetWorldPos, onArrived) {
  if (!camera) return;

  // Save home
  zoomHomePos   = camera.position.clone();
  zoomHomePitch = pitch;
  zoomHomeYaw   = yaw;

  // Stop WASD movement during zoom
  Object.keys(keys).forEach(k => keys[k] = false);
  velocity.set(0, 0, 0);

  // Aim toward object
  const dir = new THREE.Vector3().subVectors(targetWorldPos, camera.position).normalize();
  const zoomDest = targetWorldPos.clone().sub(dir.clone().multiplyScalar(1.8));
  zoomDest.y = Math.max(1.1, Math.min(2.0, zoomDest.y));

  // Compute target yaw/pitch to look at object
  const toObj = new THREE.Vector3().subVectors(targetWorldPos, zoomDest);
  const targetYaw   = Math.atan2(-toObj.x, -toObj.z);
  const targetPitch = Math.atan2(toObj.y, Math.sqrt(toObj.x ** 2 + toObj.z ** 2));

  animateCamera(
    camera.position.clone(), zoomDest,
    pitch, targetPitch,
    yaw,   targetYaw,
    0.55,
    () => {
      pitch = targetPitch;
      yaw   = targetYaw;
      onArrived?.();
    }
  );
}

export function zoomBack(onArrived) {
  if (!camera || !zoomHomePos) return;
  animateCamera(
    camera.position.clone(), zoomHomePos,
    pitch, zoomHomePitch,
    yaw,   zoomHomeYaw,
    0.45,
    () => {
      pitch = zoomHomePitch;
      yaw   = zoomHomeYaw;
      applyRotation();
      onArrived?.();
    }
  );
}

function animateCamera(fromPos, toPos, fromPitch, toPitch, fromYaw, toYaw, duration, onDone) {
  const start = performance.now();

  function tick() {
    const elapsed  = (performance.now() - start) / 1000;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = easeInOut(progress);

    camera.position.lerpVectors(fromPos, toPos, eased);

    const curPitch = fromPitch + (toPitch - fromPitch) * eased;
    const curYaw   = fromYaw   + (toYaw   - fromYaw)   * eased;
    const euler    = new THREE.Euler(curPitch, curYaw, 0, 'YXZ');
    const dir      = new THREE.Vector3(0, 0, -1).applyEuler(euler);
    camera.lookAt(camera.position.clone().add(dir));

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      onDone?.();
    }
  }
  requestAnimationFrame(tick);
}

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── Destroy ───────────────────────────────────────────────────
export function destroyCamera() {
  if (!canvas) return;
  canvas.removeEventListener('mousedown', onDown);
  canvas.removeEventListener('mousemove', onMove);
  canvas.removeEventListener('mouseup', onUp);
  canvas.removeEventListener('touchstart', onTouchStart);
  canvas.removeEventListener('touchmove', onTouchMove);
  canvas.removeEventListener('touchend', onTouchEnd);
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  if (moveLoop) cancelAnimationFrame(moveLoop);
}
