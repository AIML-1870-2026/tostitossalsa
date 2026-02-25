import { DECK_COUNT } from '../config.js';

const SUITS = ['clubs', 'diamonds', 'hearts', 'spades'];
const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export function buildDeck() {
  const deck = [];
  for (let d = 0; d < DECK_COUNT; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ rank, suit, faceDown: false });
      }
    }
  }
  return shuffle(deck);
}

export function shuffle(deck) {
  const a = [...deck];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Removes and returns the top card from the deck (mutates in place)
export function deal(deck) {
  if (deck.length === 0) throw new Error('Deck is empty');
  return deck.pop();
}

export function rankLabel(rank) {
  if (rank === 1)  return 'A';
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  return String(rank);
}

export function suitSymbol(suit) {
  return { clubs: '♣', diamonds: '♦', hearts: '♥', spades: '♠' }[suit];
}

export function cardImagePath(card, style = 'traditional') {
  if (card.faceDown) return 'src/assets/card_back.png';
  const dir = style === 'highcontrast' ? 'cards_highcontrast' : 'cards_traditional';
  return `src/assets/${dir}/card-${card.suit}-${card.rank}.png`;
}
