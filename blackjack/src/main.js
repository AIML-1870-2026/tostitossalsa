// Entry point — wires all modules together
import { state, resetRound } from './game/gameState.js';
import { deal }              from './game/deck.js';
import { handValue, isBust, isBlackjack, canSplit } from './game/hand.js';
import { resolveHands }  from './game/rules.js';
import { play }              from './audio/soundManager.js';
import { renderHand, renderPlayerHands } from './components/Hand.js';
import { setDealerMood }     from './components/DealerAvatar.js';
import { initBetPanel, getBet, setBetInputMax } from './components/BetPanel.js';
import { setButtons, disableAll } from './components/ActionBar.js';
import { updateBalance }     from './components/ChipBalance.js';
import { renderDeck }        from './components/DeckVisual.js';
import { initCardStyleToggle } from './components/CardStyleToggle.js';
import { renderTableChips }  from './components/Table.js';
import { ENABLE_SPLIT, ENABLE_DOUBLE_DOWN, MIN_BET } from './config.js';

const TOTAL_DECK_SIZE = 52 * 6;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const dealerHandEl  = document.getElementById('dealer-hand');
const dealerScoreEl = document.getElementById('dealer-score');
const playerWrapEl  = document.getElementById('player-hands-wrap');
const resultOverlay = document.getElementById('result-overlay');
const muteBtn       = document.getElementById('mute-btn');

// ── Init ──────────────────────────────────────────────────────────────────────
renderTableChips();
initCardStyleToggle(redrawAll);
initBetPanel(validateBetInput);

muteBtn.addEventListener('click', () => {
  state.muted = !state.muted;
  muteBtn.textContent = state.muted ? 'Sound OFF' : 'Sound ON';
});

document.getElementById('btn-deal').addEventListener('click',   onDeal);
document.getElementById('btn-hit').addEventListener('click',    onHit);
document.getElementById('btn-stand').addEventListener('click',  onStand);
document.getElementById('btn-double').addEventListener('click', onDouble);
document.getElementById('btn-split').addEventListener('click',  onSplit);

enterIdle();

// ── Phase helpers ─────────────────────────────────────────────────────────────
function enterIdle() {
  state.phase = 'IDLE';
  setDealerMood('neutral');
  setButtons({ deal: true, hit: false, stand: false, double: false, split: false });
  setBetInputMax(state.balance);
  document.getElementById('bet-input').disabled = false;
  updateBalance(state.balance);
  renderDeck(TOTAL_DECK_SIZE, TOTAL_DECK_SIZE);

  if (state.balance < MIN_BET) {
    showResult([{ outcome: 'bust', label: 'Out of chips! Reload to restart.' }]);
    disableAll();
  }
}

function validateBetInput() {
  const input = document.getElementById('bet-input');
  let v = parseInt(input.value, 10);
  if (isNaN(v) || v < 0) v = 0;
  if (v > state.balance) v = state.balance;
  input.value = v;
}

// ── Deal ──────────────────────────────────────────────────────────────────────
function onDeal() {
  const bet = getBet();
  if (bet < MIN_BET || bet > state.balance) {
    flashBetInput();
    return;
  }

  state.currentBet = bet;
  state.balance -= bet;
  updateBalance(state.balance);
  hideResult();
  resetRound();

  state.phase = 'DEALING';
  disableAll();
  document.getElementById('bet-input').disabled = true;

  play('shuffle');

  // Deal: player, dealer, player, dealer (hole card face-down)
  setTimeout(() => {
    dealCardTo('player', 0);
    setTimeout(() => {
      dealCardTo('dealer', false);
      setTimeout(() => {
        dealCardTo('player', 0);
        setTimeout(() => {
          dealCardTo('dealer', true); // hole card face-down
          afterDeal();
        }, 200);
      }, 200);
    }, 200);
  }, 200);
}

function dealCardTo(target, playerHandOrFaceDown) {
  const card = deal(state.deck);
  if (target === 'dealer') {
    card.faceDown = Boolean(playerHandOrFaceDown);
    state.dealerHand.push(card);
    renderHand(dealerHandEl, state.dealerHand, true, dealerScoreEl);
  } else {
    state.playerHands[playerHandOrFaceDown].push(card);
    renderPlayerHands(playerWrapEl, state.playerHands, state.bets, state.activeHandIndex);
  }
  renderDeck(state.deck.length, TOTAL_DECK_SIZE);
  play('cardDeal');
}

function afterDeal() {
  // Check player blackjack immediately
  if (isBlackjack(state.playerHands[0])) {
    play('blackjack');
    state.phase = 'DEALER_TURN';
    setTimeout(runDealerTurn, 600);
    return;
  }
  enterPlayerTurn();
}

// ── Player Turn ───────────────────────────────────────────────────────────────
function enterPlayerTurn() {
  state.phase = 'PLAYER_TURN';
  setDealerMood('thinking');
  updateActionButtons();
}

function updateActionButtons() {
  const hand = state.playerHands[state.activeHandIndex];
  const canDbl = ENABLE_DOUBLE_DOWN && state.balance >= state.bets[state.activeHandIndex];
  const canSp  = ENABLE_SPLIT && state.playerHands.length === 1 && canSplit(hand)
                  && state.balance >= state.bets[0];
  setButtons({ deal: false, hit: true, stand: true, double: canDbl, split: canSp });
}

function onHit() {
  const i = state.activeHandIndex;
  dealCardTo('player', i);
  if (isBust(state.playerHands[i])) {
    play('bust');
    advanceHand();
    return;
  }
  if (state.splitAces) { advanceHand(); return; } // no extra hits on split aces
  updateActionButtons();
}

function onStand() {
  advanceHand();
}

function onDouble() {
  const i = state.activeHandIndex;
  state.balance -= state.bets[i];
  state.bets[i] *= 2;
  updateBalance(state.balance);
  play('chipPlace');
  dealCardTo('player', i);
  advanceHand(); // double always ends the hand
}

function onSplit() {
  const hand = state.playerHands[0];
  const splitCard = hand.pop();
  state.playerHands.push([splitCard]);
  state.bets.push(state.bets[0]);
  state.balance -= state.bets[0];
  updateBalance(state.balance);
  play('split');

  if (hand[0].rank === 1) state.splitAces = true;

  // Deal one card to each split hand
  setTimeout(() => {
    dealCardTo('player', 0);
    setTimeout(() => {
      dealCardTo('player', 1);
      state.activeHandIndex = 0;
      state.phase = 'SPLIT_TURN';
      renderPlayerHands(playerWrapEl, state.playerHands, state.bets, state.activeHandIndex);
      updateActionButtons();
    }, 250);
  }, 50);
}

function advanceHand() {
  const nextIndex = state.activeHandIndex + 1;
  if (nextIndex < state.playerHands.length) {
    state.activeHandIndex = nextIndex;
    state.phase = 'SPLIT_TURN';
    renderPlayerHands(playerWrapEl, state.playerHands, state.bets, state.activeHandIndex);
    if (state.splitAces) {
      // Aces get exactly one card — auto-advance
      setTimeout(advanceHand, 300);
      return;
    }
    updateActionButtons();
  } else {
    state.phase = 'DEALER_TURN';
    disableAll();
    runDealerTurn();
  }
}

// ── Dealer Turn ───────────────────────────────────────────────────────────────
function runDealerTurn() {
  // Reveal hole card
  state.dealerHand.forEach(c => (c.faceDown = false));
  renderHand(dealerHandEl, state.dealerHand, true, dealerScoreEl);
  play('dealerReveal');

  function drawNext() {
    if (handValue(state.dealerHand) < 17) {
      setTimeout(() => {
        const card = deal(state.deck);
        state.dealerHand.push(card);
        renderDeck(state.deck.length, TOTAL_DECK_SIZE);
        play('cardDeal');
        renderHand(dealerHandEl, state.dealerHand, true, dealerScoreEl);
        drawNext();
      }, 500);
    } else {
      setTimeout(resolveRound, 400);
    }
  }
  setTimeout(drawNext, 300);
}

// ── Resolution ────────────────────────────────────────────────────────────────
function resolveRound() {
  state.phase = 'RESOLUTION';
  const results = resolveHands();
  updateBalance(state.balance);

  const allLost = results.every(r => r.outcome === 'lose');
  const allWon  = results.every(r => r.outcome === 'win' || r.outcome === 'blackjack');
  setDealerMood(allLost ? 'happy' : allWon ? 'sad' : 'neutral');

  if (!state.muted) {
    const hasBJ   = results.some(r => r.outcome === 'blackjack');
    const hasWin  = results.some(r => r.outcome === 'win');
    const hasLose = results.some(r => r.outcome === 'lose');
    const hasPush = results.some(r => r.outcome === 'push');
    if (hasBJ)        play('blackjack');
    else if (hasWin)  play('win');
    else if (hasLose) play('lose');
    else if (hasPush) play('push');
  }

  showResult(results);

  setTimeout(() => {
    hideResult();
    enterIdle();
  }, 3000);
}

// ── Result Overlay ────────────────────────────────────────────────────────────
function showResult(results) {
  resultOverlay.innerHTML = '';
  for (const r of results) {
    const line = document.createElement('div');
    line.className = 'result-line';
    const { text, cls } = resultDisplay(r);
    line.classList.add(cls);
    line.textContent = text;
    resultOverlay.appendChild(line);
  }
  resultOverlay.classList.remove('hidden');
  requestAnimationFrame(() => resultOverlay.classList.add('show'));
}

function hideResult() {
  resultOverlay.classList.remove('show');
  resultOverlay.classList.add('hidden');
}

function resultDisplay(r) {
  const map = {
    win:       { text: `Win  +${r.delta}`,        cls: 'result-win'  },
    blackjack: { text: `Blackjack!  +${r.delta}`, cls: 'result-bj'   },
    lose:      { text: `Lose  ${r.delta}`,         cls: 'result-lose' },
    push:      { text: 'Push — bet returned',      cls: 'result-push' },
    bust:      { text: r.label || 'Bust!',         cls: 'result-lose' },
  };
  return map[r.outcome] || { text: r.outcome, cls: '' };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function redrawAll() {
  renderHand(dealerHandEl, state.dealerHand, true, dealerScoreEl);
  renderPlayerHands(playerWrapEl, state.playerHands, state.bets, state.activeHandIndex);
}

function flashBetInput() {
  const el = document.getElementById('bet-input');
  el.style.outline = '2px solid #e74c3c';
  setTimeout(() => (el.style.outline = ''), 600);
}
