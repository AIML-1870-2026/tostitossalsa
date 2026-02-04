class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  renderBoid(boid, maxSpeed) {
    const ctx = this.ctx;
    const { x, y } = boid.position;
    const heading = Math.atan2(boid.velocity.y, boid.velocity.x);

    // Color by speed
    const speed = Math.sqrt(boid.velocity.x ** 2 + boid.velocity.y ** 2);
    const speedRatio = Math.min(speed / maxSpeed, 1);
    const hue = 200 + speedRatio * 80; // Blue to cyan

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading);

    // Triangle
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-4, 4);
    ctx.lineTo(-4, -4);
    ctx.closePath();

    ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
    ctx.fill();
    ctx.strokeStyle = `hsl(${hue}, 80%, 80%)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  render(boids, maxSpeed) {
    const ctx = this.ctx;

    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw all boids
    boids.forEach(boid => this.renderBoid(boid, maxSpeed));
  }
}
