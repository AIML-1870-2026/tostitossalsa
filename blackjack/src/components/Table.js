// Table chip stack display (denominations visible on the felt)
const CHIP_DENOMS = [1, 5, 25, 100, 500];

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
