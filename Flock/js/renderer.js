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

  // Render from worker data format (x, y, vx, vy)
  renderFromData(boids, maxSpeed, obstacles = []) {
    const ctx = this.ctx;

    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw obstacles
    for (const obs of obstacles) {
      // Outer glow
      ctx.beginPath();
      ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
      ctx.shadowColor = '#ff3366';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#1a1a2e';
      ctx.fill();

      // Border
      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner highlight
      ctx.beginPath();
      ctx.arc(obs.x, obs.y, obs.radius * 0.7, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 51, 102, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.shadowBlur = 0;
    }

    // Draw all boids
    const total = boids.length;
    for (let i = 0; i < total; i++) {
      const boid = boids[i];
      const heading = Math.atan2(boid.vy, boid.vx);
      const hue = (i / total) * 360;

      ctx.save();
      ctx.translate(boid.x, boid.y);
      ctx.rotate(heading);

      ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
      ctx.shadowBlur = 6;

      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-4, 4);
      ctx.lineTo(-4, -4);
      ctx.closePath();

      ctx.fillStyle = `hsl(${hue}, 100%, 55%)`;
      ctx.fill();
      ctx.strokeStyle = `hsl(${hue}, 100%, 75%)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    }
  }
}
