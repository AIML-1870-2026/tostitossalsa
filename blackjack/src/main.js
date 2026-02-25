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
import { renderBetStack }  from './components/Table.js';
import { ENABLE_SPLIT, ENABLE_DOUBLE_DOWN, MIN_BET } from './config.js';

const TOTAL_DECK_SIZE = 52 * 6;
const FLY_MS = 220; // card flight duration in ms

// ── DOM refs ──────────────────────────────────────────────────────────────────
const dealerHandEl  = document.getElementById('dealer-hand');
const dealerScoreEl = document.getElementById('dealer-score');
const playerWrapEl  = document.getElementById('player-hands-wrap');
const resultOverlay = document.getElementById('result-overlay');
const muteBtn       = document.getElementById('mute-btn');

// ── Init ──────────────────────────────────────────────────────────────────────
initCardStyleToggle(redrawAll);
initBetPanel(validateBetInput);
renderBetStack(parseInt(document.getElementById('bet-input').value, 10) || 0);

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
  renderBetStack(v);
}

// ── Fly Card Animation ────────────────────────────────────────────────────────
// Launches a card-back element from the deck visual to targetEl, then calls onLand.
function flyCard(targetEl, onLand) {
  const deckEl = document.getElementById('deck-visual');
  if (!deckEl || !targetEl) { onLand(); return; }

  const cs  = getComputedStyle(document.documentElement);
  const w   = parseInt(cs.getPropertyValue('--card-w')) || 72;
  const h   = parseInt(cs.getPropertyValue('--card-h')) || 100;

  const from = deckEl.getBoundingClientRect();
  const to   = targetEl.getBoundingClientRect();

  // Land after however many cards are already rendered in the target hand
  const existingCards = targetEl.querySelectorAll('.card').length;
  const toX = Math.min(to.left + existingCards * (w + 4), to.right - w);
  const toY = to.bottom - h; // cards sit at flex-end

  const flyer = document.createElement('div');
  flyer.className = 'card';
  Object.assign(flyer.style, {
    position:      'fixed',
    width:         w + 'px',
    height:        h + 'px',
    left:          from.left + 'px',
    top:           from.top  + 'px',
    zIndex:        '500',
    pointerEvents: 'none',
    margin:        '0',
    animation:     'none',
    background:    'linear-gradient(135deg, #1a237e, #283593)',
    border:        '2px solid rgba(255,255,255,.2)',
  });
  document.body.appendChild(flyer);

  // Double rAF ensures the starting position is painted before the transition begins
  requestAnimationFrame(() => requestAnimationFrame(() => {
    flyer.style.transition = `left ${FLY_MS}ms ease-out, top ${FLY_MS}ms ease-out`;
    flyer.style.left = toX + 'px';
    flyer.style.top  = toY + 'px';
  }));

  setTimeout(() => {
    flyer.remove();
    onLand();
  }, FLY_MS + 30);
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

  // Clear previous round's cards immediately so they don't show during new fly-ins
  dealerHandEl.innerHTML = '';
  dealerScoreEl.textContent = '';
  playerWrapEl.innerHTML = '';

  state.phase = 'DEALING';
  disableAll();
  document.getElementById('bet-input').disabled = true;

  play('shuffle');

  // Deal: player, dealer, player, dealer (hole card face-down) — each card waits for the previous to land
  setTimeout(() => {
    dealCardTo('player', 0, () =>
      dealCardTo('dealer', false, () =>
        dealCardTo('player', 0, () =>
          dealCardTo('dealer', true, afterDeal))));
  }, 300);
}

// Deals one card: starts the fly animation, then adds to state + re-renders on land.
// done() is called after the card is rendered.
function dealCardTo(target, playerHandOrFaceDown, done) {
  const card = deal(state.deck);
  renderDeck(state.deck.length, TOTAL_DECK_SIZE);
  play('cardDeal');

  if (target === 'dealer') {
    card.faceDown = Boolean(playerHandOrFaceDown);
    flyCard(dealerHandEl, () => {
      state.dealerHand.push(card);
      renderHand(dealerHandEl, state.dealerHand, true, dealerScoreEl);
      if (done) done();
    });
  } else {
    const handIndex = playerHandOrFaceDown;
    // Target the specific .hand container if it exists, otherwise the wrap
    const panels  = playerWrapEl.querySelectorAll('.hand');
    const targetEl = panels[handIndex] || playerWrapEl;
    flyCard(targetEl, () => {
      state.playerHands[handIndex].push(card);
      renderPlayerHands(playerWrapEl, state.playerHands, state.bets, state.activeHandIndex);
      if (done) done();
    });
  }
}

function afterDeal() {
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
  dealCardTo('player', i, () => {
    if (isBust(state.playerHands[i])) {
      play('bust');
      advanceHand();
      return;
    }
    if (state.splitAces) { advanceHand(); return; }
    updateActionButtons();
  });
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
  dealCardTo('player', i, advanceHand);
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

  // Render the two split panels now so fly targets (.hand[0], .hand[1]) exist
  renderPlayerHands(playerWrapEl, state.playerHands, state.bets, state.activeHandIndex);

  setTimeout(() => {
    dealCardTo('player', 0, () => {
      dealCardTo('player', 1, () => {
        state.activeHandIndex = 0;
        state.phase = 'SPLIT_TURN';
        renderPlayerHands(playerWrapEl, state.playerHands, state.bets, state.activeHandIndex);
        updateActionButtons();
      });
    });
  }, 50);
}

function advanceHand() {
  const nextIndex = state.activeHandIndex + 1;
  if (nextIndex < state.playerHands.length) {
    state.activeHandIndex = nextIndex;
    state.phase = 'SPLIT_TURN';
    renderPlayerHands(playerWrapEl, state.playerHands, state.bets, state.activeHandIndex);
    if (state.splitAces) {
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
      const card = deal(state.deck);
      renderDeck(state.deck.length, TOTAL_DECK_SIZE);
      play('cardDeal');
      flyCard(dealerHandEl, () => {
        state.dealerHand.push(card);
        renderHand(dealerHandEl, state.dealerHand, true, dealerScoreEl);
        setTimeout(drawNext, 150);
      });
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
