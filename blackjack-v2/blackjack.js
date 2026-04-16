// blackjack.js — Deck, dealing, and scoring logic

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

function shuffleDeck(deck) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function cardValue(rank) {
  if (rank === 'A') return 11;
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  return parseInt(rank, 10);
}

function handTotal(cards) {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    total += cardValue(card.rank);
    if (card.rank === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function isSoft(cards) {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    total += cardValue(card.rank);
    if (card.rank === 'A') aces++;
  }
  // Check if any ace is still counted as 11
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return aces > 0;
}

function isBust(cards) {
  return handTotal(cards) > 21;
}

function isBlackjack(cards) {
  if (cards.length !== 2) return false;
  const total = handTotal(cards);
  return total === 21;
}

function isPair(cards) {
  if (cards.length !== 2) return false;
  return cardValue(cards[0].rank) === cardValue(cards[1].rank);
}

function handLabel(cards) {
  const total = handTotal(cards);
  const soft = isSoft(cards);
  return `${soft ? 'Soft' : 'Hard'} ${total}`;
}

function cardDisplay(card) {
  return `${card.rank}${card.suit}`;
}

export {
  createDeck, shuffleDeck, cardValue, handTotal, isSoft,
  isBust, isBlackjack, isPair, handLabel, cardDisplay
};
