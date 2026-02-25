// Table chip stack display (denominations visible on the felt)
const CHIP_DENOMS = [1, 5, 25, 100, 500];

const STACK_IMAGES = {
  1:   'src/assets/chips/chip_1.png',
  5:   'src/assets/chips/chip_5.png',
  25:  'src/assets/chips/chip_25.png',
  100: 'src/assets/chips/chip_100.png',
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
    const pile = document.createElement('div');
    pile.className = 'table-chip-pile';
    pile.setAttribute('aria-label', `${denom} chip stack`);
    for (let j = 0; j < 3; j++) {
      const chip = document.createElement('div');
      chip.className = 'table-chip';
      chip.dataset.denom = denom;
      chip.style.bottom = (j * 5) + 'px';
      pile.appendChild(chip);
    }
    container.appendChild(pile);
  }
}

// Render separate stacked piles per denomination in the #bet-chip-stack element.
export function renderBetStack(amount) {
  const container = document.getElementById('bet-chip-stack');
  if (!container) return;
  container.innerHTML = '';

  if (!amount || amount <= 0) return;

  const denomOrder = [500, 100, 25, 5, 1];
  const MAX_PER_PILE = 10;
  const CHIP_SIZE = 44;
  const OFFSET    = 9;

  // Count chips per denomination (greedy decomposition)
  const counts = {};
  let remaining = amount;
  for (const d of denomOrder) {
    counts[d] = 0;
    while (remaining >= d) { counts[d]++; remaining -= d; }
  }

  for (const denom of denomOrder) {
    const count = Math.min(counts[denom], MAX_PER_PILE);
    if (count === 0) continue;

    const pileH = CHIP_SIZE + (count - 1) * OFFSET;
    const pile = document.createElement('div');
    pile.className = 'bet-chip-pile';
    pile.style.height = pileH + 'px';

    for (let i = 0; i < count; i++) {
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
      }
      el.className = 'stacked-chip';
      el.style.bottom = (i * OFFSET) + 'px';
      pile.appendChild(el);
    }
    container.appendChild(pile);
  }
}
