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
// Bet is already deducted from balance at deal time, so balanceReturn
// is what gets credited back (original bet + any winnings).
// delta is the net profit/loss for display only.
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

    let outcome, delta, balanceReturn;

    if (playerBust) {
      outcome = 'lose'; delta = -bet; balanceReturn = 0;
    } else if (playerBJ && dealerBJ) {
      outcome = 'push'; delta = 0; balanceReturn = bet;
    } else if (playerBJ) {
      const profit = Math.floor(bet * BLACKJACK_PAYOUT);
      outcome = 'blackjack'; delta = profit; balanceReturn = bet + profit;
    } else if (dealerBJ) {
      outcome = 'lose'; delta = -bet; balanceReturn = 0;
    } else if (dealerBusted) {
      outcome = 'win'; delta = bet; balanceReturn = bet * 2;
    } else if (playerTotal > dealerTotal) {
      outcome = 'win'; delta = bet; balanceReturn = bet * 2;
    } else if (playerTotal < dealerTotal) {
      outcome = 'lose'; delta = -bet; balanceReturn = 0;
    } else {
      outcome = 'push'; delta = 0; balanceReturn = bet;
    }

    state.balance += balanceReturn;
    results.push({ outcome, delta, bet });
  });

  state.lastResults = results;
  return results;
}
