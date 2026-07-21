import { soundCorrect, soundWrong, soundPatternPress, soundClue } from '../engine/audio.js';

export function renderMemoryPuzzle(puzzle, container, onSolved) {
  const archetype = window._currentArchetype || 'victorian-library';

  const allSymbols = puzzle.memorySymbols || ['🔑','🗝️','📜','⚗️','🕯️','💎','🔮','⚔️'];
  const pairCount  = puzzle.memoryPairs   || 4;
  const symbols    = allSymbols.slice(0, pairCount);

  // Build shuffled card deck
  let cards = [...symbols, ...symbols].map((sym, i) => ({
    id: i, sym, flipped: false, matched: false,
  }));
  cards = shuffleArray(cards);

  let flipped    = []; // currently face-up unmatched cards
  let matchCount = 0;
  let locked     = false;

  container.innerHTML = `
    <button class="puzzle-close-btn" id="puzzle-close">✕</button>
    <div class="puzzle-header puzzle-header-${archetype}">
      <h2>${getIcon(archetype)} ${puzzle.name}</h2>
      <p>${puzzle.instruction || 'Flip cards to find matching pairs. Remember what you saw.'}</p>
    </div>
    <div class="memory-puzzle">
      <div class="memory-clue">${puzzle.memoryClue || `Find all ${pairCount} matching pairs.`}</div>
      <div class="memory-grid" id="memory-grid" style="grid-template-columns: repeat(4, 1fr);"></div>
      <div class="memory-stats">
        <span id="memory-matches">Matches: 0 / ${pairCount}</span>
      </div>
      <p id="memory-feedback" class="puzzle-feedback"></p>
    </div>
  `;

  const grid = container.querySelector('#memory-grid');

  function render() {
    grid.innerHTML = '';
    cards.forEach((card, idx) => {
      const el = document.createElement('div');
      el.className = `memory-card memory-card-${archetype}` +
        (card.flipped || card.matched ? ' flipped' : '') +
        (card.matched ? ' matched' : '');
      el.dataset.idx = idx;
      el.innerHTML = `
        <div class="memory-card-inner">
          <div class="memory-card-back">${getCardBack(archetype)}</div>
          <div class="memory-card-front">${card.sym}</div>
        </div>
      `;
      if (!card.matched) {
        el.addEventListener('click', () => flipCard(idx));
      }
      grid.appendChild(el);
    });
    container.querySelector('#memory-matches').textContent =
      `Matches: ${matchCount} / ${pairCount}`;
  }

  function flipCard(idx) {
    if (locked) return;
    const card = cards[idx];
    if (card.flipped || card.matched) return;
    if (flipped.length >= 2) return;

    card.flipped = true;
    flipped.push(idx);
    soundPatternPress();
    render();

    if (flipped.length === 2) {
      locked = true;
      const [a, b] = flipped;
      setTimeout(() => {
        if (cards[a].sym === cards[b].sym) {
          // Match
          cards[a].matched = true;
          cards[b].matched = true;
          matchCount++;
          soundClue();
          flipped = [];
          locked  = false;
          render();

          if (matchCount === pairCount) {
            locked = true;
            soundCorrect();
            container.querySelector('#memory-feedback').style.color = 'var(--success)';
            container.querySelector('#memory-feedback').textContent = 'All pairs found.';
            setTimeout(() => onSolved(puzzle.id), 900);
          }
        } else {
          // No match
          soundWrong();
          cards[a].flipped = false;
          cards[b].flipped = false;
          flipped = [];
          locked  = false;
          render();
        }
      }, 900);
    }
  }

  container.querySelector('#puzzle-close').addEventListener('click', () => {
    document.getElementById('modal-puzzle').classList.add('hidden');
  });

  render();
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getIcon(archetype) {
  const icons = {
    'ancient-tomb': '𓂀', 'underground-lab': '🧬',
    'space-station': '🛸', 'ship-cabin': '🗺️',
    'haunted-manor': '👁️', 'victorian-library': '📖',
  };
  return icons[archetype] || '🃏';
}

function getCardBack(archetype) {
  const backs = {
    'ancient-tomb': '𓀀', 'underground-lab': '?',
    'space-station': '✦', 'ship-cabin': '⚓',
    'haunted-manor': '💀', 'victorian-library': '?',
  };
  return backs[archetype] || '?';
}