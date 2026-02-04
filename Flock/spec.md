# Flock Lab: Emergence Playground - Technical Specification

**Version:** 1.0 (Basic Features Only)  
**Last Updated:** February 4, 2026  
**Status:** Draft

---

## 1. Overview

### 1.1 Project Summary

An educational web-based simulation where users explore emergent flocking behavior by adjusting parameters in real-time.

**Core Concept:** Players discover how simple local rules (separation, alignment, cohesion) create complex coordinated motion without a leader.

**Platform:** Browser-based, single HTML page, no backend required  
**Target:** Students, educators, curious learners (ages 12+)  
**Tech:** HTML5 Canvas + Vanilla JavaScript

---

## 2. Core Features (MVP)

### Sandbox Mode
- Real-time simulation of 100 boids
- 5 adjustable parameter sliders
- 3 preset buttons (Flock, Chaos, Cluster)
- Live statistics display

### Visual Feedback
- Boids rendered as triangles
- Color indicates speed
- Dark background with optional grid

### Educational Elements
- Tooltips explaining each parameter
- Real-time stats showing system behavior

---

## 3. Technical Architecture

### 3.1 Technology Stack

```
Frontend Only:
├── HTML5 Canvas 2D
├── Vanilla JavaScript (ES6+)
├── CSS3
└── No dependencies, no build step

Storage:
└── None required for MVP
```

### 3.2 File Structure

```
/flock-lab
├── index.html          # Main page
├── css/
│   └── style.css       # All styling
├── js/
│   ├── boid.js         # Boid class
│   ├── simulation.js   # Update loop
│   ├── renderer.js     # Canvas drawing
│   ├── controls.js     # UI event handlers
│   └── main.js         # Entry point
└── README.md
```

---

## 4. Boid Simulation

### 4.1 Boid Class

```javascript
class Boid {
  constructor(x, y) {
    this.position = { x, y }
    this.velocity = { 
      x: (Math.random() - 0.5) * 2, 
      y: (Math.random() - 0.5) * 2 
    }
    this.acceleration = { x: 0, y: 0 }
    this.maxSpeed = 4.0
    this.maxForce = 0.1
  }
  
  applyForce(force) {
    this.acceleration.x += force.x
    this.acceleration.y += force.y
  }
  
  update(dt) {
    // Update velocity
    this.velocity.x += this.acceleration.x * dt
    this.velocity.y += this.acceleration.y * dt
    
    // Limit speed
    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2)
    if (speed > this.maxSpeed) {
      this.velocity.x = (this.velocity.x / speed) * this.maxSpeed
      this.velocity.y = (this.velocity.y / speed) * this.maxSpeed
    }
    
    // Update position
    this.position.x += this.velocity.x * dt
    this.position.y += this.velocity.y * dt
    
    // Reset acceleration
    this.acceleration.x = 0
    this.acceleration.y = 0
  }
}
```

### 4.2 Three Forces

**Separation:** Avoid crowding
```javascript
function calculateSeparation(boid, neighbors, weight) {
  let steer = { x: 0, y: 0 }
  let count = 0
  
  neighbors.forEach(other => {
    const dx = boid.position.x - other.position.x
    const dy = boid.position.y - other.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance > 0 && distance < 25) {
      steer.x += (dx / distance) * (1.0 / distance)
      steer.y += (dy / distance) * (1.0 / distance)
      count++
    }
  })
  
  if (count > 0) {
    steer.x = (steer.x / count) * weight
    steer.y = (steer.y / count) * weight
  }
  
  return steer
}
```

**Alignment:** Match neighbor velocities
```javascript
function calculateAlignment(boid, neighbors, weight) {
  if (neighbors.length === 0) return { x: 0, y: 0 }
  
  let avgVel = { x: 0, y: 0 }
  neighbors.forEach(other => {
    avgVel.x += other.velocity.x
    avgVel.y += other.velocity.y
  })
  avgVel.x /= neighbors.length
  avgVel.y /= neighbors.length
  
  return {
    x: (avgVel.x - boid.velocity.x) * weight,
    y: (avgVel.y - boid.velocity.y) * weight
  }
}
```

**Cohesion:** Steer toward group center
```javascript
function calculateCohesion(boid, neighbors, weight) {
  if (neighbors.length === 0) return { x: 0, y: 0 }
  
  let center = { x: 0, y: 0 }
  neighbors.forEach(other => {
    center.x += other.position.x
    center.y += other.position.y
  })
  center.x /= neighbors.length
  center.y /= neighbors.length
  
  return {
    x: (center.x - boid.position.x) * weight * 0.01,
    y: (center.y - boid.position.y) * weight * 0.01
  }
}
```

### 4.3 Main Simulation Loop

```javascript
class Simulation {
  constructor(canvasWidth, canvasHeight) {
    this.boids = []
    this.params = {
      separationWeight: 1.5,
      alignmentWeight: 1.0,
      cohesionWeight: 1.0,
      neighborRadius: 50,
      maxSpeed: 4.0
    }
    this.width = canvasWidth
    this.height = canvasHeight
    
    // Initialize 100 boids
    for (let i = 0; i < 100; i++) {
      this.boids.push(new Boid(
        Math.random() * canvasWidth,
        Math.random() * canvasHeight
      ))
    }
  }
  
  update(deltaTime) {
    const dt = Math.min(deltaTime, 0.05) // Cap at 50ms
    
    this.boids.forEach(boid => {
      const neighbors = this.findNeighbors(boid)
      
      const sep = calculateSeparation(boid, neighbors, this.params.separationWeight)
      const ali = calculateAlignment(boid, neighbors, this.params.alignmentWeight)
      const coh = calculateCohesion(boid, neighbors, this.params.cohesionWeight)
      
      boid.applyForce(sep)
      boid.applyForce(ali)
      boid.applyForce(coh)
      boid.update(dt)
      
      this.wrap(boid)
    })
  }
  
  findNeighbors(boid) {
    const neighbors = []
    const r2 = this.params.neighborRadius ** 2
    
    this.boids.forEach(other => {
      if (other === boid) return
      const dx = boid.position.x - other.position.x
      const dy = boid.position.y - other.position.y
      if (dx * dx + dy * dy < r2) neighbors.push(other)
    })
    
    return neighbors
  }
  
  wrap(boid) {
    if (boid.position.x < 0) boid.position.x = this.width
    if (boid.position.x > this.width) boid.position.x = 0
    if (boid.position.y < 0) boid.position.y = this.height
    if (boid.position.y > this.height) boid.position.y = 0
  }
}
```

---

## 5. User Interface

### 5.1 Layout

```
┌────────────────────────────────┐
│      Canvas (800x600)          │
│   [Boids moving in real-time]  │
└────────────────────────────────┘
┌────────────────────────────────┐
│      Controls Panel            │
│  Separation  [===|---] 1.5     │
│  Alignment   [===|---] 1.0     │
│  Cohesion    [===|---] 1.0     │
│  Neighbor R  [===|---] 50      │
│  Max Speed   [===|---] 4.0     │
│                                │
│  [🐦 Flock] [🌪 Chaos] [🧲 Cluster] │
└────────────────────────────────┘
┌────────────────────────────────┐
│      Stats Panel               │
│  FPS: 60 | Boids: 100          │
│  Avg Speed: 2.3 | Neighbors: 7 │
└────────────────────────────────┘
```

### 5.2 Parameters

```javascript
const PARAMS = {
  separationWeight: {
    min: 0, max: 5, default: 1.5, step: 0.1,
    label: 'Separation',
    tooltip: 'Avoid crowding neighbors'
  },
  alignmentWeight: {
    min: 0, max: 3, default: 1.0, step: 0.1,
    label: 'Alignment',
    tooltip: 'Match nearby velocities'
  },
  cohesionWeight: {
    min: 0, max: 3, default: 1.0, step: 0.1,
    label: 'Cohesion',
    tooltip: 'Move toward group center'
  },
  neighborRadius: {
    min: 10, max: 150, default: 50, step: 5,
    label: 'Neighbor Radius',
    tooltip: 'Detection distance'
  },
  maxSpeed: {
    min: 1, max: 8, default: 4.0, step: 0.5,
    label: 'Max Speed',
    tooltip: 'Maximum velocity'
  }
}
```

### 5.3 Presets

```javascript
const PRESETS = {
  flock: {
    separationWeight: 1.5,
    alignmentWeight: 1.0,
    cohesionWeight: 1.0,
    neighborRadius: 50,
    maxSpeed: 4.0
  },
  chaos: {
    separationWeight: 3.0,
    alignmentWeight: 0.1,
    cohesionWeight: 0.1,
    neighborRadius: 20,
    maxSpeed: 5.0
  },
  cluster: {
    separationWeight: 0.5,
    alignmentWeight: 0.3,
    cohesionWeight: 2.5,
    neighborRadius: 80,
    maxSpeed: 3.0
  }
}
```

### 5.4 Preset Animation

When a preset is clicked, smoothly animate sliders to target values over 800ms.

```javascript
function animateToPreset(targetParams) {
  const startParams = { ...currentParams }
  const startTime = performance.now()
  const duration = 800
  
  function animate() {
    const elapsed = performance.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = easeInOutCubic(progress)
    
    Object.keys(targetParams).forEach(key => {
      currentParams[key] = lerp(startParams[key], targetParams[key], eased)
      updateSlider(key, currentParams[key])
    })
    
    if (progress < 1) requestAnimationFrame(animate)
  }
  
  animate()
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
```

---

## 6. Rendering

### 6.1 Canvas Setup

```javascript
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
canvas.width = 800
canvas.height = 600
```

### 6.2 Draw Boids

```javascript
function renderBoid(ctx, boid) {
  const { x, y } = boid.position
  const heading = Math.atan2(boid.velocity.y, boid.velocity.x)
  
  // Color by speed
  const speed = Math.sqrt(boid.velocity.x ** 2 + boid.velocity.y ** 2)
  const speedRatio = Math.min(speed / 4.0, 1)
  const hue = 200 + speedRatio * 80 // Blue to cyan
  
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(heading)
  
  // Triangle
  ctx.beginPath()
  ctx.moveTo(8, 0)
  ctx.lineTo(-4, 4)
  ctx.lineTo(-4, -4)
  ctx.closePath()
  
  ctx.fillStyle = `hsl(${hue}, 70%, 60%)`
  ctx.fill()
  ctx.strokeStyle = `hsl(${hue}, 80%, 80%)`
  ctx.lineWidth = 1
  ctx.stroke()
  
  ctx.restore()
}

function render(boids) {
  // Clear
  ctx.fillStyle = '#0a0a0f'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // Draw all boids
  boids.forEach(boid => renderBoid(ctx, boid))
}
```

### 6.3 Game Loop

```javascript
let lastTime = performance.now()

function gameLoop() {
  const currentTime = performance.now()
  const deltaTime = (currentTime - lastTime) / 1000
  lastTime = currentTime
  
  simulation.update(deltaTime)
  render(simulation.boids)
  updateStats()
  
  requestAnimationFrame(gameLoop)
}

gameLoop()
```

---

## 7. Statistics

### 7.1 Calculate Stats

```javascript
function calculateStats(boids, params) {
  let totalSpeed = 0
  let totalNeighbors = 0
  
  boids.forEach(boid => {
    const speed = Math.sqrt(boid.velocity.x ** 2 + boid.velocity.y ** 2)
    totalSpeed += speed
    
    const neighbors = findNeighbors(boid, boids, params.neighborRadius)
    totalNeighbors += neighbors.length
  })
  
  return {
    avgSpeed: (totalSpeed / boids.length).toFixed(2),
    avgNeighbors: (totalNeighbors / boids.length).toFixed(1)
  }
}
```

### 7.2 Display Stats

```javascript
function updateStats() {
  const stats = calculateStats(simulation.boids, simulation.params)
  
  document.getElementById('fps').textContent = getFPS()
  document.getElementById('avg-speed').textContent = stats.avgSpeed
  document.getElementById('avg-neighbors').textContent = stats.avgNeighbors
}
```

---

## 8. HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Flock Lab</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="app">
    <canvas id="canvas"></canvas>
    
    <div id="controls">
      <div class="parameter">
        <label>Separation</label>
        <input type="range" id="separation" min="0" max="5" step="0.1" value="1.5">
        <span class="value">1.5</span>
      </div>
      <div class="parameter">
        <label>Alignment</label>
        <input type="range" id="alignment" min="0" max="3" step="0.1" value="1.0">
        <span class="value">1.0</span>
      </div>
      <div class="parameter">
        <label>Cohesion</label>
        <input type="range" id="cohesion" min="0" max="3" step="0.1" value="1.0">
        <span class="value">1.0</span>
      </div>
      <div class="parameter">
        <label>Neighbor Radius</label>
        <input type="range" id="radius" min="10" max="150" step="5" value="50">
        <span class="value">50</span>
      </div>
      <div class="parameter">
        <label>Max Speed</label>
        <input type="range" id="speed" min="1" max="8" step="0.5" value="4.0">
        <span class="value">4.0</span>
      </div>
      
      <div class="presets">
        <button data-preset="flock">🐦 Flock</button>
        <button data-preset="chaos">🌪 Chaos</button>
        <button data-preset="cluster">🧲 Cluster</button>
      </div>
    </div>
    
    <div id="stats">
      <span>FPS: <b id="fps">60</b></span>
      <span>Boids: <b>100</b></span>
      <span>Avg Speed: <b id="avg-speed">0</b></span>
      <span>Avg Neighbors: <b id="avg-neighbors">0</b></span>
    </div>
  </div>
  
  <script src="js/boid.js"></script>
  <script src="js/simulation.js"></script>
  <script src="js/renderer.js"></script>
  <script src="js/controls.js"></script>
  <script src="js/main.js"></script>
</body>
</html>
```

---

## 9. CSS Styling

```css
body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #0a0a0f;
  color: #e0e0e0;
}

#app {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

#canvas {
  border: 1px solid #333;
  background: #0a0a0f;
}

#controls {
  width: 800px;
  margin-top: 20px;
  padding: 20px;
  background: #1a1a2e;
  border-radius: 8px;
}

.parameter {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.parameter label {
  width: 150px;
  font-size: 14px;
}

.parameter input[type="range"] {
  flex: 1;
  margin: 0 10px;
}

.parameter .value {
  width: 50px;
  text-align: right;
  font-family: monospace;
}

.presets {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.presets button {
  flex: 1;
  padding: 10px;
  background: #2a2a3e;
  border: 1px solid #444;
  color: #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.presets button:hover {
  background: #3a3a4e;
}

#stats {
  margin-top: 15px;
  display: flex;
  gap: 30px;
  font-size: 14px;
}

#stats b {
  color: #667eea;
}
```

---

## 10. Implementation Plan

### Week 1: Core Simulation
- [ ] Boid class with forces
- [ ] Simulation loop
- [ ] Basic canvas rendering
- [ ] Verify 60 FPS with 100 boids

### Week 2: UI & Polish
- [ ] Parameter sliders with live updates
- [ ] Preset buttons with animation
- [ ] Stats display
- [ ] Visual polish (colors, triangles)

### Week 3: Testing & Documentation
- [ ] Cross-browser testing
- [ ] Mobile responsiveness
- [ ] README with instructions
- [ ] Code comments

---

## 11. Success Criteria

**Technical:**
- 60 FPS on modern browsers
- Smooth slider updates
- Preset animations work correctly

**User Experience:**
- Users can immediately see parameter effects
- Presets demonstrate different behaviors clearly
- Interface is intuitive without instructions

**Educational:**
- Users notice emergent patterns
- Parameter relationships become apparent
- Flocking behavior is visually compelling

---

## 12. Future Enhancements (Out of Scope for MVP)

- Challenge system
- Explain mode with educational tooltips
- Predator mode
- Obstacle drawing
- Save/share configurations
- 3D rendering option
- Sound effects

---

**End of Specification**