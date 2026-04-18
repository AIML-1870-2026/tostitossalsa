const DEALER_RANKS = ['2','3','4','5','6','7','8','9','10','A'];

function dealerIdx(rank) {
  const r = (rank === 'J' || rank === 'Q' || rank === 'K') ? '10' : rank;
  return DEALER_RANKS.indexOf(r);
}

function hardMove(total, dIdx) {
  if (total <= 8)  return 'hit';
  if (total === 9)  return (dIdx >= 1 && dIdx <= 4) ? 'double' : 'hit';
  if (total === 10) return (dIdx >= 0 && dIdx <= 7) ? 'double' : 'hit';
  if (total === 11) return (dIdx >= 0 && dIdx <= 8) ? 'double' : 'hit';
  if (total === 12) return (dIdx >= 2 && dIdx <= 4) ? 'stand' : 'hit';
  if (total <= 16)  return (dIdx >= 0 && dIdx <= 4) ? 'stand' : 'hit';
  return 'stand';
}

function softMove(total, dIdx) {
  if (total <= 14) return (dIdx >= 3 && dIdx <= 4) ? 'double' : 'hit';
  if (total <= 16) return (dIdx >= 2 && dIdx <= 4) ? 'double' : 'hit';
  if (total === 17) return (dIdx >= 1 && dIdx <= 4) ? 'double' : 'hit';
  if (total === 18) {
    if (dIdx >= 0 && dIdx <= 4) return 'double';
    if (dIdx === 5 || dIdx === 6) return 'stand';
    return 'hit';
  }
  return 'stand';
}

function pairMove(rank, dIdx) {
  const r = (rank === 'J' || rank === 'Q' || rank === 'K') ? '10' : rank;
  if (r === 'A') return 'split';
  if (r === '2' || r === '3') return (dIdx >= 0 && dIdx <= 5) ? 'split' : 'hit';
  if (r === '4') return (dIdx === 3 || dIdx === 4) ? 'split' : 'hit';
  if (r === '5') return (dIdx >= 0 && dIdx <= 7) ? 'double' : 'hit';
  if (r === '6') return (dIdx >= 0 && dIdx <= 4) ? 'split' : 'hit';
  if (r === '7') return (dIdx >= 0 && dIdx <= 5) ? 'split' : 'stand';
  if (r === '8') return 'split';
  if (r === '9') {
    if (dIdx === 5 || dIdx >= 8) return 'stand';
    return (dIdx >= 0 && dIdx <= 7) ? 'split' : 'stand';
  }
  if (r === '10') return 'stand';
  return 'stand';
}

export function getBasicStrategyMove(playerTotal, dealerUpRank, handType) {
  const dIdx = dealerIdx(dealerUpRank);
  if (handType === 'pair') return pairMove(playerTotal, dIdx);
  if (handType === 'soft') return softMove(playerTotal, dIdx);
  return hardMove(playerTotal, dIdx);
}

const ACTION_COLORS = {
  hit:       '#ef4444',
  stand:     '#22c55e',
  double:    '#f59e0b',
  split:     '#8b5cf6',
  surrender: '#6b7280'
};

function getHardRows()  { return [8,9,10,11,12,13,14,15,16,17]; }
function getSoftRows()  { return [13,14,15,16,17,18,19]; }
function getPairRows()  { return ['2','3','4','5','6','7','8','9','10','A']; }

function rowLabel(row, handType) {
  if (handType === 'soft')  return `A,${row - 11}`;
  if (handType === 'pair')  return `${row}-${row}`;
  if (row === 17)            return '17+';
  return String(row);
}

function rowMatchesTotal(row, currentTotal, handType) {
  if (handType === 'hard')  return row === Math.min(currentTotal, 17);
  if (handType === 'soft')  return row === Math.min(currentTotal, 19);
  if (handType === 'pair')  return String(row) === String((currentTotal === 'J' || currentTotal === 'Q' || currentTotal === 'K') ? '10' : currentTotal);
  return false;
}

export function renderHeatmap(canvasId, currentTotal, currentDealerUp, aiAction, handType) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, W, H);

  const rows = handType === 'soft' ? getSoftRows() : handType === 'pair' ? getPairRows() : getHardRows();
  const cols = DEALER_RANKS;

  const labelColW = 26;
  const labelRowH = 14;
  const gridW = W - labelColW;
  const gridH = H - labelRowH;
  const cellW = gridW / cols.length;
  const cellH = gridH / rows.length;

  ctx.font = '7px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  cols.forEach((col, ci) => {
    ctx.fillText(col, labelColW + ci * cellW + cellW / 2, labelRowH / 2);
  });

  rows.forEach((row, ri) => {
    ctx.textAlign = 'right';
    ctx.fillText(rowLabel(row, handType), labelColW - 2, labelRowH + ri * cellH + cellH / 2);
  });

  const normDealer = (currentDealerUp === 'J' || currentDealerUp === 'Q' || currentDealerUp === 'K') ? '10' : currentDealerUp;
  const highlightCol = cols.indexOf(normDealer);

  rows.forEach((row, ri) => {
    cols.forEach((col, ci) => {
      const move = getBasicStrategyMove(row, col, handType);
      const x = labelColW + ci * cellW;
      const y = labelRowH + ri * cellH;

      ctx.fillStyle = ACTION_COLORS[move] || '#334155';
      ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

      const isCurrentRow = rowMatchesTotal(row, currentTotal, handType);
      const isCurrentCol = ci === highlightCol;

      if (isCurrentRow && isCurrentCol) {
        const matched = aiAction === move;
        ctx.strokeStyle = matched ? '#ffffff' : '#fbbf24';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
      }
    });
  });
}
