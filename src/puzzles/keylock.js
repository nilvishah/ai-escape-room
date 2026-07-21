import { soundCorrect, soundWrong, soundPickup } from '../engine/audio.js';
import { state } from '../engine/state.js';

export function renderKeyLockPuzzle(puzzle, container, onSolved) {
  const requiredItemId = puzzle.solution;  // ID of the item needed
  const room = state.room;

  // Find what item we need and what we have
  const requiredItem = room.items.find(i => i.id === requiredItemId);
  const inventoryItems = state.inventory
    .map(id => room.items.find(i => i.id === id))
    .filter(Boolean);

  container.innerHTML = `
    <button class="puzzle-close-btn" id="puzzle-close">✕</button>
    <div class="puzzle-header">
      <h2>🗝️ ${puzzle.name}</h2>
      <p>${puzzle.instruction || 'Use the right item from your inventory to unlock this.'}</p>
    </div>
    <div class="keylock">
      <div>
        <h4 style="font-size:12px;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;">Lock</h4>
        <div class="keylock-slots">
          <div class="keyhole keylock-target" id="keyhole-main" data-accepts="${requiredItemId}">
            <span id="keyhole-content">🔒</span>
            <span class="keyhole-label">Insert Item</span>
          </div>
        </div>
      </div>

      <div>
        <h4 style="font-size:12px;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;">Your Items</h4>
        <div class="keylock-inventory" id="keylock-inv"></div>
        ${inventoryItems.length === 0 ? '<p style="font-size:13px;color:var(--danger)">You don\'t have any items. Find one first.</p>' : ''}
      </div>
      <p id="keylock-feedback" style="font-size:13px;color:var(--text-muted);min-height:20px;text-align:center;"></p>
    </div>
  `;

  const invEl = container.querySelector('#keylock-inv');
  const keyhole = container.querySelector('#keyhole-main');
  let solved = false;

  // Render inventory items as draggables
  inventoryItems.forEach(item => {
    const el = document.createElement('div');
    el.className = 'draggable-item';
    el.draggable = true;
    el.dataset.itemId = item.id;
    el.title = item.name;
    el.innerHTML = `<span title="${item.name}">${item.emoji}</span>`;

    // Drag events
    el.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.id);
      e.dataTransfer.effectAllowed = 'move';
      soundPickup();
    });

    // Click-to-use as alternative to drag
    el.addEventListener('click', () => {
      if (solved) return;
      tryUseItem(item.id);
    });

    invEl.appendChild(el);
  });

  // Keyhole drag target
  keyhole.addEventListener('dragover', (e) => {
    e.preventDefault();
    keyhole.classList.add('drag-target');
    e.dataTransfer.dropEffect = 'move';
  });
  keyhole.addEventListener('dragleave', () => keyhole.classList.remove('drag-target'));
  keyhole.addEventListener('drop', (e) => {
    e.preventDefault();
    keyhole.classList.remove('drag-target');
    const droppedId = e.dataTransfer.getData('text/plain');
    tryUseItem(droppedId);
  });

  function tryUseItem(itemId) {
    if (solved) return;
    if (itemId === requiredItemId) {
      solved = true;
      soundCorrect();
      keyhole.classList.add('has-item');
      keyhole.querySelector('#keyhole-content').textContent = requiredItem?.emoji || '✅';
      // Mark dragged item as used
      invEl.querySelectorAll('.draggable-item').forEach(el => {
        if (el.dataset.itemId === itemId) el.classList.add('used');
      });
      setTimeout(() => onSolved(puzzle.id), 800);
    } else {
      soundWrong();
      const feedback = container.querySelector('#keylock-feedback');
      feedback.textContent = 'That doesn\'t fit. Try a different item.';
      keyhole.style.borderColor = 'var(--danger)';
      setTimeout(() => {
        keyhole.style.borderColor = '';
        feedback.textContent = '';
      }, 700);
    }
  }

  container.querySelector('#puzzle-close').addEventListener('click', () => {
    document.getElementById('modal-puzzle').classList.add('hidden');
  });
}
