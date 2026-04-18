// analytics.js — Stats tracking and chart rendering

const DEALER_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function dealerIdx(rank) {
  if (rank === 'J' || rank === 'Q' || rank === 'K') return DEALER_RANKS.indexOf('10');
  return DEALER_RANKS.indexOf(rank);
}

const HARD_STRATEGY = {
  4:  ['H','H','H','H','H','H','H','H','H','H','H','H','H'],
  5:  ['H','H','H','H','H','H','H','H','H','H','H','H','H'],
  6:  ['H','H','H','H','H','H','H','H','H','H','H','H','H'],
  7:  ['H','H','H','H','H','H','H','H','H','H','H','H','H'],
  8:  ['H','H','H','H','H','H','H','H','H','H','H','H','H'],
  9:  ['H','H','D','D','D','D','H','H','H','H','H','H','H'],
  10: ['H','D','D','D','D','D','D','D','D','H','H','H','H'],
  11: ['H','D','D','D','D','D','D','D','D','D','H','H','H'],
  12: ['H','H','H','S','S','S','H','H','H','H','H','H','H'],
  13: ['H','S','S','S','S','S','H','H','H','H','H','H','H'],
  14: ['H','S','S','S','S','S','H','H','H','H','H','H','H'],
  15: ['H','S','S','S','S','S','H','H','H','H','H','H','H'],
  16: ['H','S','S','S','S','S','H','H','H','H','H','H','H'],
  17: ['S','S','S','S','S','S','S','S','S','S','S','S','S'],
  18: ['S','S','S','S','S','S','S','S','S','S','S','S','S'],
  19: ['S','S','S','S','S','S','S','S','S','S','S','S','S'],
  20: ['S','S','S','S','S','S','S','S','S','S','S','S','S'],
  21: ['S','S','S','S','S','S','S','S','S','S','S','S','S'],
};

const SOFT_STRATEGY = {
  13: ['H','H','H','H','D','D','H','H','H','H','H','H','H'],
  14: ['H','H','H','H','D','D','H','H','H','H','H','H','H'],
  15: ['H','H','H','D','D','D','H','H','H','H','H','H','H'],
  16: ['H','H','H','D','D','D','H','H','H','H','H','H','H'],
  17: ['H','H','D','D','D','D','H','H','H','H','H','H','H'],
  18: ['H','D','D','D','D','D','S','S','H','H','H','H','H'],
  19: ['S','S','S','S','S','S','S','S','S','S','S','S','S'],
  20: ['S','S','S','S','S','S','S','S','S','S','S','S','S'],
  21: ['S','S','S','S','S','S','S','S','S','S','S','S','S'],
};

const PAIR_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function pairIdx(rank) {
  if (rank === 'J' || rank === 'Q' || rank === 'K') return PAIR_RANKS.indexOf('10');
  return PAIR_RANKS.indexOf(rank);
}

const PAIR_STRATEGY = {
  A:   ['P','P','P','P','P','P','P','P','P','P','P','P','P'],
  2:   ['H','H','P','P','P','P','P','H','H','H','H','H','H'],
  3:   ['H','H','P','P','P','P','P','H','H','H','H','H','H'],
  4:   ['H','H','H','H','P','P','H','H','H','H','H','H','H'],
  5:   ['H','D','D','D','D','D','D','D','D','H','H','H','H'],
  6:   ['H','P','P','P','P','P','H','H','H','H','H','H','H'],
  7:   ['H','P','P','P','P','P','P','H','S','H','H','H','H'],
  8:   ['P','P','P','P','P','P','P','P','P','P','P','P','P'],
  9:   ['S','P','P','P','P','P','S','P','P','S','S','S','S'],
  10:  ['S','S','S','S','S','S','S','S','S','S','S','S','S'],
};

function lookupBasicStrategy(total, dealerUpRank, handType, pairRank) {
  const dIdx = dealerIdx(dealerUpRank);
  if (handType === 'pair') {
    const normRank = (pairRank === 'J' || pairRank === 'Q' || pairRank === 'K') ? '10' : pairRank;
    const row = PAIR_STRATEGY[normRank];
    if (!row) return 'S';
    const code = row[dIdx];
    if (code === 'P') return 'split';
    if (code === 'D') return 'double';
    if (code === 'S') return 'stand';
    return 'hit';
  }
  if (handType === 'soft') {
    const clampedTotal = Math.min(Math.max(total, 13), 21);
    const row = SOFT_STRATEGY[clampedTotal];
    if (!row) return 'stand';
    const code = row[dIdx];
    if (code === 'D') return 'double';
    if (code === 'S') return 'stand';
    return 'hit';
  }
  if (total >= 17) return 'stand';
  const clampedTotal = Math.min(Math.max(total, 4), 21);
  const row = HARD_STRATEGY[clampedTotal];
  if (!row) return total >= 17 ? 'stand' : 'hit';
  const code = row[dIdx];
  if (code === 'D') return 'double';
  if (code === 'S') return 'stand';
  return 'hit';
}

export class Analytics {
  constructor(playerNames) {
    this.players = {};
    for (const name of playerNames) {
      this.players[name] = { wins: 0, losses: 0, pushes: 0, bankrollHistory: [], decisions: { total: 0, correct: 0 } };
    }
  }

  recordHand(playerName, outcome, bankroll) {
    const p = this.players[playerName];
    if (!p) return;
    if (outcome === 'win' || outcome === 'blackjack') p.wins++;
    else if (outcome === 'loss' || outcome === 'bust') p.losses++;
    else if (outcome === 'push') p.pushes++;
    p.bankrollHistory.push(bankroll);
    if (p.bankrollHistory.length > 50) p.bankrollHistory.shift();
  }

  getStats(playerName) {
    const p = this.players[playerName];
    if (!p) return null;
    const total = p.wins + p.losses + p.pushes;
    return {
      wins: p.wins,
      losses: p.losses,
      pushes: p.pushes,
      winRate: total ? ((p.wins / total) * 100).toFixed(1) : '0.0',
      bankrollHistory: [...p.bankrollHistory]
    };
  }

  recordDecision(playerName, playerTotal, dealerUpRank, action, handType, pairRank) {
    const p = this.players[playerName];
    if (!p) return;
    const optimal = lookupBasicStrategy(playerTotal, dealerUpRank, handType, pairRank);
    p.decisions.total++;
    if (action === optimal) p.decisions.correct++;
  }

  getDecisionQuality(playerName) {
    const p = this.players[playerName];
    if (!p) return null;
    const { total, correct } = p.decisions;
    const accuracy = total ? ((correct / total) * 100).toFixed(1) + '%' : '0.0%';
    return { total, correct, accuracy };
  }

  renderChart(canvasId, playerName, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const p = this.players[playerName];
    if (!p || p.bankrollHistory.length < 2) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const data = p.bankrollHistory;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    ctx.strokeStyle = color || '#4ade80';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((val - min) / range) * (h - 10) - 5;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Axis label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(`$${min}`, 2, h - 3);
    ctx.fillText(`$${max}`, 2, 10);
  }
}
