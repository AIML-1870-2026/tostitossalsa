// Web Worker for boid simulation - runs physics off main thread

class Boid {
  constructor(x, y) {
    this.position = { x, y };
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 20;
    this.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    };
    this.acceleration = { x: 0, y: 0 };
    this.maxSpeed = 60.0;
    this.maxForce = 2.5;
  }

  applyForce(force) {
    this.acceleration.x += force.x;
    this.acceleration.y += force.y;
  }

  update() {
    this.velocity.x += this.acceleration.x;
    this.velocity.y += this.acceleration.y;

    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    if (speed > this.maxSpeed) {
      this.velocity.x = (this.velocity.x / speed) * this.maxSpeed;
      this.velocity.y = (this.velocity.y / speed) * this.maxSpeed;
    }

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    this.acceleration.x = 0;
    this.acceleration.y = 0;
  }
}

function calculateSeparation(boid, neighbors, weight) {
  let steer = { x: 0, y: 0 };
  let count = 0;

  for (const other of neighbors) {
    const dx = boid.position.x - other.position.x;
    const dy = boid.position.y - other.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0 && distance < 25) {
      steer.x += (dx / distance) * (1.0 / distance);
      steer.y += (dy / distance) * (1.0 / distance);
      count++;
    }
  }

  if (count > 0) {
    steer.x = (steer.x / count) * weight;
    steer.y = (steer.y / count) * weight;
  }

  return steer;
}

function calculateAlignment(boid, neighbors, weight) {
  if (neighbors.length === 0) return { x: 0, y: 0 };

  let avgVel = { x: 0, y: 0 };
  for (const other of neighbors) {
    avgVel.x += other.velocity.x;
    avgVel.y += other.velocity.y;
  }
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
  for (const other of neighbors) {
    center.x += other.position.x;
    center.y += other.position.y;
  }
  center.x /= neighbors.length;
  center.y /= neighbors.length;

  return {
    x: (center.x - boid.position.x) * weight * 0.01,
    y: (center.y - boid.position.y) * weight * 0.01
  };
}

// Simulation state
let boids = [];
let params = {
  separationWeight: 1.5,
  alignmentWeight: 1.0,
  cohesionWeight: 1.0,
  neighborRadius: 50,
  maxSpeed: 60.0,
  spawnRate: 10
};
let width = 800;
let height = 600;
let maxBoids = 200;
let spawnAccumulator = 0;
let running = false;
let lastTime = 0;

function spawnBoid() {
  const spawnType = Math.random();
  let x, y;

  if (spawnType < 0.5) {
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0: x = 0; y = Math.random() * height; break;
      case 1: x = width; y = Math.random() * height; break;
      case 2: x = Math.random() * width; y = 0; break;
      case 3: x = Math.random() * width; y = height; break;
    }
  } else {
    x = Math.random() * width;
    y = Math.random() * height;
  }

  const boid = new Boid(x, y);
  boid.maxSpeed = params.maxSpeed;
  boids.push(boid);
}

function findNeighbors(boid) {
  const neighbors = [];
  const r2 = params.neighborRadius ** 2;

  for (const other of boids) {
    if (other === boid) continue;
    const dx = boid.position.x - other.position.x;
    const dy = boid.position.y - other.position.y;
    if (dx * dx + dy * dy < r2) neighbors.push(other);
  }

  return neighbors;
}

function wrap(boid) {
  if (boid.position.x < 0) boid.position.x = width;
  if (boid.position.x > width) boid.position.x = 0;
  if (boid.position.y < 0) boid.position.y = height;
  if (boid.position.y > height) boid.position.y = 0;
}

function update(deltaTime) {
  const dt = Math.min(deltaTime, 0.05);

  // Spawn new boids
  if (boids.length < maxBoids && params.spawnRate > 0) {
    spawnAccumulator += params.spawnRate * dt;
    while (spawnAccumulator >= 1 && boids.length < maxBoids) {
      spawnBoid();
      spawnAccumulator -= 1;
    }
  }

  // Update each boid
  for (const boid of boids) {
    boid.maxSpeed = params.maxSpeed;

    const neighbors = findNeighbors(boid);
    const sep = calculateSeparation(boid, neighbors, params.separationWeight);
    const ali = calculateAlignment(boid, neighbors, params.alignmentWeight);
    const coh = calculateCohesion(boid, neighbors, params.cohesionWeight);

    boid.applyForce(sep);
    boid.applyForce(ali);
    boid.applyForce(coh);
    boid.update();
    wrap(boid);
  }
}

function sendBoidData() {
  // Send boid positions and velocities to main thread
  const data = boids.map(b => ({
    x: b.position.x,
    y: b.position.y,
    vx: b.velocity.x,
    vy: b.velocity.y
  }));

  self.postMessage({ type: 'update', boids: data, params: params });
}

function simulationLoop() {
  if (!running) return;

  const now = performance.now();
  const deltaTime = (now - lastTime) / 1000;
  lastTime = now;

  update(deltaTime);
  sendBoidData();

  // Run at ~120fps for smooth physics
  setTimeout(simulationLoop, 1000 / 120);
}

// Handle messages from main thread
self.onmessage = function(e) {
  const msg = e.data;

  switch (msg.type) {
    case 'init':
      width = msg.width;
      height = msg.height;
      boids = [];
      for (let i = 0; i < 20; i++) {
        spawnBoid();
      }
      running = true;
      lastTime = performance.now();
      simulationLoop();
      break;

    case 'setParam':
      params[msg.key] = msg.value;
      break;

    case 'stop':
      running = false;
      break;
  }
};
