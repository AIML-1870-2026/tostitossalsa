// Bet panel — chip quick-select buttons
import { play } from '../audio/soundManager.js';

const CHIP_DENOMS = [1, 5, 25, 100, 500];

export function initBetPanel(onBetChange) {
  const container = document.getElementById('chip-quick-select');
  container.innerHTML = '';

  for (const denom of CHIP_DENOMS) {
    const btn = document.createElement('button');
    btn.className = 'chip-btn';
    btn.dataset.denom = denom;
    btn.textContent = denom >= 1000 ? `${denom / 1000}k` : denom;
    btn.setAttribute('aria-label', `Add ${denom} chip`);
    btn.addEventListener('click', () => {
      play('chipPlace');
      const input = document.getElementById('bet-input');
      const cur = parseInt(input.value, 10) || 0;
      input.value = cur + denom;
      onBetChange();
    });
    container.appendChild(btn);
  }

  document.getElementById('clear-bet-btn').addEventListener('click', () => {
    document.getElementById('bet-input').value = 0;
    onBetChange();
  });

  document.getElementById('bet-input').addEventListener('input', onBetChange);
}

export function getBet() {
  const v = parseInt(document.getElementById('bet-input').value, 10);
  return isNaN(v) || v < 1 ? 0 : v;
}

export function setBetInputMax(max) {
  document.getElementById('bet-input').max = max;
}
