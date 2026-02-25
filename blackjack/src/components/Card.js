// Single card element — image with SVG fallback
import { cardImagePath, rankLabel, suitSymbol } from '../game/deck.js';
import { state } from '../game/gameState.js';

export function createCardEl(card) {
  const el = document.createElement('div');
  el.className = 'card' + (card.faceDown ? ' face-down' : '');
  el.setAttribute('role', 'listitem');

  if (card.faceDown) {
    el.setAttribute('aria-label', 'Face-down card');
    return el;
  }

  const label = `${rankLabel(card.rank)} of ${card.suit}`;
  el.setAttribute('aria-label', label);

  const img = document.createElement('img');
  img.alt = label;
  img.src = cardImagePath(card, state.cardStyle);
  img.onerror = () => {
    img.style.display = 'none';
    el.appendChild(makeSvgCard(card));
  };
  el.appendChild(img);
  return el;
}

function makeSvgCard(card) {
  const isRed = card.suit === 'diamonds' || card.suit === 'hearts';
  const color = isRed ? '#c0392b' : '#1a1a2e';
  const sym = suitSymbol(card.suit);
  const rank = rankLabel(card.rank);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 72 100');
  svg.setAttribute('class', 'card-svg');
  svg.innerHTML = `
    <rect width="72" height="100" rx="6" fill="white" stroke="#ccc" stroke-width="1.5"/>
    <text x="5" y="18" font-size="14" font-weight="bold" fill="${color}">${rank}</text>
    <text x="5" y="30" font-size="12" fill="${color}">${sym}</text>
    <text x="36" y="60" font-size="28" text-anchor="middle" fill="${color}">${sym}</text>
    <text x="67" y="90" font-size="14" font-weight="bold" fill="${color}" transform="rotate(180,67,90)">${rank}</text>
    <text x="67" y="78" font-size="12" fill="${color}" transform="rotate(180,67,78)">${sym}</text>
  `;
  return svg;
}
