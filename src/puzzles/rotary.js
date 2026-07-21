import { soundDialClick, soundCorrect, soundWrong } from '../engine/audio.js';

export function renderRotaryPuzzle(puzzle, container, onSolved) {
  const archetype = window._currentArchetype || 'victorian-library';

  // solution: array of symbol indices to hit in sequence e.g. [3, 7, 1]
  const symbols  = puzzle.rotarySymbols  || ['①','②','③','④','⑤','⑥','⑦','⑧'];
  const solution = puzzle.rotarySolution || [2, 5, 1];

  let currentAngle = 0; // in segments
  let step         = 0; // which solution index we're on
  let locked       = false;
  const segCount   = symbols.length;
  const segAngle   = 360 / segCount;

  container.innerHTML = `
    <button class="puzzle-close-btn" id="puzzle-close">✕</button>
    <div class="puzzle-header puzzle-header-${archetype}">
      <h2>${getIcon(archetype)} ${puzzle.name}</h2>
      <p>${puzzle.instruction || 'Rotate the dial to each symbol in the correct sequence.'}</p>
    </div>
    <div class="rotary-puzzle">
      <div class="rotary-clue">${puzzle.rotaryClue || 'Find the sequence in your clues.'}</div>
      <div class="rotary-container">
        <div class="rotary-pointer">▼</div>
        <div class="rotary-dial" id="rotary-dial"></div>
      </div>
      <div class="rotary-sequence" id="rotary-seq"></div>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:16px;">
        <button class="btn-secondary" id="rotary-left">◀ Left</button>
        <button class="btn-primary btn-${archetype}" id="rotary-confirm">Confirm</button>
        <button class="btn-secondary" id="rotary-right">Right ▶</button>
      </div>
      <p id="rotary-feedback" class="puzzle-feedback"></p>
    </div>
  `;

  const dial    = container.querySelector('#rotary-dial');
  const seqEl   = container.querySelector('#rotary-seq');
  const feedback = container.querySelector('#rotary-feedback');

  function render() {
    // Render dial segments
    dial.innerHTML = '';
    for (let i = 0; i < segCount; i++) {
      const seg = document.createElement('div');
      seg.className = 'rotary-segment';
      const angle = (i * segAngle) - (currentAngle * segAngle);
      seg.style.transform = `rotate(${angle}deg) translateY(-80px)`;
      seg.textContent = symbols[i];
      // Highlight the one at top (index 0 after rotation)
      const normalised = ((i - currentAngle) % segCount + segCount) % segCount;
      if (normalised === 0) seg.classList.add('active');
      dial.appendChild(seg);
    }

    // Render sequence progress
    seqEl.innerHTML = '';
    for (let i = 0; i < solution.length; i++) {
      const dot = document.createElement('span');
      dot.className = 'seq-dot' + (i < step ? ' filled' : '');
      dot.textContent = i < step ? symbols[solution[i]] : '';
      seqEl.appendChild(dot);
    }
  }

  container.querySelector('#rotary-left').addEventListener('click', () => {
    if (locked) return;
    currentAngle = (currentAngle - 1 + segCount) % segCount;
    soundDialClick();
    render();
  });

  container.querySelector('#rotary-right').addEventListener('click', () => {
    if (locked) return;
    currentAngle = (currentAngle + 1) % segCount;
    soundDialClick();
    render();
  });

  container.querySelector('#rotary-confirm').addEventListener('click', () => {
    if (locked) return;
    const current = ((currentAngle % segCount) + segCount) % segCount;
    if (current === solution[step]) {
      step++;
      soundDialClick();
      feedback.style.color = 'var(--success)';
      feedback.textContent = `✓ Symbol ${step} of ${solution.length} confirmed`;
      render();
      if (step === solution.length) {
        locked = true;
        soundCorrect();
        feedback.textContent = 'The dial clicks into place.';
        setTimeout(() => onSolved(puzzle.id), 900);
      }
    } else {
      soundWrong();
      step = 0;
      feedback.style.color = 'var(--danger)';
      feedback.textContent = getWrongMsg(archetype);
      render();
      setTimeout(() => {
        feedback.textContent = '';
        feedback.style.color = '';
      }, 1000);
    }
  });

  // Mouse wheel support
  dial.addEventListener('wheel', (e) => {
    if (locked) return;
    e.preventDefault();
    currentAngle = e.deltaY > 0
      ? (currentAngle + 1) % segCount
      : (currentAngle - 1 + segCount) % segCount;
    soundDialClick();
    render();
  }, { passive: false });

  container.querySelector('#puzzle-close').addEventListener('click', () => {
    document.getElementById('modal-puzzle').classList.add('hidden');
  });

  render();
}

function getIcon(archetype) {
  const icons = {
    'ancient-tomb': '𓋹', 'underground-lab': '🔘',
    'space-station': '🌀', 'ship-cabin': '🧭',
    'haunted-manor': '🕰️', 'victorian-library': '⚙️',
  };
  return icons[archetype] || '🔘';
}

function getWrongMsg(archetype) {
  const msgs = {
    'ancient-tomb':      'Wrong symbol. The sequence resets.',
    'underground-lab':   'INVALID INPUT. Sequence reset.',
    'space-station':     'Alignment lost. Starting over.',
    'ship-cabin':        'Off course. Try the sequence again.',
    'haunted-manor':     'The dial spins back. Wrong symbol.',
    'victorian-library': 'The mechanism rejects it. Start again.',
  };
  return msgs[archetype] || 'Wrong. Sequence reset.';
}