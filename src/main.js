// import './style.css';
// import { initScene, populateRoom, raycast, setHoveredObject, setThemeColors } from './engine/scene.js';
// import { initCamera } from './engine/camera.js';
// import { startAmbient, stopAmbient, soundTransition } from './engine/audio.js';
// import { state, resetRoomState } from './engine/state.js';
// import { generateRoom } from './ai/generator.js';
// import { initExamineModal, examineObject } from './ui/examine.js';
// import { initPuzzleModal } from './ui/puzzle.js';
// import { setRoomInfo, renderPuzzleChain, updateExitButton, setHint, updateInventoryHUD } from './ui/hud.js';
// import { initScreens, showScreen, setGenTheme, setGenStep, initGenSteps } from './ui/screens.js';

// // ── Boot ────────────────────────────────────────────────────────
// initScreens();
// initGenSteps();
// showScreen('start');

// setTimeout(() => {
//   document.getElementById('screen-start').classList.add('visible');
// }, 50);

// // ── Start button ────────────────────────────────────────────────
// document.getElementById('btn-start').addEventListener('click', async () => {
//   const keyInput = document.getElementById('groq-key');
//   const key = keyInput.value.trim();
//   if (!key) {
//     keyInput.style.borderColor = 'var(--danger)';
//     keyInput.placeholder = 'API key required!';
//     return;
//   }
//   state.groqKey = key;
//   await startNewRoom();
// });

// document.getElementById('groq-key').addEventListener('keydown', (e) => {
//   if (e.key === 'Enter') document.getElementById('btn-start').click();
// });

// // ── Room flow ────────────────────────────────────────────────────
// async function startNewRoom() {
//   soundTransition();
//   showScreen('generate');

//   try {
//     let blueprint;
//     blueprint = await generateRoom(state.roomNumber, (step, label) => {
//       setGenStep(step, label);
//       if (step === 0 && blueprint?.theme) setGenTheme(blueprint.theme);
//     });

//     if (blueprint?.theme) setGenTheme(blueprint.theme);
//     if (blueprint?.name) setGenTheme(blueprint.name);

//     await loadRoom(blueprint);
//   } catch (err) {
//     console.error('Generation failed:', err);
//     showScreen('start');
//     alert('Room generation failed: ' + err.message + '\n\nCheck your Groq API key and try again.');
//   }
// }

// async function loadRoom(blueprint) {
//   resetRoomState();
//   state.room = blueprint;

//   if (blueprint.themeColors) {
//     const colors = {};
//     const hexToInt = h => parseInt(h.replace('#', ''), 16);
//     Object.entries(blueprint.themeColors).forEach(([k, v]) => {
//       colors[k] = hexToInt(v);
//     });
//     setThemeColors(colors);
//   }

//   const canvas = document.getElementById('game-canvas');
//   if (!canvas._initialized) {
//     canvas._initialized = true;
//     initScene(canvas);
//     initCamera(canvas, handleClick, handleHover);
//     initExamineModal();
//     initPuzzleModal();
//   }

//   populateRoom(blueprint);

//   setRoomInfo(state.roomNumber, blueprint.name);
//   renderPuzzleChain();
//   updateExitButton();
//   updateInventoryHUD();
//   setHint('Look around. Click objects to examine them.');

//   document.getElementById('btn-exit').onclick = () => {
//     if (state.exitOpen) goToVictory();
//   };

//   showScreen('game');
//   startAmbient();

//   setTimeout(() => {
//     document.getElementById('look-hint')?.classList.add('hidden');
//   }, 5000);
// }

// // ── Interaction ──────────────────────────────────────────────────
// function handleClick(mouseX, mouseY) {
//   const objectId = raycast(mouseX, mouseY);
//   if (objectId) examineObject(objectId);
// }

// let lastHovered = null;
// function handleHover(mouseX, mouseY) {
//   const objectId = raycast(mouseX, mouseY);
//   if (objectId !== lastHovered) {
//     lastHovered = objectId;
//     setHoveredObject(objectId);
//     const crosshair = document.getElementById('crosshair');
//     if (crosshair) crosshair.classList.toggle('hover', !!objectId);
//     if (objectId) {
//       const obj = state.room?.objects.find(o => o.id === objectId);
//       if (obj) setHint('Click to examine: ' + obj.emoji + ' ' + obj.name);
//     } else {
//       setHint('Look around. Click objects to examine them.');
//     }
//   }
// }

// // ── Victory ───────────────────────────────────────────────────────
// function goToVictory() {
//   stopAmbient();
//   const desc = document.getElementById('victory-desc');
//   if (desc) {
//     desc.textContent = 'You solved ' + state.room.puzzles.length + ' puzzles and escaped from "' + state.room.name + '".';
//   }
//   showScreen('victory');
// }

// document.getElementById('btn-next-room').addEventListener('click', () => {
//   state.roomNumber++;
//   startNewRoom();
// });



import './style.css';
import { initScene, populateRoom, raycast, setHoveredObject, setThemeColors } from './engine/scene.js';
import { initCamera } from './engine/camera.js';
import { startAmbient, stopAmbient, soundTransition } from './engine/audio.js';
import { state, resetRoomState } from './engine/state.js';
import { generateRoom } from './ai/generator.js';
import { initExamineModal, examineObject } from './ui/examine.js';
import { initPuzzleModal } from './ui/puzzle.js';
import { setRoomInfo, renderPuzzleChain, updateExitButton, setHint, updateInventoryHUD } from './ui/hud.js';
import { initScreens, showScreen, setGenTheme, setGenStep, initGenSteps } from './ui/screens.js';

// ── Test blueprint (no API needed) ──────────────────────────────
const TEST_BLUEPRINT = {
  id: 'room_1',
  name: 'The Obsidian Vault',
  theme: 'Victorian occult laboratory',
  archetype: 'victorian-library',
  atmosphere: 'The air smells of sulfur and old parchment.',
  themeColors: { ambient:'#8866aa', wall:'#3d2e1e', floor:'#2a1e10', ceiling:'#2e2418', fog:'#1a1208', accent:'#c87a20' },
  objects: [
  { id:'bookshelf', name:'Old Bookshelf',  emoji:'📚', zone:'back-left',   floorObject:true,  description:'Tall shelves packed with tomes. One book is pulled outward.', lockedDescription:'Dusty.', clue:'A torn page reads: The year the comet struck — 1847', containsItem:null, puzzleId:null, requiredPuzzle:null, color:'#2a1a08' },
  { id:'iron_safe', name:'Iron Safe',      emoji:'🔒', zone:'back-right',  floorObject:true,  description:'A heavy safe with four numbered dials.', lockedDescription:'A heavy locked safe.', clue:null, containsItem:'brass_key', puzzleId:'puzzle_combo', requiredPuzzle:null, color:'#1a1a1a' },
  { id:'chest',     name:'Locked Chest',   emoji:'📦', zone:'floor-right', floorObject:true,  description:'A wooden chest with a brass keyhole.', lockedDescription:'Locked tight. You need a key.', clue:null, containsItem:null, puzzleId:'puzzle_memory', requiredPuzzle:'puzzle_combo', color:'#2a1a08' },
  { id:'chest2', name:'Ancient Chest', emoji:'📦', zone:'right-wall', floorObject:true, description:'A chest with sliding tiles on the lid.', lockedDescription:'Locked.', clue:null, containsItem:null, puzzleId:'puzzle_slider', requiredPuzzle:null, color:'#4a2f0f' },
  { id:'desk',      name:'Writing Desk',   emoji:'🪑', zone:'floor-left',  floorObject:true,  description:'A desk with a circuit panel built into the surface.', lockedDescription:'Locked.', clue:'The desk has three terminals: ⚡ Alpha, 🔥 Gamma, 💧 Beta', containsItem:null, puzzleId:'puzzle_wires', requiredPuzzle:null, color:'#3a2010' },
  { id:'painting',  name:'Dark Portrait',  emoji:'🖼️', zone:'left-wall',   floorObject:false, description:'A portrait. The frame reads: ③ → ⑥ → ②', lockedDescription:'A painting.', clue:'The frame reads: ③ → ⑥ → ②', containsItem:null, puzzleId:'puzzle_rotary', requiredPuzzle:null, color:'#1a0a05' },
  { id:'bookshelf2',name:'Old Bookshelf',  emoji:'📚', zone:'back-left',   floorObject:true,  description:'More shelves. A note is tucked between books.', lockedDescription:'Dusty.', clue:'The note says: Match the elements — ⚡ connects to Alpha', containsItem:null, puzzleId:null, requiredPuzzle:null, color:'#2a1a08' },
  ],
  items: [
    { id:'brass_key', name:'Brass Key', emoji:'🗝️', description:'An ornate key with a lions head.' },
  ],
  puzzles: [
  { id:'puzzle_combo',  type:'combo',  name:'Iron Safe',     hostObjectId:'iron_safe', solution:'1847',  clueObjectId:'bookshelf', unlocks:'chest',   instruction:'Turn the dials to the correct year.', requiredItem:null },
  { id:'puzzle_memory', type:'memory', name:'Locked Chest',  hostObjectId:'chest',     solution:null,    clueObjectId:'painting',  unlocks:null,      instruction:'Flip cards to find all matching pairs.', memorySymbols:['🔑','📜','⚗️','💎'], memoryPairs:4, memoryClue:'Find all 4 matching pairs.' },
  { id:'puzzle_slider', type:'slider', name:'Ancient Chest', hostObjectId:'chest2',    solution:null,    clueObjectId:'painting',  unlocks:null,      instruction:'Slide the tiles into the correct order.', sliderSymbols:['①','②','③','④','⑤','⑥','⑦','⑧'], sliderClue:'Arrange 1 through 8. Empty space bottom-right.' },
  { id:'puzzle_wires',  type:'wires',  name:'Circuit Box',   hostObjectId:'desk',      solution:null,    clueObjectId:'bookshelf2',unlocks:null,      instruction:'Connect each terminal to its match.', wireSolution:[[0,1],[1,2],[2,0]], wireLeftLabels:['⚡','🔥','💧'], wireRightLabels:['Alpha','Beta','Gamma'], wireClue:'Match the elements to their vessels.' },
  { id:'puzzle_rotary', type:'rotary', name:'Dark Portrait',  hostObjectId:'painting',  solution:null,    clueObjectId:'desk',      unlocks:null,      instruction:'Spin the dial to each symbol in sequence.', rotarySymbols:['①','②','③','④','⑤','⑥','⑦','⑧'], rotarySolution:[2,5,1], rotaryClue:'The frame shows: ③ → ⑥ → ②' },
],
exitRequires: ['puzzle_combo','puzzle_memory','puzzle_slider','puzzle_wires','puzzle_rotary'],
};

// ── Boot ────────────────────────────────────────────────────────
initScreens();
initGenSteps();
showScreen('start');

setTimeout(() => {
  document.getElementById('screen-start').classList.add('visible');
}, 50);

// ── Dev: skip API, load test room instantly ─────────────────────
// Open browser console and type: testRoom()
window.testRoom = function () {
  state.groqKey = 'test';
  loadRoom(TEST_BLUEPRINT);
};

// ── Start button ────────────────────────────────────────────────
document.getElementById('btn-start').addEventListener('click', async () => {
  const keyInput = document.getElementById('groq-key');
  const key = keyInput.value.trim();
  if (!key) {
    keyInput.style.borderColor = 'var(--danger)';
    keyInput.placeholder = 'API key required!';
    return;
  }
  state.groqKey = key;
  await startNewRoom();
});

document.getElementById('groq-key').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-start').click();
});

// ── Room flow ───────────────────────────────────────────────────
async function startNewRoom() {
  soundTransition();
  showScreen('generate');

  try {
    let blueprint;
    blueprint = await generateRoom(state.roomNumber, (step, label) => {
      setGenStep(step, label);
      if (step === 0 && blueprint?.theme) setGenTheme(blueprint.theme);
    });

    if (blueprint?.theme) setGenTheme(blueprint.theme);
    if (blueprint?.name)  setGenTheme(blueprint.name);

    await loadRoom(blueprint);
  } catch (err) {
    console.error('Generation failed:', err);
    showScreen('start');
    alert('Room generation failed: ' + err.message + '\n\nCheck your Groq API key and try again.');
  }
}

async function loadRoom(blueprint) {
  resetRoomState();
  state.room = blueprint;

  if (blueprint.themeColors) {
    const colors = {};
    const hexToInt = h => parseInt(h.replace('#', ''), 16);
    Object.entries(blueprint.themeColors).forEach(([k, v]) => {
      colors[k] = hexToInt(v);
    });
    setThemeColors(colors);
  }

  const canvas = document.getElementById('game-canvas');
  if (!canvas._initialized) {
    canvas._initialized = true;
    initScene(canvas);
    initCamera(canvas, handleClick, handleHover);
    initExamineModal();
    initPuzzleModal();
  }

  populateRoom(blueprint);

  setRoomInfo(state.roomNumber, blueprint.name);
  renderPuzzleChain();
  updateExitButton();
  updateInventoryHUD();
  setHint('Look around. Click objects to examine them. Use WASD to walk.');

  document.getElementById('btn-exit').onclick = () => {
    if (state.exitOpen) goToVictory();
  };

  showScreen('game');
  startAmbient();

  setTimeout(() => {
    document.getElementById('look-hint')?.classList.add('hidden');
  }, 5000);
}

// ── Interaction ─────────────────────────────────────────────────
function handleClick(mouseX, mouseY) {
  const objectId = raycast(mouseX, mouseY);
  if (objectId) examineObject(objectId);
}

let lastHovered = null;
function handleHover(mouseX, mouseY) {
  const objectId = raycast(mouseX, mouseY);
  if (objectId !== lastHovered) {
    lastHovered = objectId;
    setHoveredObject(objectId);
    const crosshair = document.getElementById('crosshair');
    if (crosshair) crosshair.classList.toggle('hover', !!objectId);
    if (objectId) {
      const obj = state.room?.objects.find(o => o.id === objectId);
      if (obj) setHint('Click to examine: ' + obj.emoji + ' ' + obj.name);
    } else {
      setHint('Look around. Click objects to examine them. Use WASD to walk.');
    }
  }
}

// ── Victory ─────────────────────────────────────────────────────
function goToVictory() {
  stopAmbient();
  const desc = document.getElementById('victory-desc');
  if (desc) {
    desc.textContent = 'You solved ' + state.room.puzzles.length + ' puzzles and escaped from "' + state.room.name + '".';
  }
  showScreen('victory');
}

document.getElementById('btn-next-room').addEventListener('click', () => {
  state.roomNumber++;
  startNewRoom();
});