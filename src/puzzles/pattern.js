import { soundPatternPress, soundCorrect, soundWrong } from '../engine/audio.js';

const DEFAULT_SYMBOLS = ['🌙', '⭐', '☀️', '🔥', '💧', '⚡', '🌿', '💎'];

const SKINS = {
  'victorian-library': { headerIcon: '📖', btnClass: 'pattern-btn-victorian', wrapClass: 'pattern-lock pattern-victorian' },
  'haunted-manor':     { headerIcon: '👁️', btnClass: 'pattern-btn-manor',     wrapClass: 'pattern-lock pattern-manor'     },
  'ancient-tomb':      { headerIcon: '𓂀',  btnClass: 'pattern-btn-tomb',      wrapClass: 'pattern-lock pattern-tomb'      },
  'underground-lab':   { headerIcon: '💻',  btnClass: 'pattern-btn-lab',       wrapClass: 'pattern-lock pattern-lab'       },
  'space-station':     { headerIcon: '🛸',  btnClass: 'pattern-btn-space',     wrapClass: 'pattern-lock pattern-space'     },
  'ship-cabin':        { headerIcon: '🧭',  btnClass: 'pattern-btn-ship',      wrapClass: 'pattern-lock pattern-ship'      },
};

export function renderPatternPuzzle(puzzle, container, onSolved) {
  const archetype = window._currentArchetype || 'victorian-library';
  const skin = SKINS[archetype] || SKINS['victorian-library'];
  const solution = puzzle.solution;
  const buttonCount = Math.max(...solution) + 1;
  const symbols = puzzle.patternButtons || DEFAULT_SYMBOLS.slice(0, buttonCount + 2);
  const cols = Math.ceil(Math.sqrt(symbols.length));

  let pressed = [];
  let locked = false;

  container.innerHTML = `
    <button class="puzzle-close-btn" id="puzzle-close">✕</button>
    <div class="puzzle-header puzzle-header-${archetype}">
      <h2>${skin.headerIcon} ${puzzle.name}</h2>
      <p>${puzzle.instruction || 'Press the symbols in the correct sequence.'}</p>
    </div>
    <div class="${skin.wrapClass}">
      <div class="pattern-clue pattern-clue-${archetype}">
        <em>${getClueLabel(archetype)}</em>
      </div>
      <div class="pattern-buttons pattern-buttons-${archetype}" id="pattern-grid" style="grid-template-columns: repeat(${cols}, 1fr);"></div>
      <div class="pattern-sequence pattern-sequence-${archetype}" id="pattern-seq"></div>
      <div style="display:flex;gap:10px;justify-content:center;">
        <button class="btn-secondary" id="pattern-reset">Reset</button>
        <button class="btn-primary btn-${archetype}" id="pattern-submit">Submit</button>
      </div>
      <p id="pattern-feedback" class="puzzle-feedback"></p>
    </div>
  `;

  const grid = container.querySelector('#pattern-grid');
  symbols.forEach((sym, i) => {
    const btn = document.createElement('button');
    btn.className = `pattern-btn ${skin.btnClass}`;
    btn.textContent = sym;
    btn.dataset.index = i;
    btn.addEventListener('click', () => {
      if (locked) return;
      pressed.push(i);
      btn.classList.add('pressed');
      soundPatternPress();
      updateSequenceDisplay();
      if (pressed.length === solution.length) checkPattern();
    });
    grid.appendChild(btn);
  });

  function updateSequenceDisplay() {
    const seqEl = container.querySelector('#pattern-seq');
    seqEl.innerHTML = '';
    for (let i = 0; i < solution.length; i++) {
      const dot = document.createElement('span');
      dot.className = `seq-dot seq-dot-${archetype}` + (i < pressed.length ? ' filled' : '');
      dot.textContent = i < pressed.length ? symbols[pressed[i]] : '';
      seqEl.appendChild(dot);
    }
  }

  function checkPattern() {
    locked = true;
    const correct = pressed.every((v, i) => v === solution[i]);
    if (correct) {
      soundCorrect();
      grid.querySelectorAll('.pattern-btn').forEach(b => b.classList.add('correct'));
      setTimeout(() => onSolved(puzzle.id), 800);
    } else {
      soundWrong();
      grid.querySelectorAll('.pattern-btn').forEach(b => b.classList.add('wrong'));
      container.querySelector('#pattern-feedback').textContent = getWrongMsg(archetype);
      setTimeout(() => {
        locked = false;
        pressed = [];
        grid.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('wrong', 'pressed', 'correct'));
        updateSequenceDisplay();
        container.querySelector('#pattern-feedback').textContent = '';
      }, 800);
    }
  }

  container.querySelector('#pattern-reset').addEventListener('click', () => {
    if (locked) return;
    pressed = [];
    grid.querySelectorAll('.pattern-btn').forEach(b => b.classList.remove('pressed'));
    updateSequenceDisplay();
  });

  container.querySelector('#pattern-submit').addEventListener('click', () => {
    if (locked || pressed.length === 0) return;
    checkPattern();
  });

  container.querySelector('#puzzle-close').addEventListener('click', () => {
    document.getElementById('modal-puzzle').classList.add('hidden');
  });

  updateSequenceDisplay();
}

function getClueLabel(archetype) {
  const labels = {
    'ancient-tomb':      'Read the glyphs in the order the gods demand...',
    'underground-lab':   'Enter the activation sequence from the manual...',
    'space-station':     'Match the stellar alignment pattern...',
    'ship-cabin':        "Follow the navigator's signal sequence...",
    'haunted-manor':     'The spirit taps out a pattern in the dark...',
    'victorian-library': 'The cipher speaks in symbols. Listen carefully...',
  };
  return labels[archetype] || 'Press the symbols in the correct sequence...';
}

function getWrongMsg(archetype) {
  const msgs = {
    'ancient-tomb':      'The chamber shudders. Wrong sequence.',
    'underground-lab':   'SEQUENCE ERROR. Resetting.',
    'space-station':     'Pattern mismatch. Try again.',
    'ship-cabin':        'The signal fades. Wrong order.',
    'haunted-manor':     'A cold wind snuffs the candles. Wrong.',
    'victorian-library': 'The symbols resist your reading.',
  };
  return msgs[archetype] || 'Wrong sequence. Try again.';
}