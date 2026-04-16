// main.js — Game state, flow control, UI rendering

import {
  createDeck, shuffleDeck, handTotal, isSoft,
  isBust, isBlackjack, isPair, handLabel, cardDisplay
} from './blackjack.js';
import { setApiKey, getApiKey, getBetDecision, getInsuranceDecision, getActionDecision } from './llm.js';
import { Analytics } from './analytics.js';

// ── Constants ──────────────────────────────────────────────────────────────

const OPENAI_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
const MIN_BET = 10;

// ── State ──────────────────────────────────────────────────────────────────

let deck = [];
let analytics = null;

const state = {
  phase: 'setup', // setup | betting | dealing | insurance | action | resolution
  players: [],    // [{ id, name, model, bankroll, hands, bet, history, isHuman, isDealer }]
  dealer: null,
  activePlayerIdx: 0,
  activeHandIdx: 0,
  insurancePhaseIdx: 0,
  log: []
};

// ── DOM helpers ────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

function addLog(msg) {
  state.log.push(msg);
  const logEl = $('game-log');
  if (!logEl) return;
  const line = el('div', 'log-line', msg);
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

function showPhase(phase) {
  ['setup-panel', 'game-area', 'bet-controls', 'action-controls', 'insurance-controls'].forEach(id => {
    const e = $(id);
    if (e) e.classList.add('hidden');
  });
  if (phase === 'setup') $('setup-panel').classList.remove('hidden');
  if (phase === 'game') $('game-area').classList.remove('hidden');
  if (phase === 'betting') {
    $('game-area').classList.remove('hidden');
    $('bet-controls').classList.remove('hidden');
  }
  if (phase === 'action') {
    $('game-area').classList.remove('hidden');
    $('action-controls').classList.remove('hidden');
  }
  if (phase === 'insurance') {
    $('game-area').classList.remove('hidden');
    $('insurance-controls').classList.remove('hidden');
  }
}

// ── Card rendering ─────────────────────────────────────────────────────────

function suitColor(suit) {
  return (suit === '♥' || suit === '♦') ? 'red' : 'black';
}

function renderCard(card, faceDown = false) {
  const div = el('div', 'card');
  if (faceDown) {
    div.classList.add('face-down');
    div.textContent = '🂠';
    return div;
  }
  div.classList.add(suitColor(card.suit));
  div.innerHTML = `<span class="rank">${card.rank}</span><span class="suit">${card.suit}</span>`;
  return div;
}

function renderHand(hand, faceDownIdx = -1) {
  const wrap = el('div', 'hand');
  hand.cards.forEach((card, i) => {
    wrap.appendChild(renderCard(card, i === faceDownIdx));
  });
  return wrap;
}

// ── Player zone rendering ──────────────────────────────────────────────────

function getStatusClass(status) {
  const map = {
    'Thinking...': 'status-thinking',
    'Blackjack': 'status-blackjack',
    'Bust': 'status-bust',
    'Win': 'status-win',
    'Loss': 'status-loss',
    'Push': 'status-push',
    'Bust Out': 'status-bustout',
    'Surrender': 'status-surrender'
  };
  return map[status] || 'status-neutral';
}

function renderPlayerZone(player) {
  const zone = $(`zone-${player.id}`);
  if (!zone) return;

  const handsEl = zone.querySelector('.player-hands');
  if (!handsEl) return;
  handsEl.innerHTML = '';

  // Bankroll
  const brEl = zone.querySelector('.bankroll');
  if (brEl) brEl.textContent = `$${player.bankroll}`;

  // Each hand
  player.hands.forEach((hand, hIdx) => {
    const handWrap = el('div', 'hand-wrap');

    // Cards
    const isDealer = player.isDealer;
    const faceDown = isDealer && state.phase !== 'resolution' ? 1 : -1;
    handWrap.appendChild(renderHand(hand, faceDown));

    // Total + status
    const info = el('div', 'hand-info');
    const total = el('span', 'hand-total', hand.label || handLabel(hand.cards));
    const statusBadge = el('span', `status-badge ${getStatusClass(hand.status || '')}`, hand.status || '');
    info.appendChild(total);
    info.appendChild(statusBadge);

    // Bet
    if (!isDealer && hand.bet !== undefined) {
      const betEl = el('span', 'hand-bet', `Bet: $${hand.bet}`);
      info.appendChild(betEl);
    }

    handWrap.appendChild(info);

    // Split label
    if (player.hands.length > 1) {
      const lbl = el('div', 'split-label', `Hand ${hIdx + 1}`);
      handWrap.prepend(lbl);
    }

    handsEl.appendChild(handWrap);
  });

  // AI reasoning
  if (!player.isHuman && !player.isDealer) {
    const reasoning = zone.querySelector('.ai-reasoning-text');
    if (reasoning && player.lastReasoning) {
      reasoning.textContent = player.lastReasoning;
    }
  }

  // Stats
  if (!player.isDealer && analytics) {
    const stats = analytics.getStats(player.name);
    const statsEl = zone.querySelector('.player-stats');
    if (stats && statsEl) {
      statsEl.textContent = `W: ${stats.wins} L: ${stats.losses} P: ${stats.pushes} (${stats.winRate}% WR)`;
    }
    const chartId = `chart-${player.id}`;
    const chartColors = { ai1: '#60a5fa', ai2: '#f472b6', human: '#4ade80' };
    analytics.renderChart(chartId, player.name, chartColors[player.id]);
  }
}

function renderAll() {
  state.players.forEach(renderPlayerZone);
  if (state.dealer) renderPlayerZone(state.dealer);
}

// ── Setup panel ────────────────────────────────────────────────────────────

function buildSetupPanel() {
  const ai1Model = $('ai1-model');
  const ai2Model = $('ai2-model');
  [ai1Model, ai2Model].forEach(sel => {
    sel.innerHTML = '';
    OPENAI_MODELS.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      sel.appendChild(opt);
    });
  });
  ai1Model.value = OPENAI_MODELS[0];
  ai2Model.value = OPENAI_MODELS[1];
}

function buildGameArea() {
  const gameArea = $('game-area');

  // Build player zones if not already present
  if ($('zone-dealer')) return;

  // Dealer zone
  gameArea.innerHTML = `
    <div class="table-layout">
      <div class="dealer-row">
        ${playerZoneHTML({ id: 'dealer', name: 'Dealer', isDealer: true })}
      </div>
      <div class="ai-row">
        ${playerZoneHTML({ id: 'ai1', name: 'AI Player 1', isAI: true })}
        ${playerZoneHTML({ id: 'ai2', name: 'AI Player 2', isAI: true })}
      </div>
      <div class="human-row">
        ${playerZoneHTML({ id: 'human', name: 'You', isHuman: true })}
      </div>
    </div>
  `;
}

function playerZoneHTML({ id, name, isDealer, isAI, isHuman }) {
  const aiExtras = isAI ? `
    <details class="ai-reasoning">
      <summary>Reasoning</summary>
      <p class="ai-reasoning-text">—</p>
    </details>
    <canvas id="chart-${id}" class="bankroll-chart" width="120" height="40"></canvas>
  ` : '';
  return `
    <div class="player-zone" id="zone-${id}">
      <div class="player-header">
        <span class="player-name" id="name-${id}">${name}</span>
        ${!isDealer ? '<span class="bankroll">$1000</span>' : ''}
        ${!isDealer ? '<span class="player-stats"></span>' : ''}
      </div>
      <div class="player-hands"></div>
      ${aiExtras}
    </div>
  `;
}

function updatePlayerZoneNames() {
  state.players.forEach(p => {
    const nameEl = $(`name-${p.id}`);
    if (nameEl) nameEl.textContent = p.isHuman ? 'You' : `${p.name}${p.model ? ` (${p.model})` : ''}`;
  });
  const dealerName = $('name-dealer');
  if (dealerName) dealerName.textContent = 'Dealer';
}

// ── Game setup ─────────────────────────────────────────────────────────────

function startGame() {
  const ai1Name = $('ai1-name').value.trim() || 'Agent Alpha';
  const ai2Name = $('ai2-name').value.trim() || 'Agent Beta';
  const ai1Model = $('ai1-model').value;
  const ai2Model = $('ai2-model').value;
  const bankroll = parseInt($('starting-bankroll').value, 10) || 1000;

  if (ai1Model === ai2Model) {
    $('model-warning').classList.remove('hidden');
    return;
  }
  $('model-warning').classList.add('hidden');

  state.players = [
    { id: 'ai1', name: ai1Name, model: ai1Model, bankroll, hands: [], history: [], isHuman: false, isDealer: false },
    { id: 'ai2', name: ai2Name, model: ai2Model, bankroll, hands: [], history: [], isHuman: false, isDealer: false },
    { id: 'human', name: 'You', model: null, bankroll, hands: [], history: [], isHuman: true, isDealer: false }
  ];
  state.dealer = { id: 'dealer', name: 'Dealer', model: null, bankroll: null, hands: [], isDealer: true };

  analytics = new Analytics([ai1Name, ai2Name, 'You']);

  buildGameArea();
  updatePlayerZoneNames();
  showPhase('game');
  addLog('--- Game started ---');

  startHand();
}

// ── Hand flow ──────────────────────────────────────────────────────────────

function newHand(player) {
  player.hands = [{ cards: [], bet: 0, status: '', label: '', splitCount: 0, fromSplit: false }];
}

async function startHand() {
  deck = shuffleDeck(createDeck());

  state.players.forEach(p => {
    newHand(p);
    if (p.bankroll <= 0) p.hands[0].status = 'Bust Out';
  });
  newHand(state.dealer);

  renderAll();

  // Betting phase
  state.phase = 'betting';
  addLog('--- Betting phase ---');

  // AI bets
  for (const p of state.players.filter(p => !p.isHuman && p.bankroll > 0)) {
    p.hands[0].status = 'Thinking...';
    renderPlayerZone(p);
    try {
      const { amount, reasoning } = await getBetDecision(p.name, p.model, p.bankroll, MIN_BET, p.history.slice(-3));
      p.hands[0].bet = amount;
      p.lastReasoning = reasoning;
      p.hands[0].status = '';
      addLog(`${p.name} bets $${amount}`);
    } catch (err) {
      p.hands[0].bet = MIN_BET;
      addLog(`${p.name} bets $${MIN_BET} (fallback)`);
    }
    renderPlayerZone(p);
  }

  // Human bet
  showPhase('betting');
  const humanPlayer = state.players.find(p => p.isHuman);
  $('bet-input').max = humanPlayer.bankroll;
  $('bet-input').value = Math.min(MIN_BET, humanPlayer.bankroll);
  renderAll();
}

function confirmHumanBet() {
  const humanPlayer = state.players.find(p => p.isHuman);
  if (humanPlayer.bankroll <= 0) {
    dealCards();
    return;
  }
  const bet = parseInt($('bet-input').value, 10);
  if (isNaN(bet) || bet < MIN_BET || bet > humanPlayer.bankroll) {
    alert(`Bet must be between $${MIN_BET} and $${humanPlayer.bankroll}`);
    return;
  }
  humanPlayer.hands[0].bet = bet;
  addLog(`You bet $${bet}`);
  dealCards();
}

function dealCards() {
  showPhase('game');
  addLog('--- Dealing ---');

  const allPlayers = [...state.players.filter(p => p.bankroll > 0), state.dealer];

  // Two cards each
  for (let i = 0; i < 2; i++) {
    for (const p of allPlayers) {
      const card = deck.pop();
      p.hands[0].cards.push(card);
    }
  }

  // Update labels
  [...state.players, state.dealer].forEach(p => {
    p.hands.forEach(h => { h.label = handLabel(h.cards); });
  });

  // Log dealt hands
  state.players.filter(p => p.bankroll > 0).forEach(p => {
    addLog(`${p.name}: ${p.hands[0].cards.map(cardDisplay).join(' ')} (${handLabel(p.hands[0].cards)})`);
  });
  addLog(`Dealer shows: ${cardDisplay(state.dealer.hands[0].cards[0])}`);

  renderAll();
  checkInsurance();
}

// ── Insurance ──────────────────────────────────────────────────────────────

async function checkInsurance() {
  const dealerUp = state.dealer.hands[0].cards[0];
  if (dealerUp.rank !== 'A') {
    checkDealerBlackjack();
    return;
  }

  addLog('Dealer shows Ace — insurance offered');
  state.phase = 'insurance';
  state.insurancePhaseIdx = 0;

  // AI insurance decisions
  for (const p of state.players.filter(p => !p.isHuman && p.bankroll > 0)) {
    p.hands[0].status = 'Thinking...';
    renderPlayerZone(p);
    try {
      const { take, amount, reasoning } = await getInsuranceDecision(
        p.name, p.model, p.bankroll, p.hands[0].bet, p.hands[0], p.history.slice(-3)
      );
      p.lastReasoning = reasoning;
      if (take && amount > 0) {
        p.hands[0].insuranceBet = amount;
        p.bankroll -= amount;
        addLog(`${p.name} takes insurance: $${amount}`);
      } else {
        addLog(`${p.name} declines insurance`);
      }
    } catch {
      addLog(`${p.name} declines insurance (error)`);
    }
    p.hands[0].status = '';
    renderPlayerZone(p);
  }

  // Human insurance
  const humanPlayer = state.players.find(p => p.isHuman);
  if (humanPlayer.bankroll > 0) {
    showPhase('insurance');
    $('insurance-max').textContent = Math.floor(humanPlayer.hands[0].bet / 2);
  } else {
    checkDealerBlackjack();
  }
}

function humanInsuranceYes() {
  const humanPlayer = state.players.find(p => p.isHuman);
  const maxIns = Math.floor(humanPlayer.hands[0].bet / 2);
  humanPlayer.hands[0].insuranceBet = maxIns;
  humanPlayer.bankroll -= maxIns;
  addLog(`You take insurance: $${maxIns}`);
  showPhase('game');
  checkDealerBlackjack();
}

function humanInsuranceNo() {
  addLog('You decline insurance');
  showPhase('game');
  checkDealerBlackjack();
}

// ── Dealer blackjack check ─────────────────────────────────────────────────

function checkDealerBlackjack() {
  const dealerHand = state.dealer.hands[0];
  if (isBlackjack(dealerHand.cards)) {
    dealerHand.status = 'Blackjack';
    addLog('Dealer has Blackjack!');

    // Resolve insurance and hands
    state.players.filter(p => p.bankroll > 0 || p.hands[0].insuranceBet).forEach(p => {
      const hand = p.hands[0];

      // Insurance payout
      if (hand.insuranceBet) {
        const win = hand.insuranceBet * 2;
        p.bankroll += win + hand.insuranceBet;
        addLog(`${p.name} insurance wins $${win}`);
      }

      // Hand resolution
      if (isBlackjack(hand.cards)) {
        hand.status = 'Push';
        p.bankroll += hand.bet;
        addLog(`${p.name}: Push (both Blackjack)`);
        recordHistory(p, 'push', 0);
      } else {
        hand.status = 'Loss';
        addLog(`${p.name}: Loss`);
        recordHistory(p, 'loss', -hand.bet);
      }
    });

    state.phase = 'resolution';
    renderAll();
    endHand();
    return;
  }

  // No dealer blackjack — insurance bets lost
  state.players.forEach(p => {
    if (p.hands[0].insuranceBet) {
      addLog(`${p.name} insurance loses $${p.hands[0].insuranceBet}`);
    }
  });

  startActionPhase();
}

// ── Action phase ───────────────────────────────────────────────────────────

function recordHistory(player, outcome, delta) {
  player.history.push({ outcome, amount: Math.abs(delta) });
  if (player.history.length > 10) player.history.shift();
  if (analytics) analytics.recordHand(player.name, outcome, player.bankroll);
}

function getLegalActions(hand, bankroll, firstAction) {
  const actions = ['hit', 'stand'];
  if (firstAction && bankroll >= hand.bet) actions.push('double');
  const canResplit = hand.cards[0].rank !== 'A' && (hand.splitCount || 0) < 3;
  if (firstAction && isPair(hand.cards) && bankroll >= hand.bet && (!hand.fromSplit || canResplit)) actions.push('split');
  if (firstAction && !hand.fromSplit) actions.push('surrender');
  return actions;
}

async function startActionPhase() {
  state.phase = 'action';
  addLog('--- Action phase ---');

  const activePlayers = state.players.filter(p => p.bankroll > 0);

  for (const p of activePlayers) {
    for (let hIdx = 0; hIdx < p.hands.length; hIdx++) {
      const hand = p.hands[hIdx];
      if (hand.status === 'Bust Out') continue;

      // Check for natural blackjack (non-split hand)
      if (!hand.fromSplit && isBlackjack(hand.cards)) {
        hand.status = 'Blackjack';
        addLog(`${p.name}: Blackjack!`);
        continue;
      }

      if (p.isHuman) {
        await humanTurn(p, hIdx);
      } else {
        await aiTurn(p, hIdx);
      }
    }
  }

  dealerTurn();
}

async function aiTurn(player, handIdx) {
  const hand = player.hands[handIdx];
  const dealerUp = state.dealer.hands[0].cards[0];
  let firstAction = true;

  while (true) {
    if (isBust(hand.cards)) { hand.status = 'Bust'; break; }

    hand.label = handLabel(hand.cards);
    const legalActions = getLegalActions(hand, player.bankroll, firstAction);

    hand.status = 'Thinking...';
    renderPlayerZone(player);

    let action, reasoning;
    try {
      const splitInfo = hand.fromSplit
        ? { index: handIdx, total: player.hands.length }
        : null;
      ({ action, reasoning } = await getActionDecision(
        player.name, player.model, player.bankroll,
        { cards: hand.cards, label: hand.label },
        dealerUp, legalActions, hand.bet, splitInfo
      ));
    } catch {
      action = 'stand';
      reasoning = 'Error — defaulting to stand';
    }

    player.lastReasoning = reasoning;
    hand.status = action.charAt(0).toUpperCase() + action.slice(1);
    addLog(`${player.name} hand ${handIdx + 1}: ${action}`);

    if (action === 'hit') {
      hand.cards.push(deck.pop());
      hand.label = handLabel(hand.cards);
      firstAction = false;
      renderPlayerZone(player);
    } else if (action === 'stand') {
      break;
    } else if (action === 'double') {
      player.bankroll -= hand.bet;
      hand.bet *= 2;
      hand.cards.push(deck.pop());
      hand.label = handLabel(hand.cards);
      if (isBust(hand.cards)) hand.status = 'Bust';
      renderPlayerZone(player);
      break;
    } else if (action === 'split') {
      await doSplit(player, handIdx);
      return;
    } else if (action === 'surrender') {
      const refund = Math.floor(hand.bet / 2);
      player.bankroll += refund;
      hand.status = 'Surrender';
      addLog(`${player.name} surrenders, recovers $${refund}`);
      renderPlayerZone(player);
      return;
    } else {
      break;
    }
  }

  renderPlayerZone(player);
}

async function doSplit(player, handIdx) {
  const hand = player.hands[handIdx];
  const card2 = hand.cards.pop();
  const newHand = {
    cards: [card2, deck.pop()],
    bet: hand.bet,
    status: '',
    label: '',
    splitCount: (hand.splitCount || 0) + 1,
    fromSplit: true
  };
  hand.cards.push(deck.pop());
  hand.fromSplit = true;
  player.bankroll -= hand.bet;

  player.hands.splice(handIdx + 1, 0, newHand);
  addLog(`${player.name} splits hand ${handIdx + 1}`);

  // Aces split: one card each, cannot hit
  const isAceSplit = hand.cards[0].rank === 'A';

  hand.label = handLabel(hand.cards);
  newHand.label = handLabel(newHand.cards);
  renderPlayerZone(player);

  // Play each split hand
  if (!isAceSplit) {
    if (player.isHuman) {
      await humanTurn(player, handIdx);
      await humanTurn(player, handIdx + 1);
    } else {
      await aiTurn(player, handIdx);
      await aiTurn(player, handIdx + 1);
    }
  }
}

// ── Human turn ─────────────────────────────────────────────────────────────

let humanResolve = null;

async function humanTurn(player, handIdx) {
  const hand = player.hands[handIdx];
  const dealerUp = state.dealer.hands[0].cards[0];

  while (true) {
    if (isBust(hand.cards)) { hand.status = 'Bust'; renderPlayerZone(player); return; }
    hand.label = handLabel(hand.cards);

    const firstAction = !hand._acted;
    const legalActions = getLegalActions(hand, player.bankroll, firstAction);

    setHumanButtons(legalActions);
    showPhase('action');
    renderAll();

    const action = await waitForHumanAction();
    hand._acted = true;

    addLog(`You hand ${handIdx + 1}: ${action}`);

    if (action === 'hit') {
      hand.cards.push(deck.pop());
      hand.label = handLabel(hand.cards);
      renderPlayerZone(player);
    } else if (action === 'stand') {
      hand.status = 'Stand';
      break;
    } else if (action === 'double') {
      player.bankroll -= hand.bet;
      hand.bet *= 2;
      hand.cards.push(deck.pop());
      hand.label = handLabel(hand.cards);
      if (isBust(hand.cards)) hand.status = 'Bust';
      renderPlayerZone(player);
      break;
    } else if (action === 'split') {
      await doSplit(player, handIdx);
      return;
    } else if (action === 'surrender') {
      const refund = Math.floor(hand.bet / 2);
      player.bankroll += refund;
      hand.status = 'Surrender';
      renderPlayerZone(player);
      return;
    }
  }

  renderPlayerZone(player);
  showPhase('game');
}

function waitForHumanAction() {
  return new Promise(resolve => { humanResolve = resolve; });
}

function setHumanButtons(legalActions) {
  ['hit', 'stand', 'double', 'split', 'surrender'].forEach(a => {
    const btn = $(`btn-${a}`);
    if (btn) btn.disabled = !legalActions.includes(a);
  });
}

function humanAction(action) {
  if (humanResolve) {
    const resolve = humanResolve;
    humanResolve = null;
    resolve(action);
  }
}

// ── Dealer turn ────────────────────────────────────────────────────────────

function dealerTurn() {
  const hand = state.dealer.hands[0];
  addLog('--- Dealer turn ---');

  // Reveal hole card
  state.phase = 'resolution';
  renderAll();

  while (true) {
    const total = handTotal(hand.cards);
    const soft = isSoft(hand.cards);
    // Hit on 16 or below, and soft 17
    if (total < 17 || (total === 17 && soft)) {
      hand.cards.push(deck.pop());
      hand.label = handLabel(hand.cards);
      addLog(`Dealer hits: ${cardDisplay(hand.cards[hand.cards.length - 1])} (${hand.label})`);
    } else {
      break;
    }
  }

  const dealerTotal = handTotal(hand.cards);
  hand.label = handLabel(hand.cards);
  if (isBust(hand.cards)) {
    hand.status = 'Bust';
    addLog(`Dealer busts at ${dealerTotal}`);
  } else {
    hand.status = '';
    addLog(`Dealer stands at ${dealerTotal}`);
  }

  resolveHands();
}

// ── Resolution ─────────────────────────────────────────────────────────────

function resolveHands() {
  const dealerTotal = handTotal(state.dealer.hands[0].cards);
  const dealerBust = isBust(state.dealer.hands[0].cards);

  state.players.filter(p => p.bankroll !== null).forEach(p => {
    p.hands.forEach(hand => {
      if (hand.status === 'Bust Out' || hand.status === 'Surrender' || hand.status === 'Loss') return;

      const playerTotal = handTotal(hand.cards);
      const playerBust = isBust(hand.cards);
      const playerBJ = !hand.fromSplit && isBlackjack(hand.cards);
      const dealerBJ = isBlackjack(state.dealer.hands[0].cards);

      if (hand.status === 'Bust') {
        addLog(`${p.name}: Bust — loses $${hand.bet}`);
        recordHistory(p, 'bust', -hand.bet);
        return;
      }

      if (playerBust) {
        hand.status = 'Bust';
        addLog(`${p.name}: Bust`);
        recordHistory(p, 'bust', -hand.bet);
        return;
      }

      if (playerBJ && !dealerBJ) {
        const winAmt = Math.floor(hand.bet * 1.5);
        p.bankroll += hand.bet + winAmt;
        hand.status = 'Blackjack';
        addLog(`${p.name}: Blackjack! Wins $${winAmt}`);
        recordHistory(p, 'blackjack', winAmt);
      } else if (dealerBust || playerTotal > dealerTotal) {
        p.bankroll += hand.bet * 2;
        hand.status = 'Win';
        addLog(`${p.name}: Win! +$${hand.bet}`);
        recordHistory(p, 'win', hand.bet);
      } else if (playerTotal === dealerTotal) {
        p.bankroll += hand.bet;
        hand.status = 'Push';
        addLog(`${p.name}: Push`);
        recordHistory(p, 'push', 0);
      } else {
        hand.status = 'Loss';
        addLog(`${p.name}: Loss -$${hand.bet}`);
        recordHistory(p, 'loss', -hand.bet);
      }
    });
  });

  renderAll();
  endHand();
}

function endHand() {
  const allBust = state.players.every(p => p.bankroll <= 0);
  if (allBust) {
    addLog('--- All players bust out. Game over. ---');
    $('next-hand-btn').textContent = 'Restart';
  }
  $('next-hand-btn').classList.remove('hidden');
  $('next-hand-btn').disabled = false;
}

function nextHand() {
  const allBust = state.players.every(p => p.bankroll <= 0);
  if (allBust) {
    location.reload();
    return;
  }
  $('next-hand-btn').classList.add('hidden');
  startHand();
}

// ── API Key handling ────────────────────────────────────────────────────────

function parseEnvFile(content) {
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key === 'OPENAI_API_KEY' && val) return val;
  }
  return null;
}

function handleEnvUpload(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const apiKey = parseEnvFile(e.target.result);
    if (apiKey) {
      setApiKey(apiKey);
      const masked = apiKey.slice(0, 5) + '...' + apiKey.slice(-4);
      $('key-status').textContent = `Key loaded: ${masked}`;
      $('key-status').className = 'key-status ok';
      $('start-btn').disabled = false;
    } else {
      $('key-status').textContent = 'No OPENAI_API_KEY found in file';
      $('key-status').className = 'key-status err';
    }
  };
  reader.readAsText(file);
}

// ── Init ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  buildSetupPanel();
  showPhase('setup');

  $('env-upload').addEventListener('change', e => {
    if (e.target.files[0]) handleEnvUpload(e.target.files[0]);
  });

  $('ai1-model').addEventListener('change', validateModels);
  $('ai2-model').addEventListener('change', validateModels);

  $('start-btn').addEventListener('click', startGame);
  $('confirm-bet-btn').addEventListener('click', confirmHumanBet);
  $('insurance-yes').addEventListener('click', humanInsuranceYes);
  $('insurance-no').addEventListener('click', humanInsuranceNo);
  $('next-hand-btn').addEventListener('click', nextHand);

  ['hit', 'stand', 'double', 'split', 'surrender'].forEach(a => {
    const btn = $(`btn-${a}`);
    if (btn) btn.addEventListener('click', () => humanAction(a));
  });
});

function validateModels() {
  const m1 = $('ai1-model').value;
  const m2 = $('ai2-model').value;
  $('model-warning').classList.toggle('hidden', m1 !== m2);
}
