import { soundCorrect, soundWrong, soundDialClick } from '../engine/audio.js';

export function renderSliderPuzzle(puzzle, container, onSolved) {
  const archetype = window._currentArchetype || 'victorian-library';
  const size = 3; // 3x3 grid
  const total = size * size;
  const solution = Array.from({ length: total }, (_, i) => i); // [0,1,2,3,4,5,6,7,8]
  const symbols = puzzle.sliderSymbols || ['①','②','③','④','⑤','⑥','⑦','⑧',''];

  // Start with solved state then shuffle
  let tiles = [...solution];
  shuffleTiles(tiles, size);

  let locked = false;

  container.innerHTML = `
    <button class="puzzle-close-btn" id="puzzle-close">✕</button>
    <div class="puzzle-header puzzle-header-${archetype}">
      <h2>${getIcon(archetype)} ${puzzle.name}</h2>
      <p>${puzzle.instruction || 'Slide the tiles into the correct order. Empty space is bottom-right.'}</p>
    </div>
    <div class="slider-puzzle">
      <div class="slider-clue">${puzzle.sliderClue || 'Arrange the symbols in order 1 through 8.'}</div>
      <div class="slider-grid" id="slider-grid"></div>
      <p id="slider-feedback" class="puzzle-feedback"></p>
    </div>
  `;

  const grid = container.querySelector('#slider-grid');

  function render() {
    grid.innerHTML = '';
    tiles.forEach((val, idx) => {
      const tile = document.createElement('div');
      tile.className = val === total - 1 ? 'slider-tile empty' : `slider-tile slider-tile-${archetype}`;
      tile.textContent = val === total - 1 ? '' : symbols[val];
      tile.dataset.idx = idx;
      if (val !== total - 1) {
        tile.addEventListener('click', () => tryMove(idx));
      }
      grid.appendChild(tile);
    });
  }

  function tryMove(idx) {
    if (locked) return;
    const emptyIdx = tiles.indexOf(total - 1);
    const row = Math.floor(idx / size);
    const col = idx % size;
    const emptyRow = Math.floor(emptyIdx / size);
    const emptyCol = emptyIdx % size;

    // Can only move if adjacent (not diagonal)
    const adjacent =
      (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
      (Math.abs(col - emptyCol) === 1 && row === emptyRow);

    if (!adjacent) return;

    // Swap
    [tiles[idx], tiles[emptyIdx]] = [tiles[emptyIdx], tiles[idx]];
    soundDialClick();
    render();

    if (checkSolved()) {
      locked = true;
      soundCorrect();
      grid.querySelectorAll('.slider-tile').forEach(t => t.classList.add('correct'));
      container.querySelector('#slider-feedback').textContent = 'The tiles align. Something clicks.';
      setTimeout(() => onSolved(puzzle.id), 900);
    }
  }

  function checkSolved() {
    return tiles.every((val, idx) => val === idx);
  }

  container.querySelector('#puzzle-close').addEventListener('click', () => {
    document.getElementById('modal-puzzle').classList.add('hidden');
  });

  render();
}

function shuffleTiles(tiles, size) {
  // Do 200 random valid moves from solved state to ensure solvability
  const total = tiles.length;
  let emptyIdx = total - 1;
  for (let i = 0; i < 200; i++) {
    const row = Math.floor(emptyIdx / size);
    const col = emptyIdx % size;
    const neighbors = [];
    if (row > 0) neighbors.push(emptyIdx - size);
    if (row < size - 1) neighbors.push(emptyIdx + size);
    if (col > 0) neighbors.push(emptyIdx - 1);
    if (col < size - 1) neighbors.push(emptyIdx + 1);
    const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
    [tiles[emptyIdx], tiles[pick]] = [tiles[pick], tiles[emptyIdx]];
    emptyIdx = pick;
  }
}

function getIcon(archetype) {
  const icons = {
    'ancient-tomb': '𓂀', 'underground-lab': '🔲',
    'space-station': '🛸', 'ship-cabin': '🧭',
    'haunted-manor': '👁️', 'victorian-library': '📜',
  };
  return icons[archetype] || '🔲';
}