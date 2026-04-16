// analytics.js — Stats tracking and chart rendering

export class Analytics {
  constructor(playerNames) {
    this.players = {};
    for (const name of playerNames) {
      this.players[name] = { wins: 0, losses: 0, pushes: 0, bankrollHistory: [] };
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
