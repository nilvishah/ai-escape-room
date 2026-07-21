import { state, solvePuzzle } from '../engine/state.js';
import { renderComboPuzzle }   from '../puzzles/lock.js';
import { renderPatternPuzzle } from '../puzzles/pattern.js';
import { renderCipherPuzzle }  from '../puzzles/cipher.js';
import { renderKeyLockPuzzle } from '../puzzles/keylock.js';
import { renderSliderPuzzle }  from '../puzzles/slider.js';
import { renderWiresPuzzle }   from '../puzzles/wires.js';
import { renderMemoryPuzzle }  from '../puzzles/memory.js';
import { renderRotaryPuzzle }  from '../puzzles/rotary.js';
import { soundUnlocked } from '../engine/audio.js';
import { renderPuzzleChain, updateExitButton, setHint, showToast } from './hud.js';
import { playObjectSolvedAnimation } from '../engine/animator.js';

let onExitCallback = null;

export function initPuzzleModal(onExit) {
  onExitCallback = onExit;
  document.querySelector('#modal-puzzle .modal-backdrop').addEventListener('click', () => {
    document.getElementById('modal-puzzle').classList.add('hidden');
  });
}

export function openPuzzle(puzzleId) {
  const puzzle = state.room?.puzzles.find(p => p.id === puzzleId);
  if (!puzzle) return;

  state.activePuzzleId = puzzleId;

  const modal = document.getElementById('modal-puzzle');
  const panel = document.getElementById('puzzle-panel-inner');
  panel.innerHTML = '';
  modal.classList.remove('hidden');

  function onSolved(id) {
    const allSolved = solvePuzzle(id);
    modal.classList.add('hidden');
    soundUnlocked();

    const solvedPuzzle = state.room.puzzles.find(p => p.id === id);
    if (solvedPuzzle?.hostObjectId) {
      playObjectSolvedAnimation(solvedPuzzle.hostObjectId);
    }

    const unlockedObjId = solvedPuzzle?.unlocks;
    const unlockedObj   = state.room.objects.find(o => o.id === unlockedObjId);
    if (unlockedObj) {
      setHint(`Unlocked: ${unlockedObj.emoji} ${unlockedObj.name}`);
      showToast(`🔓 Unlocked: ${unlockedObj.name}`, 'success');
    }

    renderPuzzleChain();
    updateExitButton();

    if (allSolved) {
      setHint('All puzzles solved! The exit is open!');
      showToast('🚪 EXIT IS NOW OPEN!', 'success');
    }

    state.activePuzzleId = null;
  }

  switch (puzzle.type) {
    case 'combo':   renderComboPuzzle(puzzle, panel, onSolved);   break;
    case 'pattern': renderPatternPuzzle(puzzle, panel, onSolved); break;
    case 'cipher':  renderCipherPuzzle(puzzle, panel, onSolved);  break;
    case 'keylock': renderKeyLockPuzzle(puzzle, panel, onSolved); break;
    case 'slider':  renderSliderPuzzle(puzzle, panel, onSolved);  break;
    case 'wires':   renderWiresPuzzle(puzzle, panel, onSolved);   break;
    case 'memory':  renderMemoryPuzzle(puzzle, panel, onSolved);  break;
    case 'rotary':  renderRotaryPuzzle(puzzle, panel, onSolved);  break;
    default:        renderComboPuzzle(puzzle, panel, onSolved);
  }
}