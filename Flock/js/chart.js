class LiveChart {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.maxDataPoints = 100;

    // Data series
    this.series = {
      neighbors: { data: [], color: '#667eea', label: 'Avg Neighbors' },
      speedVar: { data: [], color: '#f093fb', label: 'Speed Variance' },
      compactness: { data: [], color: '#4facfe', label: 'Compactness' }
    };

    // Chart settings
    this.padding = { top: 30, right: 15, bottom: 25, left: 45 };
  }

  addDataPoint(neighbors, speedVariance, compactness) {
    // Normalize values to 0-1 range for display
    this.series.neighbors.data.push(Math.min(neighbors / 20, 1));
    this.series.speedVar.data.push(Math.min(speedVariance / 4, 1));
    this.series.compactness.data.push(Math.min(compactness, 1));

    // Keep only last maxDataPoints
    Object.values(this.series).forEach(s => {
      if (s.data.length > this.maxDataPoints) {
        s.data.shift();
      }
    });
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const p = this.padding;
    const chartW = w - p.left - p.right;
    const chartH = h - p.top - p.bottom;

    // Clear
    ctx.fillStyle = '#12121a';
    ctx.fillRect(0, 0, w, h);

    // Draw grid
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = p.top + (chartH * i / 4);
      ctx.beginPath();
      ctx.moveTo(p.left, y);
      ctx.lineTo(w - p.right, y);
      ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const y = p.top + (chartH * i / 4);
      const value = (1 - i / 4).toFixed(1);
      ctx.fillText(value, p.left - 5, y);
    }

    // Draw each series
    Object.values(this.series).forEach(series => {
      if (series.data.length < 2) return;

      ctx.strokeStyle = series.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      series.data.forEach((value, i) => {
        const x = p.left + (i / (this.maxDataPoints - 1)) * chartW;
        const y = p.top + (1 - value) * chartH;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    });

    // Draw legend
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    let legendX = p.left;
    const legendY = 12;

    Object.values(this.series).forEach(series => {
      // Color box
      ctx.fillStyle = series.color;
      ctx.fillRect(legendX, legendY - 5, 12, 10);

      // Label
      ctx.fillStyle = '#ccc';
      ctx.fillText(series.label, legendX + 16, legendY);

      legendX += ctx.measureText(series.label).width + 30;
    });

    // Border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(p.left, p.top, chartW, chartH);
  }
}
