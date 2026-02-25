// Central state — single source of truth
import { STARTING_BALANCE, CARD_STYLE_DEFAULT } from '../config.js';
import { buildDeck } from './deck.js';

export const state = {
  phase: 'IDLE',          // IDLE | BETTING | DEALING | PLAYER_TURN | SPLIT_TURN | DEALER_TURN | RESOLUTION
  balance: STARTING_BALANCE,
  currentBet: 0,
  deck: [],
  dealerHand: [],         // [{rank, suit, faceDown}]
  playerHands: [[]],      // array of hands; split creates a second entry
  bets: [0],              // parallel to playerHands
  activeHandIndex: 0,
  cardStyle: CARD_STYLE_DEFAULT,
  muted: false,
  lastResults: [],        // [{outcome:'win'|'lose'|'push'|'blackjack', delta:number}]
  splitAces: false,       // no extra hits allowed on split aces
};

export function resetRound() {
  state.deck = buildDeck();
  state.dealerHand = [];
  state.playerHands = [[]];
  state.bets = [state.currentBet];
  state.activeHandIndex = 0;
  state.lastResults = [];
  state.splitAces = false;
}
