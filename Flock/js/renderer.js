class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.trailLength = 15;
    this.trails = new Map(); // Store trail history per boid index
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
      // Solid fill with glow
      ctx.beginPath();
      ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
      ctx.shadowColor = '#ff3366';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#2a1a2e';
      ctx.fill();

      // Bright border
      ctx.strokeStyle = '#ff3366';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner circle
      ctx.beginPath();
      ctx.arc(obs.x, obs.y, obs.radius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 51, 102, 0.15)';
      ctx.fill();
      ctx.strokeStyle = '#ff6699';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.shadowBlur = 0;
    }

    // Update and draw trails
    const total = boids.length;
    for (let i = 0; i < total; i++) {
      const boid = boids[i];
      const hue = (i / total) * 360;

      // Update trail history
      if (!this.trails.has(i)) {
        this.trails.set(i, []);
      }
      const trail = this.trails.get(i);
      trail.push({ x: boid.x, y: boid.y });
      if (trail.length > this.trailLength) {
        trail.shift();
      }

      // Draw trail
      ctx.shadowBlur = 0;
      for (let j = 0; j < trail.length - 1; j++) {
        const alpha = (j / trail.length) * 0.6;
        const size = 2 + (j / trail.length) * 2;
        ctx.beginPath();
        ctx.arc(trail[j].x, trail[j].y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 100%, 55%, ${alpha})`;
        ctx.fill();
      }
    }

    // Clean up trails for removed boids
    if (this.trails.size > total) {
      for (const key of this.trails.keys()) {
        if (key >= total) this.trails.delete(key);
      }
    }

    // Draw all boids
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
