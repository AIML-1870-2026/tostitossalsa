// ── Deck ──────────────────────────────────────────────────────────────────────

const SUITS = ['♠', '♣', '♥', '♦'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RED_SUITS = new Set(['♥', '♦']);

function buildDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cardValue(card) {
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  if (card.rank === 'A') return 11;
  return parseInt(card.rank);
}

function handTotal(hand) {
  let total = 0;
  let aces = 0;
  for (const card of hand) {
    total += cardValue(card);
    if (card.rank === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

// ── State ─────────────────────────────────────────────────────────────────────

let deck = [];
let playerHand = [];
let dealerHand = [];
let balance = 1000;
let currentBet = 0;
let gameActive = false;

// ── DOM refs ──────────────────────────────────────────────────────────────────

const balanceEl      = document.getElementById('balance');
const currentBetEl   = document.getElementById('current-bet');
const playerHandEl   = document.getElementById('player-hand');
const dealerHandEl   = document.getElementById('dealer-hand');
const playerScoreEl  = document.getElementById('player-score');
const dealerScoreEl  = document.getElementById('dealer-score');
const messageOverlay = document.getElementById('message-overlay');
const messageText    = document.getElementById('message-text');

const dealBtn      = document.getElementById('deal-btn');
const hitBtn       = document.getElementById('hit-btn');
const standBtn     = document.getElementById('stand-btn');
const doubleBtn    = document.getElementById('double-btn');
const clearBetBtn  = document.getElementById('clear-bet-btn');
const newRoundBtn  = document.getElementById('new-round-btn');
const chips        = document.querySelectorAll('.chip');

// ── Rendering ─────────────────────────────────────────────────────────────────

function createCardEl(card, faceDown = false) {
  const el = document.createElement('div');
  el.className = 'card' + (faceDown ? ' face-down' : (RED_SUITS.has(card.suit) ? ' red' : ' black'));

  const top    = document.createElement('div');
  const center = document.createElement('div');
  const bottom = document.createElement('div');

  top.className    = 'rank-top';
  center.className = 'suit-center';
  bottom.className = 'rank-bottom';

  top.textContent    = `${card.rank}${card.suit}`;
  center.textContent = card.suit;
  bottom.textContent = `${card.rank}${card.suit}`;

  el.append(top, center, bottom);
  return el;
}

function renderHand(handEl, hand, hideSecond = false) {
  handEl.innerHTML = '';
  hand.forEach((card, i) => {
    const faceDown = hideSecond && i === 1;
    handEl.appendChild(createCardEl(card, faceDown));
  });
}

function updateScores(hideDealer = true) {
  playerScoreEl.textContent = handTotal(playerHand);
  if (hideDealer) {
    dealerScoreEl.textContent = cardValue(dealerHand[0]);
  } else {
    dealerScoreEl.textContent = handTotal(dealerHand);
  }
}

function updateBalanceDisplay() {
  balanceEl.textContent = balance;
}

// ── Bet logic ─────────────────────────────────────────────────────────────────

function placeBet(amount) {
  if (gameActive) return;
  if (currentBet + amount > balance) return;
  currentBet += amount;
  currentBetEl.textContent = currentBet;
}

function clearBet() {
  if (gameActive) return;
  currentBet = 0;
  currentBetEl.textContent = 0;
}

// ── Game flow ─────────────────────────────────────────────────────────────────

function startRound() {
  if (currentBet === 0) {
    showMessage('Place a bet first!', false);
    return;
  }

  balance -= currentBet;
  updateBalanceDisplay();

  if (deck.length < 15) {
    deck = shuffle(buildDeck());
  }

  playerHand = [deck.pop(), deck.pop()];
  dealerHand = [deck.pop(), deck.pop()];

  gameActive = true;
  setControls(true);

  renderHand(dealerHandEl, dealerHand, true);
  renderHand(playerHandEl, playerHand);
  updateScores(true);

  // Natural blackjack check
  if (handTotal(playerHand) === 21) {
    revealAndResolve();
    return;
  }

  doubleBtn.disabled = balance < currentBet;
}

function hit() {
  playerHand.push(deck.pop());
  renderHand(playerHandEl, playerHand);
  playerScoreEl.textContent = handTotal(playerHand);

  doubleBtn.disabled = true;

  if (handTotal(playerHand) > 21) {
    revealAndResolve();
  } else if (handTotal(playerHand) === 21) {
    stand();
  }
}

function stand() {
  // Dealer draws until 17+
  while (handTotal(dealerHand) < 17) {
    dealerHand.push(deck.pop());
  }
  revealAndResolve();
}

function doubleDown() {
  balance -= currentBet;
  currentBet *= 2;
  currentBetEl.textContent = currentBet;
  updateBalanceDisplay();

  playerHand.push(deck.pop());
  renderHand(playerHandEl, playerHand);
  playerScoreEl.textContent = handTotal(playerHand);

  stand();
}

function revealAndResolve() {
  gameActive = false;
  setControls(false);

  renderHand(dealerHandEl, dealerHand, false);
  updateScores(false);

  const playerTotal = handTotal(playerHand);
  const dealerTotal = handTotal(dealerHand);

  let message;

  if (playerTotal > 21) {
    message = 'Bust! You lose.';
  } else if (dealerTotal > 21) {
    message = 'Dealer busts! You win!';
    payout(2);
  } else if (playerTotal === 21 && playerHand.length === 2 && !(dealerTotal === 21 && dealerHand.length === 2)) {
    message = 'Blackjack! You win 3:2!';
    payout(2.5);
  } else if (playerTotal > dealerTotal) {
    message = 'You win!';
    payout(2);
  } else if (playerTotal === dealerTotal) {
    message = 'Push — bet returned.';
    payout(1);
  } else {
    message = 'Dealer wins.';
  }

  updateBalanceDisplay();
  showMessage(message, true);
}

function payout(multiplier) {
  balance += Math.floor(currentBet * multiplier);
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function setControls(playing) {
  dealBtn.disabled  = playing;
  hitBtn.disabled   = !playing;
  standBtn.disabled = !playing;
  doubleBtn.disabled = !playing;
  chips.forEach(c => c.disabled = playing);
  clearBetBtn.disabled = playing;
}

function showMessage(text, showReplay) {
  messageText.textContent = text;
  newRoundBtn.style.display = showReplay ? 'inline-block' : 'none';
  messageOverlay.classList.remove('hidden');

  if (!showReplay) {
    setTimeout(() => messageOverlay.classList.add('hidden'), 1800);
  }
}

function resetForNewRound() {
  messageOverlay.classList.add('hidden');
  playerHand = [];
  dealerHand = [];
  currentBet = 0;
  currentBetEl.textContent = 0;
  playerHandEl.innerHTML = '';
  dealerHandEl.innerHTML = '';
  playerScoreEl.textContent = '';
  dealerScoreEl.textContent = '';
  setControls(false);

  if (balance === 0) {
    balance = 1000;
    updateBalanceDisplay();
    showMessage('Out of chips! Reloaded $1000.', false);
  }
}

// ── Event listeners ───────────────────────────────────────────────────────────

chips.forEach(chip => {
  chip.addEventListener('click', () => placeBet(parseInt(chip.dataset.value)));
});

clearBetBtn.addEventListener('click', clearBet);
dealBtn.addEventListener('click', startRound);
hitBtn.addEventListener('click', hit);
standBtn.addEventListener('click', stand);
doubleBtn.addEventListener('click', doubleDown);
newRoundBtn.addEventListener('click', resetForNewRound);

// ── Init ──────────────────────────────────────────────────────────────────────

deck = shuffle(buildDeck());
setControls(false);
