import { state, getPuzzleStatus } from '../engine/state.js';

// ── Inventory ──────────────────────────────────────────────────
export function updateInventoryHUD() {
  const slots = document.querySelectorAll('.inv-slot');
  slots.forEach((slot, i) => {
    slot.innerHTML = '';
    slot.classList.remove('has-item');
    if (i < state.inventory.length) {
      const itemId = state.inventory[i];
      const item = state.room?.items.find(it => it.id === itemId);
      if (item) {
        slot.textContent = item.emoji;
        slot.title = item.name;
        slot.classList.add('has-item');
      }
    }
  });
}

// ── Clue Log ───────────────────────────────────────────────────
export function addClueToLog(clueText, objectName) {
  const log = document.getElementById('clue-log');

  // Remove empty message
  const empty = log.querySelector('.clue-empty');
  if (empty) empty.remove();

  // Fade out previous fresh entries
  log.querySelectorAll('.clue-entry.fresh').forEach(el => el.classList.remove('fresh'));

  const entry = document.createElement('div');
  entry.className = 'clue-entry fresh';
  entry.innerHTML = `<strong>${objectName}:</strong> ${clueText}`;
  log.insertBefore(entry, log.firstChild);
}

// ── Puzzle Chain ───────────────────────────────────────────────
export function renderPuzzleChain() {
  const chain = document.getElementById('puzzle-chain');
  if (!chain || !state.room) return;
  chain.innerHTML = '';

  state.room.puzzles.forEach(puzzle => {
    const status = getPuzzleStatus(puzzle.id);
    const node = document.createElement('div');
    node.className = 'chain-node';

    const icons = { solved: '✓', active: '!', locked: '🔒' };
    node.innerHTML = `
      <div class="chain-dot ${status}">${icons[status] || '?'}</div>
      <span class="chain-label ${status}">${puzzle.name}</span>
    `;
    chain.appendChild(node);
  });

  // Exit node
  const exitNode = document.createElement('div');
  exitNode.className = 'chain-node';
  const exitStatus = state.exitOpen ? 'solved' : 'exit';
  exitNode.innerHTML = `
    <div class="chain-dot ${exitStatus}">${state.exitOpen ? '✓' : '🚪'}</div>
    <span class="chain-label">Exit</span>
  `;
  chain.appendChild(exitNode);
}

// ── Hint Text ──────────────────────────────────────────────────
export function setHint(text) {
  const el = document.getElementById('hint-text');
  if (el) el.textContent = text;
}

// ── Exit Button ────────────────────────────────────────────────
export function updateExitButton() {
  const btn = document.getElementById('btn-exit');
  if (!btn) return;
  if (state.exitOpen) {
    btn.classList.remove('locked');
    btn.classList.add('open');
    btn.textContent = 'Exit →';
    btn.disabled = false;
  } else {
    btn.classList.add('locked');
    btn.classList.remove('open');
    btn.textContent = 'Exit Locked';
    btn.disabled = true;
  }
}

// ── Room Info ──────────────────────────────────────────────────
export function setRoomInfo(number, name) {
  const numEl = document.getElementById('room-number');
  const nameEl = document.getElementById('room-name');
  if (numEl) numEl.textContent = `Room ${number}`;
  if (nameEl) nameEl.textContent = name;
}

// ── Toast feedback ─────────────────────────────────────────────
export function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `feedback-toast ${type}`;
  toast.textContent = message;
  document.getElementById('screen-game').appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}
