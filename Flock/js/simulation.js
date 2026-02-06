// Force calculation functions
function calculateSeparation(boid, neighbors, weight) {
  let steer = { x: 0, y: 0 };
  let count = 0;

  neighbors.forEach(other => {
    const dx = boid.position.x - other.position.x;
    const dy = boid.position.y - other.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0 && distance < 25) {
      steer.x += (dx / distance) * (1.0 / distance);
      steer.y += (dy / distance) * (1.0 / distance);
      count++;
    }
  });

  if (count > 0) {
    steer.x = (steer.x / count) * weight;
    steer.y = (steer.y / count) * weight;
  }

  return steer;
}

function calculateAlignment(boid, neighbors, weight) {
  if (neighbors.length === 0) return { x: 0, y: 0 };

  let avgVel = { x: 0, y: 0 };
  neighbors.forEach(other => {
    avgVel.x += other.velocity.x;
    avgVel.y += other.velocity.y;
  });
  avgVel.x /= neighbors.length;
  avgVel.y /= neighbors.length;

  return {
    x: (avgVel.x - boid.velocity.x) * weight,
    y: (avgVel.y - boid.velocity.y) * weight
  };
}

function calculateCohesion(boid, neighbors, weight) {
  if (neighbors.length === 0) return { x: 0, y: 0 };

  let center = { x: 0, y: 0 };
  neighbors.forEach(other => {
    center.x += other.position.x;
    center.y += other.position.y;
  });
  center.x /= neighbors.length;
  center.y /= neighbors.length;

  return {
    x: (center.x - boid.position.x) * weight * 0.01,
    y: (center.y - boid.position.y) * weight * 0.01
  };
}

// Simulation class
class Simulation {
  constructor(canvasWidth, canvasHeight) {
    this.boids = [];
    this.params = {
      separationWeight: 1.5,
      alignmentWeight: 1.0,
      cohesionWeight: 1.0,
      neighborRadius: 50,
      maxSpeed: 4.0,
      spawnRate: 10
    };
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.maxBoids = 200;
    this.spawnAccumulator = 0;

    // Initialize with 20 boids
    for (let i = 0; i < 20; i++) {
      this.spawnBoid();
    }
  }

  spawnBoid() {
    // Random spawn location: edges or anywhere
    const spawnType = Math.random();
    let x, y;

    if (spawnType < 0.5) {
      // Spawn from edges
      const edge = Math.floor(Math.random() * 4);
      switch (edge) {
        case 0: x = 0; y = Math.random() * this.height; break;
        case 1: x = this.width; y = Math.random() * this.height; break;
        case 2: x = Math.random() * this.width; y = 0; break;
        case 3: x = Math.random() * this.width; y = this.height; break;
      }
    } else {
      // Spawn anywhere
      x = Math.random() * this.width;
      y = Math.random() * this.height;
    }

    const boid = new Boid(x, y);
    boid.maxSpeed = this.params.maxSpeed;
    this.boids.push(boid);
  }

  update(deltaTime) {
    const dt = Math.min(deltaTime, 0.05); // Cap at 50ms

    // Spawn new boids based on spawn rate
    if (this.boids.length < this.maxBoids && this.params.spawnRate > 0) {
      this.spawnAccumulator += this.params.spawnRate * dt;
      while (this.spawnAccumulator >= 1 && this.boids.length < this.maxBoids) {
        this.spawnBoid();
        this.spawnAccumulator -= 1;
      }
    }

    this.boids.forEach(boid => {
      // Update boid's maxSpeed from params
      boid.maxSpeed = this.params.maxSpeed;

      const neighbors = this.findNeighbors(boid);

      const sep = calculateSeparation(boid, neighbors, this.params.separationWeight);
      const ali = calculateAlignment(boid, neighbors, this.params.alignmentWeight);
      const coh = calculateCohesion(boid, neighbors, this.params.cohesionWeight);

      boid.applyForce(sep);
      boid.applyForce(ali);
      boid.applyForce(coh);
      boid.update(dt);

      this.wrap(boid);
    });
  }

  findNeighbors(boid) {
    const neighbors = [];
    const r2 = this.params.neighborRadius ** 2;

    this.boids.forEach(other => {
      if (other === boid) return;
      const dx = boid.position.x - other.position.x;
      const dy = boid.position.y - other.position.y;
      if (dx * dx + dy * dy < r2) neighbors.push(other);
    });

    return neighbors;
  }

  wrap(boid) {
    if (boid.position.x < 0) boid.position.x = this.width;
    if (boid.position.x > this.width) boid.position.x = 0;
    if (boid.position.y < 0) boid.position.y = this.height;
    if (boid.position.y > this.height) boid.position.y = 0;
  }

  setParam(key, value) {
    this.params[key] = value;
  }
}
