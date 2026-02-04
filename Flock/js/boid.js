class Boid {
  constructor(x, y) {
    this.position = { x, y };
    // Start with random velocity scaled to maxSpeed
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 2;
    this.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    };
    this.acceleration = { x: 0, y: 0 };
    this.maxSpeed = 4.0;
    this.maxForce = 0.2;
  }

  applyForce(force) {
    this.acceleration.x += force.x;
    this.acceleration.y += force.y;
  }

  update() {
    // Update velocity
    this.velocity.x += this.acceleration.x;
    this.velocity.y += this.acceleration.y;

    // Limit speed
    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    if (speed > this.maxSpeed) {
      this.velocity.x = (this.velocity.x / speed) * this.maxSpeed;
      this.velocity.y = (this.velocity.y / speed) * this.maxSpeed;
    }

    // Update position directly (velocity = pixels per frame)
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Reset acceleration
    this.acceleration.x = 0;
    this.acceleration.y = 0;
  }
}
