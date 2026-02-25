// Renders a hand (array of cards) into a DOM container
import { createCardEl } from './Card.js';
import { scoreLabel, isBust } from '../game/hand.js';

export function renderHand(container, cards, showScore = true, scoreEl = null) {
  container.innerHTML = '';
  container.classList.remove('bust');
  for (const card of cards) {
    const el = createCardEl(card);
    container.appendChild(el);
  }
  if (isBust(cards)) container.classList.add('bust');
  if (showScore && scoreEl) {
    const visible = cards.filter(c => !c.faceDown);
    scoreEl.textContent = visible.length ? scoreLabel(visible) : '';
  }
}

export function renderPlayerHands(wrap, playerHands, bets, activeIndex) {
  wrap.innerHTML = '';
  playerHands.forEach((hand, i) => {
    const panel = document.createElement('div');
    panel.className = 'hand-panel' + (i === activeIndex ? ' active-hand' : '');
    panel.setAttribute('aria-label', `Player hand ${i + 1}`);

    const handDiv = document.createElement('div');
    handDiv.className = 'hand';
    handDiv.setAttribute('role', 'list');

    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'score';

    renderHand(handDiv, hand, true, scoreDiv);

    if (bets[i]) {
      const betLabel = document.createElement('div');
      betLabel.className = 'score';
      betLabel.textContent = `Bet: ${bets[i]}`;
      panel.appendChild(betLabel);
    }

    panel.appendChild(handDiv);
    panel.appendChild(scoreDiv);
    wrap.appendChild(panel);
  });
}
