/**
 * Deck builder helpers for deterministic Playwright tests.
 *
 * Cards are dealt via deck.pop(), so the LAST element is dealt first.
 * Initial deal order: player[0], dealer_up, player[1], dealer_hole
 *
 * Array layout:
 *   [...extra_cards, dealer_hole, player_card2, dealer_up, player_card1]
 *   where player_card1 is the last element (popped first).
 *
 * Extra cards (index 0, 1, ...) are used for subsequent hits/draws, popped in order.
 */

export function card(rank, suit = 'spades') {
  return { rank, suit, faceDown: false };
}

/**
 * Player gets Ace + King = Blackjack.
 * Dealer gets 9 (up) + 6 (hole), then draws a 5 → total 20.
 * Resolution: player BJ wins (1.5x) over dealer 20.
 */
export function buildPlayerBlackjackDeck() {
  return [
    card(5,  'clubs'),    // [0] dealer draw (9+6+5=20, stands)
    card(6,  'diamonds'), // [1] dealer hole
    card(13, 'clubs'),    // [2] player card 2 (King → player has A+K=BJ)
    card(9,  'hearts'),   // [3] dealer up (not Ace, no insurance)
    card(1,  'spades'),   // [4] player card 1 (Ace)
  ];
}

/**
 * Player gets 10 + 9 = 19 (stands).
 * Dealer gets Ace (up) + King (hole) = Blackjack → triggers insurance.
 * Resolution: dealer BJ beats player 19 (unless insurance taken).
 */
export function buildDealerBlackjackDeck() {
  return [
    card(13, 'hearts'),   // [0] dealer hole = King (dealer has A+K=BJ)
    card(9,  'clubs'),    // [1] player card 2
    card(1,  'diamonds'), // [2] dealer up = Ace → triggers insurance
    card(10, 'spades'),   // [3] player card 1
  ];
}

/**
 * Player gets 10 + 9 = 19 (stands and wins).
 * Dealer gets 7 (up) + 5 (hole) = 12, draws 2 + 3 → total 17 (stands).
 * Resolution: player 19 > dealer 17 → WIN.
 */
export function buildPlayerWinDeck() {
  return [
    card(3, 'clubs'),     // [0] dealer draw 2 (7+5+2+3=17, stands)
    card(2, 'clubs'),     // [1] dealer draw 1
    card(5, 'hearts'),    // [2] dealer hole
    card(9, 'diamonds'),  // [3] player card 2 (player: 10+9=19)
    card(7, 'clubs'),     // [4] dealer up (not Ace)
    card(10, 'spades'),   // [5] player card 1
  ];
}

/**
 * Player gets 10 + 7 = 17 (stands).
 * Dealer gets 9 (up) + 8 (hole) = 17 (stands).
 * Resolution: player 17 = dealer 17 → PUSH.
 */
export function buildPushDeck() {
  return [
    card(8, 'hearts'),    // [0] dealer hole (9+8=17, stands)
    card(7, 'clubs'),     // [1] player card 2 (player: 10+7=17)
    card(9, 'diamonds'),  // [2] dealer up (not Ace)
    card(10, 'spades'),   // [3] player card 1
  ];
}

/**
 * Player gets 10 + 5 = 15 (stands and loses).
 * Dealer gets 9 (up) + 7 (hole) = 16, draws 2 → total 18 (stands).
 * Resolution: player 15 < dealer 18 → LOSE.
 */
export function buildPlayerLoseDeck() {
  return [
    card(2, 'clubs'),     // [0] dealer draw (9+7+2=18, stands)
    card(7, 'diamonds'),  // [1] dealer hole
    card(5, 'clubs'),     // [2] player card 2 (player: 10+5=15)
    card(9, 'hearts'),    // [3] dealer up (not Ace)
    card(10, 'spades'),   // [4] player card 1
  ];
}

/**
 * Player gets 10 + 5 = 15, hits and gets 10 → busts (25).
 * Dealer gets 8 (up) + 7 (hole) = 15, draws 5 → total 20 (stands).
 * Resolution: player bust → LOSE.
 */
export function buildPlayerBustDeck() {
  return [
    card(5,  'clubs'),    // [0] dealer draw (8+7+5=20, stands)
    card(10, 'clubs'),    // [1] player hit card (10+5+10=25, bust)
    card(7,  'hearts'),   // [2] dealer hole
    card(5,  'diamonds'), // [3] player card 2 (player: 10+5=15)
    card(8,  'hearts'),   // [4] dealer up (not Ace)
    card(10, 'spades'),   // [5] player card 1
  ];
}

/**
 * Player gets 8 + 8 = pair → can split.
 * Dealer gets 6 (up) + 7 (hole) = 13, draws 5 → total 18 (stands).
 * After split: hand0=[8,3]=11, hand1=[8,5]=13. Both lose to dealer 18.
 */
export function buildSplitDeck() {
  return [
    card(5, 'hearts'),    // [0] dealer draw (6+7+5=18, stands)
    card(5, 'diamonds'),  // [1] card dealt to split hand 1 (8+5=13)
    card(3, 'clubs'),     // [2] card dealt to split hand 0 (8+3=11)
    card(7, 'hearts'),    // [3] dealer hole
    card(8, 'clubs'),     // [4] player card 2 (same rank as card1 → can split)
    card(6, 'diamonds'),  // [5] dealer up (not Ace)
    card(8, 'spades'),    // [6] player card 1
  ];
}

/**
 * Player gets 5 + 6 = 11 → ideal double-down hand.
 * Dealer gets 4 (up) + 5 (hole) = 9, draws 6 + 3 → total 18 (stands).
 * After double: player gets 10 → 5+6+10=21. Player 21 > dealer 18 → WIN.
 */
export function buildDoubleDownDeck() {
  return [
    card(3, 'clubs'),     // [0] dealer draw 2 (4+5+6+3=18, stands)
    card(6, 'hearts'),    // [1] dealer draw 1 (4+5+6=15, needs more)
    card(10, 'diamonds'), // [2] player double card (5+6+10=21)
    card(5, 'hearts'),    // [3] dealer hole
    card(6, 'clubs'),     // [4] player card 2 (player: 5+6=11)
    card(4, 'diamonds'),  // [5] dealer up (not Ace, weak)
    card(5, 'spades'),    // [6] player card 1
  ];
}

/**
 * Dealer shows Ace (up) + King (hole) = Blackjack → insurance prompt shown.
 * Player gets 10 + 9 = 19.
 * Use for: take insurance → insurance pays 2:1, player hand loses → net break-even.
 * Use for: decline insurance → player hand loses, net -100.
 */
export function buildInsuranceDealerBJDeck() {
  return [
    card(13, 'hearts'),   // [0] dealer hole = King (dealer has A+K=BJ)
    card(9,  'clubs'),    // [1] player card 2 (player: 10+9=19)
    card(1,  'diamonds'), // [2] dealer up = Ace → triggers insurance
    card(10, 'spades'),   // [3] player card 1
  ];
}

/**
 * Dealer shows Ace (up) + 6 (hole) → insurance prompt shown, but NO blackjack.
 * Dealer total: A+6 = soft 17 → dealer stands (DEALER_STANDS_ON = 17).
 * Player gets 10 + 9 = 19.
 * Use for: take insurance → insurance bet lost, player hand wins → net +50.
 * Use for: decline insurance → player wins, net +100.
 */
export function buildInsuranceNoBJDeck() {
  return [
    card(6,  'hearts'),   // [0] dealer hole = 6 (A+6=soft 17, stands — no BJ)
    card(9,  'clubs'),    // [1] player card 2 (player: 10+9=19)
    card(1,  'diamonds'), // [2] dealer up = Ace → triggers insurance
    card(10, 'spades'),   // [3] player card 1
  ];
}
