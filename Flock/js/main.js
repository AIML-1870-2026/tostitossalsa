// Main entry point
let simulation;
let renderer;
let controls;
let lastTime = performance.now();
let frameCount = 0;
let fps = 60;
let lastFpsUpdate = performance.now();

function init() {
  // Setup canvas
  const canvas = document.getElementById('canvas');
  canvas.width = 800;
  canvas.height = 600;

  // Create simulation
  simulation = new Simulation(canvas.width, canvas.height);

  // Create renderer
  renderer = new Renderer(canvas);

  // Create controls
  controls = new Controls(simulation);

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
  // Calculate FPS
  frameCount++;
  const now = performance.now();
  if (now - lastFpsUpdate >= 500) {
    fps = Math.round(frameCount / ((now - lastFpsUpdate) / 1000));
    frameCount = 0;
    lastFpsUpdate = now;
  }

  // Calculate boid stats
  const stats = calculateStats(simulation.boids, simulation.params);

  // Update display
  document.getElementById('fps').textContent = fps;
  document.getElementById('avg-speed').textContent = stats.avgSpeed;
  document.getElementById('avg-neighbors').textContent = stats.avgNeighbors;
}

function calculateStats(boids, params) {
  let totalSpeed = 0;
  let totalNeighbors = 0;

  boids.forEach(boid => {
    const speed = Math.sqrt(boid.velocity.x ** 2 + boid.velocity.y ** 2);
    totalSpeed += speed;

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

  return {
    avgSpeed: (totalSpeed / boids.length).toFixed(2),
    avgNeighbors: (totalNeighbors / boids.length).toFixed(1)
  };
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
