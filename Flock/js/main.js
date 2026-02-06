// Main entry point - rendering on main thread, simulation in worker
let worker;
let renderer;
let controls;
let chart;
let latestBoids = [];
let latestParams = {};
let latestObstacles = [];
let frameCount = 0;
let fps = 60;
let lastFpsUpdate = performance.now();

// Simulation proxy object for controls compatibility
const simulationProxy = {
  params: {
    separationWeight: 1.5,
    alignmentWeight: 1.0,
    cohesionWeight: 1.0,
    neighborRadius: 50,
    maxSpeed: 20.0,
    spawnRate: 10
  },
  setParam(key, value) {
    this.params[key] = value;
    worker.postMessage({ type: 'setParam', key, value });
  }
};

function init() {
  // Setup canvas
  const canvas = document.getElementById('canvas');
  canvas.width = 800;
  canvas.height = 600;

  // Setup chart canvas
  const chartCanvas = document.getElementById('chart');
  chartCanvas.width = 800;
  chartCanvas.height = 150;

  // Create renderer
  renderer = new Renderer(canvas);

  // Create chart
  chart = new LiveChart(chartCanvas);

  // Create and start worker
  worker = new Worker('js/simulationWorker.js');

  worker.onmessage = function(e) {
    if (e.data.type === 'obstacles') {
      // Obstacles sent once at init - they never move
      latestObstacles = e.data.obstacles;
    } else if (e.data.type === 'update') {
      latestBoids = e.data.boids;
      latestParams = e.data.params;
    }
  };

  worker.postMessage({
    type: 'init',
    width: canvas.width,
    height: canvas.height
  });

  // Create controls (uses simulationProxy)
  controls = new Controls(simulationProxy);

  // Start render loop (decoupled from simulation)
  requestAnimationFrame(renderLoop);
}

function renderLoop() {
  // Render latest boid data and obstacles
  renderer.renderFromData(latestBoids, latestParams.maxSpeed || 20, latestObstacles);

  // Update stats
  updateStats();

  requestAnimationFrame(renderLoop);
}

function updateStats() {
  frameCount++;
  const now = performance.now();

  if (now - lastFpsUpdate >= 500) {
    fps = Math.round(frameCount / ((now - lastFpsUpdate) / 1000));
    frameCount = 0;
    lastFpsUpdate = now;

    const stats = calculateStats(latestBoids, latestParams);
    document.getElementById('fps').textContent = fps;
    document.getElementById('boid-count').textContent = latestBoids.length;
    document.getElementById('avg-speed').textContent = stats.avgSpeed;
    document.getElementById('avg-neighbors').textContent = stats.avgNeighbors;

    chart.addDataPoint(stats.avgNeighborsRaw, stats.speedVariance, stats.compactness);
    chart.render();
  }
}

function calculateStats(boids, params) {
  if (!boids || boids.length === 0) {
    return {
      avgSpeed: '0.00',
      avgNeighbors: '0.0',
      avgNeighborsRaw: 0,
      speedVariance: 0,
      compactness: 0
    };
  }

  let totalSpeed = 0;
  let totalNeighbors = 0;
  const speeds = [];
  const neighborRadius = params.neighborRadius || 50;

  let centerX = 0;
  let centerY = 0;

  for (const boid of boids) {
    const speed = Math.sqrt(boid.vx ** 2 + boid.vy ** 2);
    totalSpeed += speed;
    speeds.push(speed);

    centerX += boid.x;
    centerY += boid.y;

    const r2 = neighborRadius ** 2;
    let neighborCount = 0;
    for (const other of boids) {
      if (other === boid) continue;
      const dx = boid.x - other.x;
      const dy = boid.y - other.y;
      if (dx * dx + dy * dy < r2) neighborCount++;
    }
    totalNeighbors += neighborCount;
  }

  const avgSpeed = totalSpeed / boids.length;
  const avgNeighbors = totalNeighbors / boids.length;
  centerX /= boids.length;
  centerY /= boids.length;

  let speedVariance = 0;
  for (const speed of speeds) {
    speedVariance += (speed - avgSpeed) ** 2;
  }
  speedVariance = Math.sqrt(speedVariance / boids.length);

  let totalDistFromCenter = 0;
  for (const boid of boids) {
    const dx = boid.x - centerX;
    const dy = boid.y - centerY;
    totalDistFromCenter += Math.sqrt(dx * dx + dy * dy);
  }
  const avgDistFromCenter = totalDistFromCenter / boids.length;
  const maxDist = 400;
  const compactness = Math.max(0, 1 - avgDistFromCenter / maxDist);

  return {
    avgSpeed: avgSpeed.toFixed(2),
    avgNeighbors: avgNeighbors.toFixed(1),
    avgNeighborsRaw: avgNeighbors,
    speedVariance: speedVariance,
    compactness: compactness
  };
}

document.addEventListener('DOMContentLoaded', init);
