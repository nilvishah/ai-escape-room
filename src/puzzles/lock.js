import { soundDialClick, soundCorrect, soundWrong } from '../engine/audio.js';

const SKINS = {
  'victorian-library': { submitLabel: 'Turn the Lock',   headerIcon: '🔐', dialClass: 'dial-victorian', wrapClass: 'combo-lock combo-victorian' },
  'haunted-manor':     { submitLabel: 'Turn the Lock',   headerIcon: '🕯️', dialClass: 'dial-manor',     wrapClass: 'combo-lock combo-manor'     },
  'ancient-tomb':      { submitLabel: 'Align the Rings', headerIcon: '𓋹',  dialClass: 'dial-tomb',      wrapClass: 'combo-lock combo-tomb'      },
  'underground-lab':   { submitLabel: 'Enter Code',      headerIcon: '🔬', dialClass: 'dial-lab',       wrapClass: 'combo-lock combo-lab'       },
  'space-station':     { submitLabel: 'Confirm Code',    headerIcon: '🛸', dialClass: 'dial-space',     wrapClass: 'combo-lock combo-space'     },
  'ship-cabin':        { submitLabel: 'Set the Dials',   headerIcon: '🧭', dialClass: 'dial-ship',      wrapClass: 'combo-lock combo-ship'      },
};

export function renderComboPuzzle(puzzle, container, onSolved) {
  const archetype = window._currentArchetype || 'victorian-library';
  const skin = SKINS[archetype] || SKINS['victorian-library'];
  const current = [0, 0, 0, 0];

  container.innerHTML = `
    <button class="puzzle-close-btn" id="puzzle-close">✕</button>
    <div class="puzzle-header puzzle-header-${archetype}">
      <h2>${skin.headerIcon} ${puzzle.name}</h2>
      <p>${puzzle.instruction || 'Set the four dials to the correct combination.'}</p>
    </div>
    <div class="${skin.wrapClass}">
      <div class="combo-dials combo-dials-${archetype}" id="combo-dials"></div>
      <button class="btn-primary btn-${archetype}" id="combo-submit">${skin.submitLabel}</button>
      <p id="combo-feedback" class="puzzle-feedback"></p>
    </div>
  `;

  const dialsEl = container.querySelector('#combo-dials');

  for (let i = 0; i < 4; i++) {
    const dialEl = document.createElement('div');
    dialEl.className = `dial ${skin.dialClass}`;
    dialEl.innerHTML = `
      <button class="dial-btn dial-up" data-dir="up" data-index="${i}">▲</button>
      <div class="dial-display dial-display-${archetype}" id="dial-${i}" data-index="${i}">0</div>
      <button class="dial-btn dial-down" data-dir="down" data-index="${i}">▼</button>
    `;
    dialsEl.appendChild(dialEl);

    const display = dialEl.querySelector(`#dial-${i}`);
    let dragStartY = 0, dragStartVal = 0;

    display.addEventListener('mousedown', (e) => {
      dragStartY = e.clientY;
      dragStartVal = current[i];
      const onMove = (em) => {
        const delta = Math.round((dragStartY - em.clientY) / 20);
        const newVal = ((dragStartVal + delta) % 10 + 10) % 10;
        if (newVal !== current[i]) {
          current[i] = newVal;
          display.textContent = newVal;
          soundDialClick();
        }
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  dialsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.dial-btn');
    if (!btn) return;
    const i = parseInt(btn.dataset.index);
    const dir = btn.dataset.dir;
    current[i] = dir === 'up' ? (current[i] + 1) % 10 : (current[i] + 9) % 10;
    container.querySelector(`#dial-${i}`).textContent = current[i];
    soundDialClick();
  });

  container.querySelector('#combo-submit').addEventListener('click', () => {
    const attempt = current.join('');
    if (attempt === puzzle.solution) {
      soundCorrect();
      for (let i = 0; i < 4; i++) container.querySelector(`#dial-${i}`).classList.add('correct');
      setTimeout(() => onSolved(puzzle.id), 800);
    } else {
      soundWrong();
      container.querySelector('#combo-feedback').textContent = getWrongMsg(archetype);
      container.querySelectorAll('.dial-display').forEach(d => {
        d.style.animation = 'shake 0.3s';
        setTimeout(() => d.style.animation = '', 400);
      });
    }
  });

  container.querySelector('#puzzle-close').addEventListener('click', () => {
    document.getElementById('modal-puzzle').classList.add('hidden');
  });
}

function getWrongMsg(archetype) {
  const msgs = {
    'ancient-tomb':      'The rings resist. The gods are not appeased.',
    'underground-lab':   'ACCESS DENIED. Code incorrect.',
    'space-station':     'INVALID SEQUENCE. Security lockout active.',
    'ship-cabin':        'The lock holds. Try again.',
    'haunted-manor':     'The lock rattles, then goes still.',
    'victorian-library': 'The mechanism clicks but does not yield.',
  };
  return msgs[archetype] || 'Incorrect. Try again.';
}