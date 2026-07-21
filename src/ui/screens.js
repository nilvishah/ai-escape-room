// Screen manager - handles transitions between screens
const screens = {};

export function initScreens() {
  ['start', 'generate', 'game', 'victory'].forEach(id => {
    screens[id] = document.getElementById(`screen-${id}`);
  });
}

export function showScreen(name) {
  // Hide all
  Object.entries(screens).forEach(([id, el]) => {
    if (!el) return;
    el.classList.remove('active', 'visible');
    if (id === 'game') {
      el.style.display = 'none';
    }
  });

  const target = screens[name];
  if (!target) return;

  if (name === 'game') {
    target.style.display = 'block';
    target.classList.add('active');
    requestAnimationFrame(() => target.classList.add('visible'));
  } else {
    target.classList.add('active');
    requestAnimationFrame(() => target.classList.add('visible'));
  }
}

// Generation screen progress steps
const stepEls = [];
export function initGenSteps() {
  for (let i = 0; i < 4; i++) {
    stepEls.push(document.getElementById(`gstep-${i}`));
  }
}

export function setGenStep(index, label) {
  // Mark previous as done
  for (let i = 0; i < index; i++) {
    if (stepEls[i]) {
      stepEls[i].classList.remove('active');
      stepEls[i].classList.add('done');
    }
  }
  // Mark current as active
  if (stepEls[index]) {
    stepEls[index].classList.add('active');
  }
  if (label) {
    const statusEl = document.getElementById('gen-status');
    if (statusEl) statusEl.textContent = label;
  }
}

export function setGenTheme(theme) {
  const el = document.getElementById('gen-theme');
  if (el) {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.4s';
    setTimeout(() => {
      el.textContent = theme;
      el.style.opacity = '1';
    }, 200);
  }
}
