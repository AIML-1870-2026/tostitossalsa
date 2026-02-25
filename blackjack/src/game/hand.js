// Hand value calculation, bust/blackjack checks

// Numeric value of a rank (face cards = 10, Ace = 1 or 11)
function rankValue(rank) {
  if (rank >= 10) return 10;
  return rank;
}

// Returns the best hand total <= 21 (or lowest bust total)
export function handValue(cards) {
  const visible = cards.filter(c => !c.faceDown);
  let total = 0;
  let aces = 0;
  for (const c of visible) {
    if (c.rank === 1) {
      aces++;
      total += 11;
    } else {
      total += rankValue(c.rank);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

export function isBust(cards) {
  return handValue(cards) > 21;
}

// Natural blackjack: exactly 2 cards totalling 21
export function isBlackjack(cards) {
  return cards.length === 2 && handValue(cards) === 21;
}

// Two cards share the same numeric value (pairs, face cards, aces)
export function canSplit(cards) {
  if (cards.length !== 2) return false;
  return rankValue(cards[0].rank) === rankValue(cards[1].rank);
}

// Display string e.g. "17" or "soft 17"
export function scoreLabel(cards) {
  const visible = cards.filter(c => !c.faceDown);
  const total = handValue(visible);
  // Soft if an Ace is counted as 11
  let raw = 0, aces = 0;
  for (const c of visible) {
    if (c.rank === 1) { aces++; raw += 11; } else { raw += rankValue(c.rank); }
  }
  const isSoft = aces > 0 && raw <= 21 && total === raw;
  if (isSoft && total < 21) return `soft ${total}`;
  return String(total);
}
