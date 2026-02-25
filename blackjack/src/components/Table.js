// Table chip stack display (denominations visible on the felt)
const CHIP_DENOMS = [1, 5, 25, 100, 500];

const STACK_IMAGES = {
  1:   'public/chips/chip_1.png',
  5:   'public/chips/chip_5.png',
  25:  'public/chips/chip_25.png',
  100: 'public/chips/chip_100.png',
};

// Chip colors for denominations without a PNG (e.g. 500)
const CHIP_COLORS = {
  500: '#8e44ad',
};

export function renderTableChips() {
  const container = document.getElementById('table-chip-stacks');
  if (!container) return;
  container.innerHTML = '';
  for (const denom of CHIP_DENOMS) {
    const chip = document.createElement('div');
    chip.className = 'table-chip';
    chip.dataset.denom = denom;
    chip.textContent = denom >= 1000 ? `${denom / 1000}k` : denom;
    chip.setAttribute('aria-label', `${denom} chip`);
    container.appendChild(chip);
  }
}

// Render a stacked chip pile representing `amount` in the #bet-chip-stack element.
export function renderBetStack(amount) {
  const container = document.getElementById('bet-chip-stack');
  if (!container) return;
  container.innerHTML = '';

  if (!amount || amount <= 0) {
    container.style.height = '0';
    return;
  }

  // Decompose amount into chips (greedy, highest first)
  const denomOrder = [500, 100, 25, 5, 1];
  const chips = [];
  let remaining = amount;
  for (const d of denomOrder) {
    while (remaining >= d) {
      chips.push(d);
      remaining -= d;
    }
  }

  // Cap visual stack at 20 chips
  const MAX_CHIPS = 20;
  const displayChips = chips.slice(0, MAX_CHIPS);

  const CHIP_SIZE = 44;
  const OFFSET    = 9;   // px each chip rises above the previous
  const stackH    = CHIP_SIZE + (displayChips.length - 1) * OFFSET;

  container.style.height = stackH + 'px';

  displayChips.forEach((denom, i) => {
    let el;
    if (STACK_IMAGES[denom]) {
      el = document.createElement('img');
      el.src = STACK_IMAGES[denom];
      el.alt = `${denom} chip`;
    } else {
      el = document.createElement('div');
      el.setAttribute('aria-label', `${denom} chip`);
      el.style.background = CHIP_COLORS[denom] || '#555';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid rgba(255,255,255,.3)';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = '#fff';
      el.style.fontSize = '.65rem';
      el.style.fontWeight = 'bold';
      el.textContent = denom >= 1000 ? `${denom / 1000}k` : denom;
    }
    el.className = 'stacked-chip';
    el.style.bottom = (i * OFFSET) + 'px';
    container.appendChild(el);
  });
}
