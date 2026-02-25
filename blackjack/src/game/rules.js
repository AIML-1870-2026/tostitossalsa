// Dealer AI, payout resolution
import { DEALER_STANDS_ON, BLACKJACK_PAYOUT } from '../config.js';
import { deal } from './deck.js';
import { handValue, isBust, isBlackjack } from './hand.js';
import { state } from './gameState.js';

// Dealer draws until standing on DEALER_STANDS_ON+
export function runDealer() {
  state.dealerHand.forEach(c => (c.faceDown = false));
  while (handValue(state.dealerHand) < DEALER_STANDS_ON) {
    state.dealerHand.push(deal(state.deck));
  }
}

// Resolve all player hands against dealer. Returns array of results.
export function resolveHands() {
  const dealerBJ = isBlackjack(state.dealerHand);
  const dealerTotal = handValue(state.dealerHand);
  const dealerBusted = isBust(state.dealerHand);

  const results = [];

  state.playerHands.forEach((hand, i) => {
    const bet = state.bets[i];
    const playerTotal = handValue(hand);
    const playerBJ = isBlackjack(hand) && state.playerHands.length === 1;
    const playerBust = isBust(hand);

    let outcome, delta;

    if (playerBust) {
      outcome = 'lose'; delta = -bet;
    } else if (playerBJ && dealerBJ) {
      outcome = 'push'; delta = 0;
    } else if (playerBJ) {
      outcome = 'blackjack'; delta = Math.floor(bet * BLACKJACK_PAYOUT);
    } else if (dealerBJ) {
      outcome = 'lose'; delta = -bet;
    } else if (dealerBusted) {
      outcome = 'win'; delta = bet;
    } else if (playerTotal > dealerTotal) {
      outcome = 'win'; delta = bet;
    } else if (playerTotal < dealerTotal) {
      outcome = 'lose'; delta = -bet;
    } else {
      outcome = 'push'; delta = 0;
    }

    state.balance += delta;
    results.push({ outcome, delta, bet });
  });

  state.lastResults = results;
  return results;
}
