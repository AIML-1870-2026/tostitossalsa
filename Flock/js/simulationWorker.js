// Web Worker for boid simulation - runs physics off main thread

class Boid {
  constructor(x, y) {
    this.position = { x, y };
    const angle = Math.random() * Math.PI * 2;
    const speed = 5 + Math.random() * 5;
    this.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    };
    this.acceleration = { x: 0, y: 0 };
    this.maxSpeed = 20.0;
    this.maxForce = 0.8;
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

// Obstacle avoidance force
function calculateObstacleAvoidance(boid, obstacles, weight) {
  let steer = { x: 0, y: 0 };
  const lookAhead = 60; // How far ahead to look

  for (const obs of obstacles) {
    const dx = boid.position.x - obs.x;
    const dy = boid.position.y - obs.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const buffer = obs.radius + lookAhead;

    if (dist < buffer) {
      // Strength increases as boid gets closer
      const strength = (buffer - dist) / buffer;
      const force = strength * strength * weight;

      // Push away from obstacle center
      if (dist > 0) {
        steer.x += (dx / dist) * force;
        steer.y += (dy / dist) * force;
      }
    }
  }

  return steer;
}

// Attraction to cursor
function calculateAttraction(boid, target, weight) {
  if (!target) return { x: 0, y: 0 };

  const dx = target.x - boid.position.x;
  const dy = target.y - boid.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 5) return { x: 0, y: 0 };

  // Normalize and scale by weight
  return {
    x: (dx / dist) * weight,
    y: (dy / dist) * weight
  };
}

// Simulation state
let boids = [];
let obstacles = [];
let attractTarget = null;
let params = {
  separationWeight: 1.5,
  alignmentWeight: 1.0,
  cohesionWeight: 1.0,
  neighborRadius: 50,
  maxSpeed: 20.0,
  spawnRate: 10,
  obstacleAvoidance: 8.0,
  attractionWeight: 2.0
};
let width = 800;
let height = 600;
let maxBoids = 200;
let spawnAccumulator = 0;
let running = false;
let lastTime = 0;

function initObstacles() {
  obstacles = [
    { x: 200, y: 200, radius: 50 },
    { x: 600, y: 400, radius: 60 },
    { x: 400, y: 300, radius: 45 },
    { x: 150, y: 450, radius: 35 },
    { x: 650, y: 150, radius: 40 }
  ];
}

function isInsideObstacle(x, y) {
  for (const obs of obstacles) {
    const dx = x - obs.x;
    const dy = y - obs.y;
    if (dx * dx + dy * dy < (obs.radius + 10) ** 2) {
      return true;
    }
  }
  return false;
}

function spawnBoid() {
  let x, y;
  let attempts = 0;

  do {
    const spawnType = Math.random();
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
    attempts++;
  } while (isInsideObstacle(x, y) && attempts < 10);

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
    const obs = calculateObstacleAvoidance(boid, obstacles, params.obstacleAvoidance);
    const att = calculateAttraction(boid, attractTarget, params.attractionWeight);

    boid.applyForce(sep);
    boid.applyForce(ali);
    boid.applyForce(coh);
    boid.applyForce(obs);
    boid.applyForce(att);
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
      initObstacles();
      // Send obstacles once - they never change
      self.postMessage({ type: 'obstacles', obstacles: obstacles });
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

    case 'setTarget':
      attractTarget = msg.target;
      break;

    case 'clearTarget':
      attractTarget = null;
      break;

    case 'stop':
      running = false;
      break;
  }
};
