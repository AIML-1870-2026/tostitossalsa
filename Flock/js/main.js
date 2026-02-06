// Main entry point
let simulation;
let renderer;
let controls;
let chart;
let lastTime = performance.now();
let frameCount = 0;
let fps = 60;
let lastFpsUpdate = performance.now();

function init() {
  // Setup canvas
  const canvas = document.getElementById('canvas');
  canvas.width = 800;
  canvas.height = 600;

  // Setup chart canvas
  const chartCanvas = document.getElementById('chart');
  chartCanvas.width = 800;
  chartCanvas.height = 150;

  // Create simulation
  simulation = new Simulation(canvas.width, canvas.height);

  // Create renderer
  renderer = new Renderer(canvas);

  // Create controls
  controls = new Controls(simulation);

  // Create chart
  chart = new LiveChart(chartCanvas);

  // Start game loop
  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  // Update simulation
  simulation.update(deltaTime);

  // Render
  renderer.render(simulation.boids, simulation.params.maxSpeed);

  // Update stats
  updateStats(deltaTime);

  requestAnimationFrame(gameLoop);
}

function updateStats(deltaTime) {
  // Calculate FPS and stats only every 500ms to avoid expensive O(n²) calculations every frame
  frameCount++;
  const now = performance.now();
  if (now - lastFpsUpdate >= 500) {
    fps = Math.round(frameCount / ((now - lastFpsUpdate) / 1000));
    frameCount = 0;
    lastFpsUpdate = now;

    // Calculate boid stats only during this interval
    const stats = calculateStats(simulation.boids, simulation.params);
    document.getElementById('fps').textContent = fps;
    document.getElementById('boid-count').textContent = simulation.boids.length;
    document.getElementById('avg-speed').textContent = stats.avgSpeed;
    document.getElementById('avg-neighbors').textContent = stats.avgNeighbors;

    // Update chart
    chart.addDataPoint(stats.avgNeighborsRaw, stats.speedVariance, stats.compactness);
    chart.render();
  }
}

function calculateStats(boids, params) {
  if (boids.length === 0) {
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

  // Calculate center of mass
  let centerX = 0;
  let centerY = 0;

  boids.forEach(boid => {
    const speed = Math.sqrt(boid.velocity.x ** 2 + boid.velocity.y ** 2);
    totalSpeed += speed;
    speeds.push(speed);

    centerX += boid.position.x;
    centerY += boid.position.y;

    // Count neighbors
    const r2 = params.neighborRadius ** 2;
    let neighborCount = 0;
    boids.forEach(other => {
      if (other === boid) return;
      const dx = boid.position.x - other.position.x;
      const dy = boid.position.y - other.position.y;
      if (dx * dx + dy * dy < r2) neighborCount++;
    });
    totalNeighbors += neighborCount;
  });

  const avgSpeed = totalSpeed / boids.length;
  const avgNeighbors = totalNeighbors / boids.length;
  centerX /= boids.length;
  centerY /= boids.length;

  // Calculate speed variance
  let speedVariance = 0;
  speeds.forEach(speed => {
    speedVariance += (speed - avgSpeed) ** 2;
  });
  speedVariance = Math.sqrt(speedVariance / boids.length);

  // Calculate compactness (inverse of average distance from center, normalized)
  let totalDistFromCenter = 0;
  boids.forEach(boid => {
    const dx = boid.position.x - centerX;
    const dy = boid.position.y - centerY;
    totalDistFromCenter += Math.sqrt(dx * dx + dy * dy);
  });
  const avgDistFromCenter = totalDistFromCenter / boids.length;
  // Normalize: 0 = spread out (avg dist ~400), 1 = compact (avg dist ~0)
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
