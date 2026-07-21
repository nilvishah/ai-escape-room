import { state, isObjectAccessible, canAttemptPuzzle, addToInventory } from '../engine/state.js';
import { soundExamine, soundClue, soundPickup, soundPuzzleOpen } from '../engine/audio.js';
import { addClueToLog, updateInventoryHUD, setHint, renderPuzzleChain } from './hud.js';
import { openPuzzle } from './puzzle.js';
import { zoomToWorldPos, zoomBack } from '../engine/camera.js';
import { getObjectWorldPos } from '../engine/scene.js';
import { playItemPickupAnimation } from '../engine/animator.js';

export function examineObject(objectId) {
  if (!state.room) return;
  const obj = state.room.objects.find(o => o.id === objectId);
  if (!obj) return;

  // If locked — just show hint, no zoom
  if (!isObjectAccessible(objectId)) {
    const blockingPuzzle = state.room.puzzles.find(p => p.id === obj.requiredPuzzle);
    setHint(`${obj.name} is locked. Solve "${blockingPuzzle?.name || 'another puzzle'}" first.`);
    showLockedNotice(obj, blockingPuzzle);
    return;
  }

  soundExamine();
  state.examinedObjects.add(objectId);

  // Zoom camera toward object first, then show modal
  const worldPos = getObjectWorldPos(objectId);
  if (worldPos) {
    zoomToWorldPos(worldPos, () => showExamineModal(obj));
  } else {
    showExamineModal(obj);
  }
}

function showExamineModal(obj) {
  const modal = document.getElementById('modal-examine');
  modal.classList.remove('hidden');
  // Small delay so the zoom lands before modal fades in
  requestAnimationFrame(() => modal.classList.add('arrived'));

  document.getElementById('examine-emoji').textContent = obj.emoji;
  document.getElementById('examine-name').textContent  = obj.name;
  document.getElementById('examine-desc').textContent  = obj.description;

  // Reset sections
  ['examine-clue', 'examine-item', 'examine-puzzle', 'examine-locked'].forEach(id =>
    document.getElementById(id).classList.add('hidden')
  );

  // Clue
  if (obj.clue) {
    document.getElementById('examine-clue').classList.remove('hidden');
    document.getElementById('examine-clue-text').textContent = obj.clue;
    if (!state.collectedClues.includes(obj.id)) {
      state.collectedClues.push(obj.id);
      addClueToLog(obj.clue, obj.name);
      soundClue();
    }
  }

  // Item
  if (obj.containsItem) {
    const item     = state.room.items.find(i => i.id === obj.containsItem);
    const haveIt   = state.inventory.includes(obj.containsItem);
    if (item && !haveIt) {
      document.getElementById('examine-item').classList.remove('hidden');
      document.getElementById('examine-item-text').textContent =
        `Found: ${item.emoji} ${item.name} — ${item.description}`;
      document.getElementById('btn-take-item').onclick = () => {
        addToInventory(obj.containsItem);
        updateInventoryHUD();
        soundPickup();
        playItemPickupAnimation(obj.id);
        document.getElementById('examine-item').classList.add('hidden');
        setHint(`Picked up: ${item.emoji} ${item.name}`);
      };
    }
  }

  // Puzzle
  if (obj.puzzleId) {
    const solved     = state.solvedPuzzles.has(obj.puzzleId);
    const canAttempt = canAttemptPuzzle(obj.puzzleId);

    if (solved) {
      document.getElementById('examine-desc').textContent = obj.description + ' ✓ Solved';
    } else if (canAttempt) {
      document.getElementById('examine-puzzle').classList.remove('hidden');
      document.getElementById('btn-attempt-puzzle').onclick = () => {
        closeExamineModal();
        soundPuzzleOpen();
        openPuzzle(obj.puzzleId);
      };
    } else {
      const puzzle = state.room.puzzles.find(p => p.id === obj.puzzleId);
      if (puzzle?.requiredItem) {
        const item = state.room.items.find(i => i.id === puzzle.requiredItem);
        document.getElementById('examine-locked').classList.remove('hidden');
        document.getElementById('examine-locked-text').textContent =
          `You need ${item?.emoji || '?'} ${item?.name || 'an item'} to interact with this.`;
      }
    }
  }

  renderPuzzleChain();
}

function showLockedNotice(obj, blockingPuzzle) {
  const modal = document.getElementById('modal-examine');
  modal.classList.remove('hidden');
  document.getElementById('examine-emoji').textContent = '🔒';
  document.getElementById('examine-name').textContent  = obj.name;
  document.getElementById('examine-desc').textContent  = obj.lockedDescription || obj.description;
  ['examine-clue', 'examine-item', 'examine-puzzle'].forEach(id =>
    document.getElementById(id).classList.add('hidden')
  );
  document.getElementById('examine-locked').classList.remove('hidden');
  document.getElementById('examine-locked-text').textContent =
    `Locked. Solve "${blockingPuzzle?.name || 'another puzzle'}" first.`;
}

export function closeExamineModal() {
  const modal = document.getElementById('modal-examine');
  modal.classList.remove('arrived');
  modal.classList.add('hidden');
  zoomBack(); // ease camera back to where it was
}

export function initExamineModal() {
  document.getElementById('examine-close').addEventListener('click', closeExamineModal);
  document.querySelector('#modal-examine .modal-backdrop').addEventListener('click', closeExamineModal);
}
