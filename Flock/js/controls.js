// Parameter definitions
const PARAMS = {
  separationWeight: {
    min: 0, max: 5, default: 1.5, step: 0.1,
    label: 'Separation',
    tooltip: 'Avoid crowding neighbors',
    elementId: 'separation'
  },
  alignmentWeight: {
    min: 0, max: 3, default: 1.0, step: 0.1,
    label: 'Alignment',
    tooltip: 'Match nearby velocities',
    elementId: 'alignment'
  },
  cohesionWeight: {
    min: 0, max: 3, default: 1.0, step: 0.1,
    label: 'Cohesion',
    tooltip: 'Move toward group center',
    elementId: 'cohesion'
  },
  neighborRadius: {
    min: 10, max: 150, default: 50, step: 5,
    label: 'Neighbor Radius',
    tooltip: 'Detection distance',
    elementId: 'radius'
  },
  maxSpeed: {
    min: 1, max: 10, default: 4.0, step: 0.5,
    label: 'Max Speed',
    tooltip: 'Maximum velocity',
    elementId: 'speed'
  },
  spawnRate: {
    min: 0, max: 50, default: 10, step: 1,
    label: 'Spawn Rate',
    tooltip: 'Boids spawned per second',
    elementId: 'spawn'
  }
};

// Presets
const PRESETS = {
  flock: {
    separationWeight: 1.5,
    alignmentWeight: 1.0,
    cohesionWeight: 1.0,
    neighborRadius: 50,
    maxSpeed: 4.0,
    spawnRate: 10
  },
  chaos: {
    separationWeight: 3.0,
    alignmentWeight: 0.1,
    cohesionWeight: 0.1,
    neighborRadius: 20,
    maxSpeed: 6.0,
    spawnRate: 30
  },
  cluster: {
    separationWeight: 0.5,
    alignmentWeight: 0.3,
    cohesionWeight: 2.5,
    neighborRadius: 80,
    maxSpeed: 3.0,
    spawnRate: 5
  }
};

// Controls class
class Controls {
  constructor(simulation) {
    this.simulation = simulation;
    this.currentParams = { ...simulation.params };
    this.animating = false;
    this.setupSliders();
    this.setupPresets();
  }

  setupSliders() {
    Object.keys(PARAMS).forEach(key => {
      const config = PARAMS[key];
      const slider = document.getElementById(config.elementId);
      const valueDisplay = slider.parentElement.querySelector('.value');

      slider.addEventListener('input', () => {
        const value = parseFloat(slider.value);
        this.currentParams[key] = value;
        this.simulation.setParam(key, value);
        valueDisplay.textContent = this.formatValue(key, value);
      });
    });
  }

  formatValue(key, value) {
    // Integer parameters don't need decimals
    if (key === 'neighborRadius' || key === 'spawnRate') {
      return Math.round(value).toString();
    }
    return value.toFixed(1);
  }

  setupPresets() {
    const buttons = document.querySelectorAll('.presets button');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const presetName = button.dataset.preset;
        const preset = PRESETS[presetName];
        if (preset) {
          this.animateToPreset(preset);

          // Update active button state
          buttons.forEach(b => b.classList.remove('active'));
          button.classList.add('active');
        }
      });
    });
  }

  animateToPreset(targetParams) {
    if (this.animating) return;
    this.animating = true;

    const startParams = { ...this.currentParams };
    const startTime = performance.now();
    const duration = 800;

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeInOutCubic(progress);

      Object.keys(targetParams).forEach(key => {
        const value = this.lerp(startParams[key], targetParams[key], eased);
        this.currentParams[key] = value;
        this.simulation.setParam(key, value);
        this.updateSlider(key, value);
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.animating = false;
      }
    };

    animate();
  }

  updateSlider(key, value) {
    const config = PARAMS[key];
    const slider = document.getElementById(config.elementId);
    const valueDisplay = slider.parentElement.querySelector('.value');
    slider.value = value;
    valueDisplay.textContent = this.formatValue(key, value);
  }

  lerp(start, end, t) {
    return start + (end - start) * t;
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
