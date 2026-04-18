// main.js — Game state, flow control, UI rendering

import {
  createDeck, shuffleDeck, handTotal, isSoft,
  isBust, isBlackjack, isPair, handLabel, cardDisplay
} from './blackjack.js';
import { setApiKey, getBetDecision, getInsuranceDecision, getActionDecision, getAdvisorRecommendation } from './llm.js';
import { Analytics } from './analytics.js';
import { renderHeatmap } from './strategy.js';

// ── Constants ──────────────────────────────────────────────────────────────

const OPENAI_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
const MIN_BET = 10;

// ── State ──────────────────────────────────────────────────────────────────

let deck = [];
let analytics = null;

const state = {
  phase: 'setup',
  players: [],
  dealer: null
};

// ── DOM helpers ────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);

function addLog(msg) {
  // Logging to console only — game log panel replaced by AI Advisor
  console.log('[GameLog]', msg);
}

function updateAdvisor(recommendation) {
  const contentEl = $('advisor-content');
  if (!contentEl) return;
  const div = document.createElement('div');
  div.className = 'advisor-recommendation';
  div.innerHTML = `<div class="rec-header">Advisor</div><div class="rec-body">${recommendation}</div>`;
  contentEl.replaceChildren(div);
}

async function requestAdvisorUpdate() {
  const human = state.players.find(p => p.isHuman);
  if (!human) return;

  const dealerUp = state.dealer?.hands?.[0]?.cards?.[0] || null;
  const playerHands = human.hands || [];
  const currentBet = playerHands[0]?.bet || 0;

  // Use the first AI player's model for the advisor, or fall back to gpt-4o-mini
  const advisorModel = state.players.find(p => !p.isHuman && !p.isDealer)?.model || 'gpt-4o-mini';

  const gameState = {
    dealerUpCard: dealerUp,
    playerHands,
    currentBankroll: human.bankroll,
    currentBet,
    deckCount: 1
  };

  try {
    const recommendation = await getAdvisorRecommendation(gameState, null, advisorModel);
    updateAdvisor(recommendation);
  } catch (e) {
    console.error('[Advisor] requestAdvisorUpdate error:', e);
  }
}

function showPhase(phase) {
  ['setup-panel', 'game-area', 'bet-controls', 'action-controls', 'insurance-controls', 'next-hand-controls'].forEach(id => {
    const e = $(id);
    if (e) e.classList.add('hidden');
  });
  if (phase === 'setup')     $('setup-panel').classList.remove('hidden');
  if (phase === 'game')      $('game-area').classList.remove('hidden');
  if (phase === 'betting') { $('game-area').classList.remove('hidden'); $('bet-controls').classList.remove('hidden'); }
  if (phase === 'action')  { $('game-area').classList.remove('hidden'); $('action-controls').classList.remove('hidden'); }
  if (phase === 'insurance') { $('game-area').classList.remove('hidden'); $('insurance-controls').classList.remove('hidden'); }
}

// ── Card rendering ─────────────────────────────────────────────────────────

function renderCard(card, faceDown = false) {
  const div = document.createElement('div');
  div.className = 'card';
  if (faceDown) { div.classList.add('face-down'); div.textContent = '🂠'; return div; }
  div.classList.add((card.suit === '♥' || card.suit === '♦') ? 'red' : 'black');
  div.innerHTML = `<span class="rank">${card.rank}</span><span class="suit">${card.suit}</span>`;
  return div;
}

// ── Player zone rendering ──────────────────────────────────────────────────

const STATUS_CLASSES = {
  'Thinking...': 'status-thinking', 'Blackjack': 'status-blackjack',
  'Bust': 'status-bust', 'Win': 'status-win', 'Loss': 'status-loss',
  'Push': 'status-push', 'Bust Out': 'status-bustout', 'Surrender': 'status-surrender'
};

function renderPlayerZone(player) {
  const zone = $(`zone-${player.id}`);
  if (!zone) return;

  const handsEl = zone.querySelector('.player-hands');
  if (handsEl) handsEl.innerHTML = '';

  const brEl = zone.querySelector('.bankroll');
  if (brEl && player.bankroll !== null) brEl.textContent = `$${player.bankroll}`;

  player.hands.forEach((hand, hIdx) => {
    const handWrap = document.createElement('div');
    handWrap.className = 'hand-wrap';

    // Cards
    const handDiv = document.createElement('div');
    handDiv.className = 'hand';
    const faceDown = player.isDealer && state.phase !== 'resolution' ? 1 : -1;
    hand.cards.forEach((card, i) => handDiv.appendChild(renderCard(card, i === faceDown)));
    handWrap.appendChild(handDiv);

    // Info row
    const info = document.createElement('div');
    info.className = 'hand-info';
    const totalEl = document.createElement('span');
    totalEl.className = 'hand-total';
    totalEl.textContent = hand.label || handLabel(hand.cards);
    info.appendChild(totalEl);

    if (hand.status) {
      const badge = document.createElement('span');
      badge.className = `status-badge ${STATUS_CLASSES[hand.status] || 'status-neutral'}`;
      badge.textContent = hand.status;
      info.appendChild(badge);
    }

    if (!player.isDealer && hand.bet) {
      const betEl = document.createElement('span');
      betEl.className = 'hand-bet';
      betEl.textContent = `Bet: $${hand.bet}`;
      info.appendChild(betEl);
    }
    handWrap.appendChild(info);

    if (player.hands.length > 1) {
      const lbl = document.createElement('div');
      lbl.className = 'split-label';
      lbl.textContent = `Hand ${hIdx + 1}`;
      handWrap.prepend(lbl);
    }

    if (handsEl) handsEl.appendChild(handWrap);
  });

  if (!player.isHuman && !player.isDealer) {
    const reasoningEl = zone.querySelector('.ai-reasoning-text');
    if (reasoningEl && player.lastReasoning) reasoningEl.textContent = player.lastReasoning;

    if (analytics) {
      const statsEl = zone.querySelector('.player-stats');
      const stats = analytics.getStats(player.name);
      if (stats && statsEl) statsEl.textContent = `W:${stats.wins} L:${stats.losses} P:${stats.pushes} (${stats.winRate}% WR)`;
      const dq = analytics.getDecisionQuality(player.name);
      if (dq && dq.total > 0) {
        const dqEl = zone.querySelector('.decision-quality');
        if (dqEl) dqEl.textContent = `Strategy: ${dq.correct}/${dq.total} (${dq.accuracy})`;
      }
      const colors = { ai1: '#60a5fa', ai2: '#f472b6' };
      analytics.renderChart(`chart-${player.id}`, player.name, colors[player.id]);
    }
  }
}

function renderAll() {
  state.players.forEach(renderPlayerZone);
  if (state.dealer) renderPlayerZone(state.dealer);
}

// ── Setup panel ────────────────────────────────────────────────────────────

function buildSetupPanel() {
  [$('ai1-model'), $('ai2-model')].forEach((sel, i) => {
    sel.innerHTML = '';
    OPENAI_MODELS.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m; opt.textContent = m;
      sel.appendChild(opt);
    });
    sel.value = OPENAI_MODELS[i];
  });
}

function buildGameArea() {
  if ($('zone-dealer')) return;
  $('game-area').innerHTML = `
    <div class="table-layout">
      ${playerZoneHTML({ id: 'dealer', isDealer: true })}
      ${playerZoneHTML({ id: 'ai1', isAI: true })}
      ${playerZoneHTML({ id: 'ai2', isAI: true })}
      ${playerZoneHTML({ id: 'human', isHuman: true })}
    </div>`;
}

function playerZoneHTML({ id, isDealer, isAI, isHuman }) {
  const aiExtras = isAI ? `
    <div class="explain-toggle" id="explain-toggle-${id}">
      <button class="explain-btn active" data-level="basic" data-player="${id}">Basic</button>
      <button class="explain-btn" data-level="statistical" data-player="${id}">Statistical</button>
      <button class="explain-btn" data-level="in-depth" data-player="${id}">In-depth</button>
    </div>
    <details class="ai-reasoning" open><summary>Reasoning</summary><p class="ai-reasoning-text">—</p></details>
    <canvas id="chart-${id}" class="bankroll-chart" width="120" height="40"></canvas>
    <canvas id="heatmap-${id}" class="strategy-heatmap" width="220" height="120"></canvas>` : '';
  return `
    <div class="player-zone" id="zone-${id}">
      <div class="player-header">
        <span class="player-name" id="name-${id}">—</span>
        ${!isDealer ? '<span class="bankroll">$1000</span>' : ''}
        ${isAI ? '<span class="player-stats"></span><span class="decision-quality"></span>' : ''}
      </div>
      <div class="player-hands"></div>
      ${aiExtras}
    </div>`;
}

function updateZoneNames() {
  state.players.forEach(p => {
    const nameEl = $(`name-${p.id}`);
    if (nameEl) nameEl.textContent = p.isHuman ? 'You' : `${p.name} (${p.model})`;
  });
  const dn = $('name-dealer'); if (dn) dn.textContent = 'Dealer';
}

// ── Game setup ─────────────────────────────────────────────────────────────

function startGame() {
  const ai1Name  = $('ai1-name').value.trim() || 'Agent Alpha';
  const ai2Name  = $('ai2-name').value.trim() || 'Agent Beta';
  const ai1Model = $('ai1-model').value;
  const ai2Model = $('ai2-model').value;
  const bankroll = parseInt($('starting-bankroll').value, 10) || 1000;

  if (ai1Model === ai2Model) { $('model-warning').classList.remove('hidden'); return; }
  $('model-warning').classList.add('hidden');

  state.players = [
    { id: 'ai1',   name: ai1Name, model: ai1Model, bankroll, hands: [], history: [], isHuman: false, isDealer: false, explainLevel: 'basic' },
    { id: 'ai2',   name: ai2Name, model: ai2Model, bankroll, hands: [], history: [], isHuman: false, isDealer: false, explainLevel: 'basic' },
    { id: 'human', name: 'You',   model: null,      bankroll, hands: [], history: [], isHuman: true,  isDealer: false }
  ];
  state.dealer = { id: 'dealer', name: 'Dealer', model: null, bankroll: null, hands: [], isDealer: true, history: [] };

  analytics = new Analytics([ai1Name, ai2Name, 'You']);
  buildGameArea();
  updateZoneNames();
  showPhase('game');
  addLog('=== Game started ===');
  startHand();
}

// ── Hand setup ─────────────────────────────────────────────────────────────

function freshHand() {
  return { cards: [], bet: 0, status: '', label: '', splitCount: 0, fromSplit: false, _aceSplit: false };
}

async function startHand() {
  deck = shuffleDeck(createDeck());

  state.players.forEach(p => {
    p.hands = [freshHand()];
    if (p.bankroll <= 0) p.hands[0].status = 'Bust Out';
  });
  state.dealer.hands = [freshHand()];
  state.phase = 'betting';

  $('next-hand-controls').classList.add('hidden');
  renderAll();
  addLog('--- Betting ---');

  // AI bets
  for (const p of state.players.filter(p => !p.isHuman && p.bankroll > 0)) {
    p.hands[0].status = 'Thinking...';
    renderPlayerZone(p);
    try {
      const { amount, reasoning } = await getBetDecision(p.name, p.model, p.bankroll, MIN_BET, p.history.slice(-3), p.explainLevel || 'basic');
      p.hands[0].bet = amount;
      p.bankroll -= amount;          // deduct bet immediately
      p.lastReasoning = reasoning;
      addLog(`${p.name} bets $${amount}`);
    } catch {
      const amount = MIN_BET;
      p.hands[0].bet = amount;
      p.bankroll -= amount;
      p.lastReasoning = 'No API response — placing minimum bet';
      addLog(`${p.name} bets $${amount} (fallback)`);
    }
    p.hands[0].status = '';
    renderPlayerZone(p);
  }

  // Human bet
  const human = state.players.find(p => p.isHuman);
  if (human.bankroll <= 0) {
    dealCards();
    return;
  }
  $('bet-input').max   = human.bankroll;
  $('bet-input').value = Math.min(MIN_BET, human.bankroll);
  showPhase('betting');
  renderAll();
}

function confirmHumanBet() {
  const human = state.players.find(p => p.isHuman);
  const bet = parseInt($('bet-input').value, 10);
  if (isNaN(bet) || bet < MIN_BET || bet > human.bankroll) {
    alert(`Bet must be between $${MIN_BET} and $${human.bankroll}`);
    return;
  }
  human.hands[0].bet = bet;
  human.bankroll -= bet;             // deduct bet immediately
  addLog(`You bet $${bet}`);
  showPhase('game');
  dealCards();
}

// ── Deal ───────────────────────────────────────────────────────────────────

function dealCards() {
  addLog('--- Dealing ---');
  const allPlayers = [...state.players.filter(p => p.bankroll >= 0 && p.hands[0].status !== 'Bust Out'), state.dealer];

  for (let i = 0; i < 2; i++) {
    for (const p of allPlayers) p.hands[0].cards.push(deck.pop());
  }

  [...state.players, state.dealer].forEach(p => {
    p.hands.forEach(h => { h.label = handLabel(h.cards); });
  });

  state.players.filter(p => p.hands[0].status !== 'Bust Out').forEach(p => {
    addLog(`${p.name}: ${p.hands[0].cards.map(cardDisplay).join(' ')} (${p.hands[0].label})`);
  });
  addLog(`Dealer shows: ${cardDisplay(state.dealer.hands[0].cards[0])}`);

  renderAll();
  requestAdvisorUpdate();
  checkInsurance();
}

// ── Insurance ──────────────────────────────────────────────────────────────

async function checkInsurance() {
  const dealerUp = state.dealer.hands[0].cards[0];
  if (dealerUp.rank !== 'A') { checkDealerBlackjack(); return; }

  addLog('Dealer shows Ace — insurance offered');

  for (const p of state.players.filter(p => !p.isHuman && p.bankroll > 0)) {
    p.hands[0].status = 'Thinking...';
    renderPlayerZone(p);
    try {
      const { take, amount, reasoning } = await getInsuranceDecision(
        p.name, p.model, p.bankroll, p.hands[0].bet, p.hands[0], p.history.slice(-3), p.explainLevel || 'basic'
      );
      p.lastReasoning = reasoning;
      if (take && amount > 0) {
        const ins = Math.min(amount, Math.floor(p.hands[0].bet / 2), p.bankroll);
        p.hands[0].insuranceBet = ins;
        p.bankroll -= ins;
        addLog(`${p.name} takes insurance: $${ins}`);
      } else {
        addLog(`${p.name} declines insurance`);
      }
    } catch { p.lastReasoning = 'No API response — declining insurance'; addLog(`${p.name} declines insurance (error)`); }
    p.hands[0].status = '';
    renderPlayerZone(p);
  }

  const human = state.players.find(p => p.isHuman);
  if (human.bankroll > 0) {
    $('insurance-max').textContent = Math.floor(human.hands[0].bet / 2);
    showPhase('insurance');
  } else {
    checkDealerBlackjack();
  }
}

function humanInsuranceYes() {
  const human = state.players.find(p => p.isHuman);
  const maxIns = Math.floor(human.hands[0].bet / 2);
  if (maxIns > 0 && human.bankroll >= maxIns) {
    human.hands[0].insuranceBet = maxIns;
    human.bankroll -= maxIns;
    addLog(`You take insurance: $${maxIns}`);
  }
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
  const dealerBJ = isBlackjack(dealerHand.cards);

  if (dealerBJ) {
    dealerHand.status = 'Blackjack';
    state.phase = 'resolution';
    addLog('Dealer has Blackjack!');

    state.players.forEach(p => {
      // Insurance payout on main hand
      const ins = p.hands[0].insuranceBet;
      if (ins) {
        p.bankroll += ins * 3;  // return insurance bet + 2:1 win
        addLog(`${p.name} insurance wins $${ins * 2}`);
      }
      // Resolve every hand
      p.hands.forEach(hand => {
        if (hand.status === 'Bust Out') return;
        if (isBlackjack(hand.cards)) {
          hand.status = 'Push';
          p.bankroll += hand.bet;  // return bet (was deducted at placement)
          addLog(`${p.name}: Push (both Blackjack)`);
          recordHistory(p, 'push', 0);
        } else {
          hand.status = 'Loss';
          addLog(`${p.name}: Loss`);
          recordHistory(p, 'loss', -hand.bet);
        }
      });
    });

    renderAll();
    endHand();
    return;
  }

  // No dealer BJ — insurance bets are lost (already deducted on placement)
  state.players.forEach(p => {
    if (p.hands[0].insuranceBet) addLog(`${p.name} insurance loses $${p.hands[0].insuranceBet}`);
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
  if (firstAction && bankroll >= hand.bet)                                             actions.push('double');
  const canResplit = hand.cards[0]?.rank !== 'A' && (hand.splitCount || 0) < 3;
  if (firstAction && isPair(hand.cards) && bankroll >= hand.bet && (!hand.fromSplit || canResplit)) actions.push('split');
  if (firstAction && !hand.fromSplit)                                                  actions.push('surrender');
  return actions;
}

async function startActionPhase() {
  state.phase = 'action';
  addLog('--- Actions ---');
  requestAdvisorUpdate();

  for (const p of state.players.filter(p => p.hands[0].status !== 'Bust Out')) {
    // Use index-based while loop so newly inserted split hands are played automatically
    let hIdx = 0;
    while (hIdx < p.hands.length) {
      const hand = p.hands[hIdx];

      // Natural blackjack (non-split) — no action needed
      if (!hand.fromSplit && isBlackjack(hand.cards)) {
        hand.status = 'Blackjack';
        addLog(`${p.name}: Blackjack!`);
        hIdx++;
        continue;
      }

      // Ace-split hand: one card already dealt, cannot hit
      if (hand._aceSplit) {
        hand.label = handLabel(hand.cards);
        hIdx++;
        continue;
      }

      if (p.isHuman) {
        await humanTurn(p, hIdx);
      } else {
        await aiTurn(p, hIdx);
      }
      hIdx++;
    }
  }

  dealerTurn();
}

// ── Split ──────────────────────────────────────────────────────────────────

async function doSplit(player, handIdx) {
  const hand = player.hands[handIdx];
  const isAceSplit = hand.cards[0].rank === 'A';

  // Take second card from hand, deal each hand a new card
  const card2 = hand.cards.pop();
  hand.cards.push(deck.pop());
  hand.fromSplit = true;
  hand.splitCount = (hand.splitCount || 0) + 1;
  hand._aceSplit = isAceSplit;

  const newHand = {
    cards: [card2, deck.pop()],
    bet: hand.bet,
    status: '',
    label: '',
    splitCount: hand.splitCount,
    fromSplit: true,
    _aceSplit: isAceSplit
  };

  player.bankroll -= hand.bet;      // deduct second bet
  player.hands.splice(handIdx + 1, 0, newHand);

  hand.label    = handLabel(hand.cards);
  newHand.label = handLabel(newHand.cards);
  addLog(`${player.name} splits — now ${player.hands.length} hands`);
  renderPlayerZone(player);
}

// ── AI turn ────────────────────────────────────────────────────────────────

async function aiTurn(player, handIdx) {
  const hand     = player.hands[handIdx];
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
      const splitInfo = hand.fromSplit ? { index: handIdx, total: player.hands.length } : null;
      ({ action, reasoning } = await getActionDecision(
        player.name, player.model, player.bankroll,
        { cards: hand.cards, label: hand.label },
        dealerUp, legalActions, hand.bet, splitInfo, player.explainLevel || 'basic'
      ));
    } catch { action = 'stand'; reasoning = 'Error — defaulting to stand'; }

    player.lastReasoning = reasoning;

    if (analytics) {
      const total = handTotal(hand.cards);
      const soft = isSoft(hand.cards);
      const pair = isPair(hand.cards);
      const handType = pair ? 'pair' : soft ? 'soft' : 'hard';
      const pairRank = pair ? hand.cards[0].rank : undefined;
      analytics.recordDecision(player.name, total, dealerUp.rank, action, handType, pairRank);
    }

    addLog(`${player.name} hand ${handIdx + 1}: ${action}`);

    const _ht = hand.fromSplit ? 'hard' : (isPair(hand.cards) ? 'pair' : (isSoft(hand.cards) ? 'soft' : 'hard'));
    const _totalOrRank = _ht === 'pair' ? hand.cards[0].rank : handTotal(hand.cards);
    renderHeatmap(`heatmap-${player.id}`, _totalOrRank, state.dealer.hands[0].cards[0].rank, action, _ht);

    if (action === 'hit') {
      hand.cards.push(deck.pop());
      hand.label = handLabel(hand.cards);
      hand.status = '';
      firstAction = false;
      renderPlayerZone(player);
    } else if (action === 'stand') {
      hand.status = 'Stand';
      break;
    } else if (action === 'double') {
      player.bankroll -= hand.bet;
      hand.bet *= 2;
      hand.cards.push(deck.pop());
      hand.label = handLabel(hand.cards);
      hand.status = isBust(hand.cards) ? 'Bust' : 'Double';
      renderPlayerZone(player);
      break;
    } else if (action === 'split') {
      await doSplit(player, handIdx);
      if (hand._aceSplit) return;   // ace split: this hand is done
      firstAction = true;           // new 2-card hand, can double/split again
    } else if (action === 'surrender') {
      player.bankroll += Math.floor(hand.bet / 2);
      hand.status = 'Surrender';
      addLog(`${player.name} surrenders, recovers $${Math.floor(hand.bet / 2)}`);
      renderPlayerZone(player);
      return;
    } else {
      break;
    }
  }
  renderPlayerZone(player);
}

// ── Human turn ─────────────────────────────────────────────────────────────

let humanResolve = null;

async function humanTurn(player, handIdx) {
  const hand = player.hands[handIdx];
  let firstAction = true;

  while (true) {
    if (isBust(hand.cards)) { hand.status = 'Bust'; renderPlayerZone(player); return; }
    hand.label = handLabel(hand.cards);
    const legalActions = getLegalActions(hand, player.bankroll, firstAction);

    setHumanButtons(legalActions);
    showPhase('action');
    renderAll();

    const action = await waitForHumanAction();
    addLog(`You hand ${handIdx + 1}: ${action}`);

    if (action === 'hit') {
      hand.cards.push(deck.pop());
      hand.label = handLabel(hand.cards);
      hand.status = '';
      firstAction = false;
      renderPlayerZone(player);
    } else if (action === 'stand') {
      hand.status = 'Stand';
      break;
    } else if (action === 'double') {
      player.bankroll -= hand.bet;
      hand.bet *= 2;
      hand.cards.push(deck.pop());
      hand.label = handLabel(hand.cards);
      hand.status = isBust(hand.cards) ? 'Bust' : 'Double';
      renderPlayerZone(player);
      break;
    } else if (action === 'split') {
      await doSplit(player, handIdx);
      if (hand._aceSplit) return;   // ace split: this hand is done
      firstAction = true;
    } else if (action === 'surrender') {
      player.bankroll += Math.floor(hand.bet / 2);
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
  if (humanResolve) { const r = humanResolve; humanResolve = null; r(action); }
}

// ── Dealer turn ────────────────────────────────────────────────────────────

function dealerTurn() {
  state.phase = 'resolution';
  const hand = state.dealer.hands[0];
  addLog('--- Dealer ---');
  renderAll();  // reveal hole card

  while (true) {
    const total = handTotal(hand.cards);
    const soft  = isSoft(hand.cards);
    if (total < 17 || (total === 17 && soft)) {
      const card = deck.pop();
      hand.cards.push(card);
      hand.label = handLabel(hand.cards);
      addLog(`Dealer hits: ${cardDisplay(card)} (${hand.label})`);
    } else {
      break;
    }
  }

  hand.label = handLabel(hand.cards);
  if (isBust(hand.cards)) {
    hand.status = 'Bust';
    addLog(`Dealer busts at ${handTotal(hand.cards)}`);
  } else {
    addLog(`Dealer stands at ${handTotal(hand.cards)}`);
  }

  resolveHands();
}

// ── Resolution ─────────────────────────────────────────────────────────────

function resolveHands() {
  const dealerTotal = handTotal(state.dealer.hands[0].cards);
  const dealerBust  = isBust(state.dealer.hands[0].cards);
  const dealerBJ    = isBlackjack(state.dealer.hands[0].cards);

  state.players.forEach(p => {
    p.hands.forEach(hand => {
      if (['Bust Out', 'Surrender', 'Loss', 'Push', 'Win', 'Blackjack'].includes(hand.status)) return;

      if (hand.status === 'Bust' || isBust(hand.cards)) {
        hand.status = 'Bust';
        addLog(`${p.name} hand: Bust — loses $${hand.bet}`);
        recordHistory(p, 'bust', -hand.bet);
        return;
      }

      const playerTotal = handTotal(hand.cards);
      const playerBJ    = !hand.fromSplit && isBlackjack(hand.cards);

      if (playerBJ && !dealerBJ) {
        // Natural blackjack: 3:2. Split blackjack already handled as regular win (fromSplit blocks this).
        const winAmt = Math.floor(hand.bet * 1.5);
        p.bankroll += hand.bet + winAmt;   // return deducted bet + 3:2 profit
        hand.status = 'Blackjack';
        addLog(`${p.name}: Blackjack! +$${winAmt}`);
        recordHistory(p, 'blackjack', winAmt);
      } else if (hand.fromSplit && isBlackjack(hand.cards) && !dealerBJ) {
        // Split blackjack: 1:1 (not natural)
        p.bankroll += hand.bet * 2;
        hand.status = 'Win';
        addLog(`${p.name} (split BJ 1:1): +$${hand.bet}`);
        recordHistory(p, 'win', hand.bet);
      } else if (dealerBust || playerTotal > dealerTotal) {
        p.bankroll += hand.bet * 2;        // return deducted bet + 1:1 profit
        hand.status = 'Win';
        addLog(`${p.name}: Win! +$${hand.bet}`);
        recordHistory(p, 'win', hand.bet);
      } else if (playerTotal === dealerTotal) {
        p.bankroll += hand.bet;            // return deducted bet (push)
        hand.status = 'Push';
        addLog(`${p.name}: Push`);
        recordHistory(p, 'push', 0);
      } else {
        hand.status = 'Loss';              // bet already deducted, nothing to return
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
  $('next-hand-btn').textContent = allBust ? 'Restart' : 'Next Hand';
  $('next-hand-controls').classList.remove('hidden');
  $('next-hand-btn').disabled = false;
  if (allBust) addLog('=== All players bust out. Game over. ===');
}

function nextHand() {
  if (state.players.every(p => p.bankroll <= 0)) { location.reload(); return; }
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
      $('key-status').textContent = `Key loaded: ${apiKey.slice(0, 5)}...${apiKey.slice(-4)}`;
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

  $('env-upload').addEventListener('change',    e => { if (e.target.files[0]) handleEnvUpload(e.target.files[0]); });
  $('api-key-btn').addEventListener('click', () => {
    const key = $('api-key-input').value.trim();
    const status = $('api-key-status');
    if (key.startsWith('sk-') && key.length > 20) {
      setApiKey(key);
      $('key-status').textContent = `Key loaded: ${key.slice(0, 5)}...${key.slice(-4)}`;
      $('key-status').className = 'key-status ok';
      status.textContent = `Key saved: ${key.slice(0, 5)}...${key.slice(-4)}`;
      status.className = 'key-status ok';
      $('start-btn').disabled = false;
      $('api-key-input').value = '';
    } else {
      status.textContent = 'Invalid key format';
      status.className = 'key-status err';
    }
  });
  $('ai1-model').addEventListener('change',     validateModels);
  $('ai2-model').addEventListener('change',     validateModels);
  $('start-btn').addEventListener('click',      startGame);
  $('confirm-bet-btn').addEventListener('click', confirmHumanBet);
  $('insurance-yes').addEventListener('click',  humanInsuranceYes);
  $('insurance-no').addEventListener('click',   humanInsuranceNo);
  $('next-hand-btn').addEventListener('click',  nextHand);

  ['hit', 'stand', 'double', 'split', 'surrender'].forEach(a => {
    const btn = $(`btn-${a}`);
    if (btn) btn.addEventListener('click', () => humanAction(a));
  });

  document.addEventListener('click', e => {
    if (e.target.classList.contains('explain-btn')) {
      const level = e.target.dataset.level;
      const playerId = e.target.dataset.player;
      const player = state.players.find(p => p.id === playerId);
      if (player) player.explainLevel = level;
      const group = document.getElementById(`explain-toggle-${playerId}`);
      if (group) group.querySelectorAll('.explain-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.level === level);
      });
    }
  });
});

function validateModels() {
  $('model-warning').classList.toggle('hidden', $('ai1-model').value !== $('ai2-model').value);
}
