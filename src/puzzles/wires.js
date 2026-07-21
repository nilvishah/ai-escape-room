import { soundCorrect, soundWrong, soundPatternPress } from '../engine/audio.js';

export function renderWiresPuzzle(puzzle, container, onSolved) {
  const archetype = window._currentArchetype || 'victorian-library';

  // solution: array of pairs e.g. [[0,2],[1,0],[2,1]] — left index connects to right index
  const solution = puzzle.wireSolution || [[0, 1], [1, 2], [2, 0]];
  const leftLabels  = puzzle.wireLeftLabels  || ['⚡', '🔥', '💧'];
  const rightLabels = puzzle.wireRightLabels || ['Alpha', 'Beta', 'Gamma'];
  const count = solution.length;

  // Track connections: leftIdx → rightIdx or null
  const connections = new Array(count).fill(null);
  let dragging = null; // { leftIdx, startEl }
  let locked = false;

  container.innerHTML = `
    <button class="puzzle-close-btn" id="puzzle-close">✕</button>
    <div class="puzzle-header puzzle-header-${archetype}">
      <h2>${getIcon(archetype)} ${puzzle.name}</h2>
      <p>${puzzle.instruction || 'Connect each terminal on the left to its matching terminal on the right.'}</p>
    </div>
    <div class="wires-puzzle">
      <div class="wires-clue">${puzzle.wireClue || 'Match the symbols to their correct terminals.'}</div>
      <div class="wires-board" id="wires-board">
        <div class="wires-column wires-left" id="wires-left"></div>
        <canvas class="wires-canvas" id="wires-canvas"></canvas>
        <div class="wires-column wires-right" id="wires-right"></div>
      </div>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:16px;">
        <button class="btn-secondary" id="wires-reset">Clear Wires</button>
        <button class="btn-primary btn-${archetype}" id="wires-submit">Connect</button>
      </div>
      <p id="wires-feedback" class="puzzle-feedback"></p>
    </div>
  `;

  const leftCol  = container.querySelector('#wires-left');
  const rightCol = container.querySelector('#wires-right');
  const canvas   = container.querySelector('#wires-canvas');
  const ctx      = canvas.getContext('2d');

  const COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff', '#ff9f43'];

  // Build terminals
  for (let i = 0; i < count; i++) {
    const left = document.createElement('div');
    left.className = `wire-terminal wire-terminal-left wire-terminal-${archetype}`;
    left.dataset.idx = i;
    left.textContent = leftLabels[i];
    left.style.setProperty('--wire-color', COLORS[i]);
    leftCol.appendChild(left);

    const right = document.createElement('div');
    right.className = `wire-terminal wire-terminal-right wire-terminal-${archetype}`;
    right.dataset.idx = i;
    right.textContent = rightLabels[i];
    rightCol.appendChild(right);
  }

  // Size canvas after DOM renders
  setTimeout(() => {
    const board = container.querySelector('#wires-board');
    canvas.width  = board.clientWidth - 120;
    canvas.height = board.clientHeight;
    drawWires();
  }, 50);

  // Drag from left terminal
  leftCol.addEventListener('mousedown', (e) => {
    if (locked) return;
    const term = e.target.closest('.wire-terminal-left');
    if (!term) return;
    dragging = { leftIdx: parseInt(term.dataset.idx) };
    connections[dragging.leftIdx] = null;
    soundPatternPress();
  });

  container.querySelector('#wires-board').addEventListener('mousemove', (e) => {
    if (!dragging) return;
    drawWires(e);
  });

  rightCol.addEventListener('mouseup', (e) => {
    if (!dragging) return;
    const term = e.target.closest('.wire-terminal-right');
    if (term) {
      const rightIdx = parseInt(term.dataset.idx);
      // Remove any existing connection to this right terminal
      connections.forEach((val, i) => { if (val === rightIdx) connections[i] = null; });
      connections[dragging.leftIdx] = rightIdx;
      soundPatternPress();
    }
    dragging = null;
    drawWires();
  });

  document.addEventListener('mouseup', () => {
    if (dragging) { dragging = null; drawWires(); }
  });

  function drawWires(mouseMoveEvent = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const leftTerminals  = leftCol.querySelectorAll('.wire-terminal-left');
    const rightTerminals = rightCol.querySelectorAll('.wire-terminal-right');
    const boardRect = canvas.getBoundingClientRect();

    // Draw completed connections
    connections.forEach((rightIdx, leftIdx) => {
      if (rightIdx === null) return;
      const leftEl  = leftTerminals[leftIdx];
      const rightEl = rightTerminals[rightIdx];
      if (!leftEl || !rightEl) return;

      const lr = leftEl.getBoundingClientRect();
      const rr = rightEl.getBoundingClientRect();

      const x1 = 0;
      const y1 = lr.top + lr.height / 2 - boardRect.top;
      const x2 = canvas.width;
      const y2 = rr.top + rr.height / 2 - boardRect.top;

      drawWire(ctx, x1, y1, x2, y2, COLORS[leftIdx], connections[leftIdx] === solution.find(s => s[0] === leftIdx)?.[1]);
    });

    // Draw dragging wire
    if (dragging && mouseMoveEvent) {
      const leftEl = leftTerminals[dragging.leftIdx];
      if (leftEl) {
        const lr = leftEl.getBoundingClientRect();
        const x1 = 0;
        const y1 = lr.top + lr.height / 2 - boardRect.top;
        const x2 = mouseMoveEvent.clientX - boardRect.left;
        const y2 = mouseMoveEvent.clientY - boardRect.top;
        drawWire(ctx, x1, y1, x2, y2, COLORS[dragging.leftIdx], false, true);
      }
    }
  }

  function drawWire(ctx, x1, y1, x2, y2, color, correct, isDragging = false) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    // Bezier curve for natural wire droop
    const cp1x = x1 + (x2 - x1) * 0.4;
    const cp2x = x1 + (x2 - x1) * 0.6;
    ctx.bezierCurveTo(cp1x, y1, cp2x, y2, x2, y2);
    ctx.strokeStyle = isDragging ? 'rgba(255,255,255,0.4)' : color;
    ctx.lineWidth = isDragging ? 2 : 3;
    ctx.setLineDash(isDragging ? [5, 5] : []);
    ctx.stroke();
    ctx.setLineDash([]);

    // Endpoint dots
    ctx.beginPath();
    ctx.arc(x1, y1, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  container.querySelector('#wires-reset').addEventListener('click', () => {
    if (locked) return;
    connections.fill(null);
    drawWires();
  });

  container.querySelector('#wires-submit').addEventListener('click', () => {
    if (locked) return;
    const correct = solution.every(([li, ri]) => connections[li] === ri);
    if (correct) {
      locked = true;
      soundCorrect();
      container.querySelector('#wires-feedback').style.color = 'var(--success)';
      container.querySelector('#wires-feedback').textContent = 'All circuits connected.';
      setTimeout(() => onSolved(puzzle.id), 900);
    } else {
      soundWrong();
      container.querySelector('#wires-feedback').textContent = getWrongMsg(archetype);
      setTimeout(() => { container.querySelector('#wires-feedback').textContent = ''; }, 1000);
    }
  });

  container.querySelector('#puzzle-close').addEventListener('click', () => {
    document.getElementById('modal-puzzle').classList.add('hidden');
  });
}

function getIcon(archetype) {
  const icons = {
    'ancient-tomb': '𓂀', 'underground-lab': '⚡',
    'space-station': '🛸', 'ship-cabin': '⚓',
    'haunted-manor': '🕯️', 'victorian-library': '📜',
  };
  return icons[archetype] || '⚡';
}

function getWrongMsg(archetype) {
  const msgs = {
    'ancient-tomb':      'The circuits spark. Wrong connections.',
    'underground-lab':   'CIRCUIT ERROR. Check your connections.',
    'space-station':     'Power grid mismatch. Reconfigure.',
    'ship-cabin':        'The rigging is wrong. Try again.',
    'haunted-manor':     'The energy dissipates. Wrong.',
    'victorian-library': 'The mechanism fails to respond.',
  };
  return msgs[archetype] || 'Wrong connections. Try again.';
}