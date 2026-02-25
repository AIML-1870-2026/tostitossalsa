// Traditional / High Contrast card style toggle
import { state } from '../game/gameState.js';

export function initCardStyleToggle(onToggle) {
  const btn = document.getElementById('card-style-toggle');
  btn.addEventListener('click', () => {
    state.cardStyle = state.cardStyle === 'traditional' ? 'highcontrast' : 'traditional';
    document.body.classList.toggle('high-contrast', state.cardStyle === 'highcontrast');
    btn.textContent = state.cardStyle === 'highcontrast' ? 'High Contrast' : 'Traditional';
    onToggle();
  });
}
