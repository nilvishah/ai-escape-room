import { soundCorrect, soundWrong } from '../engine/audio.js';

export function renderCipherPuzzle(puzzle, container, onSolved) {
  const alphabet = puzzle.cipherAlphabet || {};  // { "★": "A", "◆": "B", ... }
  const message  = puzzle.cipherMessage  || '';  // e.g. "★◆★" → decoded word
  const solution = puzzle.solution;               // e.g. "OPEN"

  container.innerHTML = `
    <button class="puzzle-close-btn" id="puzzle-close">✕</button>
    <div class="puzzle-header">
      <h2>📜 ${puzzle.name}</h2>
      <p>${puzzle.instruction || 'Decode the message using the symbol key you found.'}</p>
    </div>
    <div class="cipher-lock">
      <h4 style="font-size:12px;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Symbol Key</h4>
      <div class="cipher-key-display" id="cipher-key"></div>

      <h4 style="font-size:12px;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em;margin:16px 0 8px;">Encoded Message</h4>
      <div class="cipher-message">${message}</div>

      <h4 style="font-size:12px;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.08em;margin:16px 0 8px;">Your Answer</h4>
      <div class="cipher-input">
        <input type="text" id="cipher-answer" maxlength="10" placeholder="TYPE THE DECODED WORD" autocomplete="off" spellcheck="false" />
        <button class="btn-primary" id="cipher-submit">Decode</button>
      </div>
      <p id="cipher-feedback" style="font-size:13px;color:var(--text-muted);min-height:20px;text-align:center;margin-top:12px;"></p>
    </div>
  `;

  // Render symbol key
  const keyEl = container.querySelector('#cipher-key');
  Object.entries(alphabet).forEach(([sym, letter]) => {
    const pair = document.createElement('div');
    pair.className = 'cipher-pair';
    pair.innerHTML = `<span class="cipher-symbol">${sym}</span><span class="cipher-letter">= ${letter}</span>`;
    keyEl.appendChild(pair);
  });

  const input = container.querySelector('#cipher-answer');
  const feedback = container.querySelector('#cipher-feedback');

  // Enter key submits
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkCipher();
  });

  container.querySelector('#cipher-submit').addEventListener('click', checkCipher);

  function checkCipher() {
    const attempt = input.value.trim().toUpperCase();
    if (!attempt) return;
    if (attempt === solution.toUpperCase()) {
      soundCorrect();
      input.style.borderColor = 'var(--success)';
      input.style.color = 'var(--success)';
      setTimeout(() => onSolved(puzzle.id), 700);
    } else {
      soundWrong();
      feedback.textContent = 'That\'s not quite right. Check the symbols again.';
      input.style.borderColor = 'var(--danger)';
      input.style.animation = 'shake 0.3s';
      setTimeout(() => {
        input.style.animation = '';
        input.style.borderColor = '';
        feedback.textContent = '';
      }, 600);
    }
  }

  container.querySelector('#puzzle-close').addEventListener('click', () => {
    document.getElementById('modal-puzzle').classList.add('hidden');
  });

  input.focus();
}
