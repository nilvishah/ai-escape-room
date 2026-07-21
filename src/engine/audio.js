let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

let master;
function getMaster() {
  const c = getCtx();
  if (!master) {
    master = c.createGain();
    master.gain.value = 0.15;
    master.connect(c.destination);
  }
  return master;
}

// ── Ambient ────────────────────────────────────────────────────
let droneNodes = [];
let droneRunning = false;
let currentArchetype = 'victorian-library';

export function setAmbientArchetype(archetype) {
  currentArchetype = archetype;
}

export function startAmbient() {
  if (droneRunning) return;
  droneRunning = true;
  const c = getCtx();
  const m = getMaster();

  switch (currentArchetype) {
    case 'ship-cabin':       startShipAmbient(c, m);    break;
    case 'ancient-tomb':     startTombAmbient(c, m);    break;
    case 'underground-lab':  startLabAmbient(c, m);     break;
    case 'space-station':    startSpaceAmbient(c, m);   break;
    case 'haunted-manor':    startManorAmbient(c, m);   break;
    default:                 startLibraryAmbient(c, m); break;
  }
}

// Victorian library — deep organ drone, paper rustle
function startLibraryAmbient(c, m) {
  [55, 82.4, 110].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    const filter = c.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.value = 280 + i * 60;
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(0.03 - i * 0.005, c.currentTime + 4);
    osc.connect(filter); filter.connect(gain); gain.connect(m);
    osc.start();
    droneNodes.push(osc, gain);
  });
  scheduleRandomNoise(c, m, 0.008, 'lowpass', 300); // paper rustle
}

// Ship cabin — low rumble, creaking wood
function startShipAmbient(c, m) {
  // Deep engine rumble
  [40, 60, 80].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(0.05 - i * 0.01, c.currentTime + 3);
    osc.connect(gain); gain.connect(m);
    osc.start();
    droneNodes.push(osc, gain);
  });
  // Wood creak LFO
  const lfoOsc = c.createOscillator();
  const lfoGain = c.createGain();
  const creak = c.createOscillator();
  const creakGain = c.createGain();
  lfoOsc.frequency.value = 0.08;
  lfoGain.gain.value = 30;
  creak.frequency.value = 120;
  creak.type = 'sawtooth';
  creakGain.gain.value = 0.02;
  lfoOsc.connect(lfoGain); lfoGain.connect(creak.frequency);
  creak.connect(creakGain); creakGain.connect(m);
  lfoOsc.start(); creak.start();
  droneNodes.push(lfoOsc, creak, creakGain);
  // Wave noise
  scheduleRandomNoise(c, m, 0.015, 'bandpass', 400);
}

// Ancient tomb — wind howl, dripping water
function startTombAmbient(c, m) {
  // Wind
  const windNoise = c.createOscillator();
  const windFilter = c.createBiquadFilter();
  const windGain = c.createGain();
  windNoise.type = 'sawtooth';
  windNoise.frequency.value = 60;
  windFilter.type = 'bandpass';
  windFilter.frequency.value = 800;
  windFilter.Q.value = 0.5;
  windGain.gain.setValueAtTime(0, c.currentTime);
  windGain.gain.linearRampToValueAtTime(0.04, c.currentTime + 5);
  windNoise.connect(windFilter); windFilter.connect(windGain); windGain.connect(m);
  windNoise.start();
  droneNodes.push(windNoise, windGain);

  // Low tomb hum
  const hum = c.createOscillator();
  const humGain = c.createGain();
  hum.type = 'sine'; hum.frequency.value = 45;
  humGain.gain.value = 0.04;
  hum.connect(humGain); humGain.connect(m);
  hum.start();
  droneNodes.push(hum, humGain);

  // Dripping
  scheduleWaterDrip(c, m);
}

// Underground lab — electrical hum, server buzz
function startLabAmbient(c, m) {
  // 60hz electrical hum
  [60, 120, 180].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine'; osc.frequency.value = freq;
    gain.gain.value = 0.03 / (i + 1);
    osc.connect(gain); gain.connect(m);
    osc.start();
    droneNodes.push(osc, gain);
  });
  // Server fan noise
  scheduleRandomNoise(c, m, 0.02, 'highpass', 2000);
}

// Space station — deep space hum, air recycler
function startSpaceAmbient(c, m) {
  [28, 42, 56].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = i === 0 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(0.04 - i * 0.008, c.currentTime + 6);
    osc.connect(gain); gain.connect(m);
    osc.start();
    droneNodes.push(osc, gain);
  });
  // Air recycler
  scheduleRandomNoise(c, m, 0.012, 'bandpass', 600);
}

// Haunted manor — distant clock, wind through cracks
function startManorAmbient(c, m) {
  [41.2, 55, 73.4].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sawtooth'; osc.frequency.value = freq;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 200;
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(0.025, c.currentTime + 4);
    osc.connect(filter); filter.connect(gain); gain.connect(m);
    osc.start();
    droneNodes.push(osc, gain);
  });
  scheduleRandomNoise(c, m, 0.01, 'bandpass', 500);
  scheduleClockTick(c, m);
}

function scheduleRandomNoise(c, m, vol, filterType, filterFreq) {
  const bufSize = c.sampleRate * 2;
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  const filter = c.createBiquadFilter();
  const gain = c.createGain();
  src.buffer = buf; src.loop = true;
  filter.type = filterType; filter.frequency.value = filterFreq;
  gain.gain.value = vol;
  src.connect(filter); filter.connect(gain); gain.connect(m);
  src.start();
  droneNodes.push(src, gain);
}

function scheduleWaterDrip(c, m) {
  function drip() {
    if (!droneRunning) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine'; osc.frequency.value = 800 + Math.random() * 400;
    gain.gain.setValueAtTime(0.08, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
    osc.connect(gain); gain.connect(m);
    osc.start(); osc.stop(c.currentTime + 0.35);
    setTimeout(drip, 2000 + Math.random() * 4000);
  }
  setTimeout(drip, 1000 + Math.random() * 2000);
}

function scheduleClockTick(c, m) {
  function tick() {
    if (!droneRunning) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine'; osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.06, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
    osc.connect(gain); gain.connect(m);
    osc.start(); osc.stop(c.currentTime + 0.08);
    setTimeout(tick, 1000);
  }
  setTimeout(tick, 500);
}

export function stopAmbient() {
  droneRunning = false;
  droneNodes.forEach(n => { try { n.stop(); } catch (_) {} });
  droneNodes = [];
}

// ── Footsteps ─────────────────────────────────────────────────
let lastFootstep = 0;

export function soundFootstep(archetype) {
  const now = performance.now();
  if (now - lastFootstep < 380) return;
  lastFootstep = now;

  const c = getCtx(); const m = getMaster();

  switch (archetype) {
    case 'victorian-library':
    case 'haunted-manor':
      woodFootstep(c, m); break;
    case 'ancient-tomb':
      stoneFootstep(c, m); break;
    case 'underground-lab':
      metalFootstep(c, m); break;
    case 'space-station':
      softFootstep(c, m); break;
    case 'ship-cabin':
      wetWoodFootstep(c, m); break;
    default:
      woodFootstep(c, m);
  }
}

function woodFootstep(c, m) {
  const buf = c.createBuffer(1, c.sampleRate * 0.12, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.2));
  }
  const src = c.createBufferSource();
  const filter = c.createBiquadFilter();
  const gain = c.createGain();
  src.buffer = buf;
  filter.type = 'bandpass'; filter.frequency.value = 300; filter.Q.value = 2;
  gain.gain.value = 0.25;
  src.connect(filter); filter.connect(gain); gain.connect(m);
  src.start();
}

function stoneFootstep(c, m) {
  const buf = c.createBuffer(1, c.sampleRate * 0.15, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
  }
  const src = c.createBufferSource();
  const filter = c.createBiquadFilter();
  const gain = c.createGain();
  src.buffer = buf;
  filter.type = 'lowpass'; filter.frequency.value = 400;
  gain.gain.value = 0.3;
  src.connect(filter); filter.connect(gain); gain.connect(m);
  src.start();
}

function metalFootstep(c, m) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'triangle'; osc.frequency.value = 200;
  osc.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.1);
  gain.gain.setValueAtTime(0.2, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
  osc.connect(gain); gain.connect(m);
  osc.start(); osc.stop(c.currentTime + 0.18);
}

function softFootstep(c, m) {
  const buf = c.createBuffer(1, c.sampleRate * 0.08, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.15));
  }
  const src = c.createBufferSource();
  const filter = c.createBiquadFilter();
  const gain = c.createGain();
  src.buffer = buf;
  filter.type = 'lowpass'; filter.frequency.value = 200;
  gain.gain.value = 0.1;
  src.connect(filter); filter.connect(gain); gain.connect(m);
  src.start();
}

function wetWoodFootstep(c, m) {
  woodFootstep(c, m);
  // Add slight splash
  setTimeout(() => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine'; osc.frequency.value = 600;
    gain.gain.setValueAtTime(0.04, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
    osc.connect(gain); gain.connect(m);
    osc.start(); osc.stop(c.currentTime + 0.1);
  }, 40);
}

// ── One-shot sounds ───────────────────────────────────────────

export function soundExamine() {
  const c = getCtx(); const m = getMaster();
  const buf = c.createBuffer(1, c.sampleRate * 0.08, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.15));
  }
  const src = c.createBufferSource();
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass'; filter.frequency.value = 400; filter.Q.value = 3;
  const g = c.createGain(); g.gain.value = 0.4;
  src.buffer = buf;
  src.connect(filter); filter.connect(g); g.connect(m);
  src.start();
}

export function soundClue() {
  const c = getCtx(); const m = getMaster();
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine'; osc.frequency.value = freq;
    g.gain.setValueAtTime(0, c.currentTime + i * 0.12);
    g.gain.linearRampToValueAtTime(0.15, c.currentTime + i * 0.12 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.12 + 0.8);
    osc.connect(g); g.connect(m);
    osc.start(c.currentTime + i * 0.12);
    osc.stop(c.currentTime + i * 0.12 + 0.9);
  });
}

export function soundPuzzleOpen() {
  const c = getCtx(); const m = getMaster();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sawtooth'; osc.frequency.value = 80;
  osc.frequency.linearRampToValueAtTime(60, c.currentTime + 0.4);
  g.gain.setValueAtTime(0.3, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5);
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 200;
  osc.connect(filter); filter.connect(g); g.connect(m);
  osc.start(); osc.stop(c.currentTime + 0.6);
}

export function soundWrong() {
  const c = getCtx(); const m = getMaster();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sine'; osc.frequency.value = 160;
  osc.frequency.linearRampToValueAtTime(60, c.currentTime + 0.2);
  g.gain.setValueAtTime(0.5, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
  osc.connect(g); g.connect(m);
  osc.start(); osc.stop(c.currentTime + 0.3);
}

export function soundCorrect() {
  const c = getCtx(); const m = getMaster();
  [392, 523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'triangle'; osc.frequency.value = freq;
    const t = c.currentTime + i * 0.09;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(g); g.connect(m);
    osc.start(t); osc.stop(t + 0.6);
  });
}

export function soundUnlocked() {
  const c = getCtx(); const m = getMaster();
  [261.63, 329.63, 392, 523.25].forEach((freq, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = i === 0 ? 'sine' : 'triangle'; osc.frequency.value = freq;
    const t = c.currentTime + i * 0.04;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    osc.connect(g); g.connect(m);
    osc.start(t); osc.stop(t + 1.4);
  });
}

export function soundTransition() {
  const c = getCtx(); const m = getMaster();
  const buf = c.createBuffer(1, c.sampleRate * 0.6, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / data.length);
  }
  const src = c.createBufferSource();
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass'; filter.frequency.value = 800;
  filter.frequency.linearRampToValueAtTime(200, c.currentTime + 0.6);
  const g = c.createGain(); g.gain.value = 0.3;
  src.buffer = buf;
  src.connect(filter); filter.connect(g); g.connect(m);
  src.start();
}

export function soundDialClick() {
  const c = getCtx(); const m = getMaster();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sine'; osc.frequency.value = 800;
  g.gain.setValueAtTime(0.15, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
  osc.connect(g); g.connect(m);
  osc.start(); osc.stop(c.currentTime + 0.08);
}

export function soundPatternPress() {
  const c = getCtx(); const m = getMaster();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'square'; osc.frequency.value = 440;
  g.gain.setValueAtTime(0.1, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 1200;
  osc.connect(filter); filter.connect(g); g.connect(m);
  osc.start(); osc.stop(c.currentTime + 0.15);
}

export function soundPickup() {
  const c = getCtx(); const m = getMaster();
  [880, 1320].forEach((freq, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine'; osc.frequency.value = freq;
    const t = c.currentTime + i * 0.08;
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g); g.connect(m);
    osc.start(t); osc.stop(t + 0.25);
  });
}
