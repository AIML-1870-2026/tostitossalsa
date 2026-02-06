class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  renderBoid(boid, index, totalBoids) {
    const ctx = this.ctx;
    const { x, y } = boid.position;
    const heading = Math.atan2(boid.velocity.y, boid.velocity.x);

    // Rainbow color based on boid index - full spectrum
    const hue = (index / totalBoids) * 360;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading);

    // Neon glow effect (reduced blur for better performance)
    ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
    ctx.shadowBlur = 6;

    // Triangle
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-4, 4);
    ctx.lineTo(-4, -4);
    ctx.closePath();

    // Neon fill - high saturation, bright
    ctx.fillStyle = `hsl(${hue}, 100%, 55%)`;
    ctx.fill();
    // Bright neon stroke
    ctx.strokeStyle = `hsl(${hue}, 100%, 75%)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  render(boids, maxSpeed) {
    const ctx = this.ctx;

    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw all boids with rainbow colors
    boids.forEach((boid, index) => this.renderBoid(boid, index, boids.length));
  }
}
