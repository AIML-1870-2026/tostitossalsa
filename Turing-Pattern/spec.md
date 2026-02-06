# Turing Patterns Explorer - Technical Specification

## Project Overview
A web-based reaction-diffusion simulation explorer using the Gray-Scott model to generate Turing patterns. The application allows users to explore different pattern formations through presets and real-time parameter adjustment.

## Core Features

### 1. Pattern Visualization
- **Single Pane Mode**: One large visualization canvas (primary mode)
- **Dual Pane Mode**: Two side-by-side canvases running independent simulations
- Canvas size: Recommend 512x512 or 600x600 pixels per pane
- Grid resolution: 256x256 or similar (adjustable for performance)
- Color scheme: Smooth gradient visualization (recommend blue-to-red or grayscale)

### 2. Preset Patterns
Include 10 most common Gray-Scott pattern types with pre-configured F/K values:

1. **Spots** (F=0.0545, K=0.062)
2. **Stripes** (F=0.035, K=0.06)
3. **Waves** (F=0.014, K=0.054)
4. **Coral/Mazes** (F=0.055, K=0.062)
5. **Mitosis** (F=0.0367, K=0.0649)
6. **Spirals** (F=0.026, K=0.051)
7. **Worms** (F=0.058, K=0.065)
8. **Holes** (F=0.039, K=0.058)
9. **Pulsating Solitons** (F=0.025, K=0.060)
10. **Fingerprint** (F=0.037, K=0.060)

Each preset should:
- Set appropriate F and K values
- Initialize the grid with a suitable seed pattern
- Reset the simulation
- Update the visualization immediately

### 3. Interactive Controls

#### Parameter Sliders
- **Feed Rate (F)**: Range 0.000 to 0.100, step 0.001, default 0.037
- **Kill Rate (K)**: Range 0.045 to 0.070, step 0.001, default 0.060
- **Simulation Speed**: Range 0.1x to 3.0x, step 0.1x, default 1.0x
  - Controls timestep multiplier or frames per second
  - Does not affect pattern stability, only visualization speed

All sliders should:
- Display current value next to the slider
- Update simulation in real-time as slider moves
- Have clear labels

#### Playback Controls
- **Play/Pause**: Toggle simulation running state
- **Reset**: Clear grid and re-initialize with current preset's seed pattern
- **Clear**: Reset to blank state

### 4. Interactive Chemical Spawning
- **Click-to-Spawn**: Click anywhere on the canvas to inject chemical B at that location
- Spawn size: Small circular area (radius ~5-10 pixels)
- Concentration: High concentration of chemical B (e.g., 1.0)
- Visual feedback: Immediate update on canvas
- Works in both single and dual pane modes (click on respective pane)

### 5. K/F Ratio Visualization

#### Graph Display
- **Type**: 2D phase space diagram showing K vs F
- **Axes**: 
  - X-axis: Feed rate (F) from 0.000 to 0.100
  - Y-axis: Kill rate (K) from 0.045 to 0.070
- **Current Position Marker**: 
  - Single pane: One marker showing current F/K values
  - Dual pane: Two distinct markers (different colors/shapes) for each pane
- **Pattern Regions**: 
  - Optionally overlay background regions showing where different patterns typically form
  - Label zones: "Spots", "Stripes", "Waves", etc.
- **Preset Indicators**: Show all 10 preset positions as small dots/markers

#### Graph Features
- Real-time update as sliders move
- Interactive: Click on graph to jump to those F/K values
- Legend in dual pane mode showing which marker corresponds to which pane

### 6. Dual Pane Mode

#### Layout
- Two canvases side-by-side, equal size
- Each pane has independent simulation state
- Single set of controls affects the "active" pane
- Toggle between which pane is active (visual indicator like border highlight)

#### Control Behavior
- Presets dropdown: Apply to active pane only
- Sliders: Control active pane only
- Speed control: Can be global (both panes) or independent (specify in UI)
- Play/Pause/Reset: Can control both panes simultaneously or independently

#### Graph Display
- Single shared graph showing both panes
- Pane 1: Blue marker
- Pane 2: Orange/Red marker
- Legend showing which is which

## Technical Requirements

### Gray-Scott Reaction-Diffusion Model

#### Equations
```
∂u/∂t = Du∇²u - uv² + F(1-u)
∂v/∂t = Dv∇²v + uv² - (F+K)v
```

Where:
- `u` = concentration of chemical A (inhibitor)
- `v` = concentration of chemical B (activator)
- `Du` = diffusion rate of A (recommend 1.0)
- `Dv` = diffusion rate of B (recommend 0.5)
- `F` = feed rate (parameter controlled by user)
- `K` = kill rate (parameter controlled by user)

#### Numerical Implementation
- Use finite difference method for Laplacian (∇²)
- Use Euler method or RK4 for time stepping
- Timestep (dt): ~1.0 (adjust for stability)
- Periodic or zero-flux boundary conditions

#### Grid Initialization
- Initial state: u=1.0, v=0.0 everywhere
- Seed pattern: Small central square or random perturbations with high v concentration
- Different presets may use different seed patterns for best results

### Performance Considerations
- Use WebGL shader for computation if possible (significant speedup)
- Fallback to JavaScript computation if WebGL unavailable
- Consider worker threads for computation to keep UI responsive
- Target 30-60 FPS for smooth visualization

### Technology Stack Recommendations
- **Framework**: React or vanilla JavaScript
- **Canvas Rendering**: HTML5 Canvas 2D or WebGL
- **Computation**: WebGL compute shaders (with JS fallback)
- **Graphing**: Chart.js, D3.js, or custom Canvas drawing
- **UI Components**: Native HTML inputs or lightweight library

## User Interface Layout

### Single Pane Mode Layout
```
+----------------------------------------------------------+
|  [Turing Patterns Explorer]                              |
+----------------------------------------------------------+
|                                                           |
|  +---------------------------+  +--------------------+   |
|  |                           |  | K/F Phase Space   |   |
|  |                           |  |                    |   |
|  |    Main Canvas            |  |  [Graph showing    |   |
|  |    (Pattern Display)      |  |   current position]|   |
|  |                           |  |                    |   |
|  |                           |  +--------------------+   |
|  |                           |                           |
|  +---------------------------+                           |
|                                                           |
|  Controls:                                                |
|  [Preset Dropdown: Spots v]                              |
|                                                           |
|  Feed Rate (F): [========|---] 0.037                     |
|  Kill Rate (K): [=======|----] 0.060                     |
|  Speed:         [======|-----] 1.0x                      |
|                                                           |
|  [▶ Play/Pause]  [↻ Reset]  [✕ Clear]                   |
|                                                           |
|  [☐ Enable Dual Pane Mode]                               |
+----------------------------------------------------------+
```

### Dual Pane Mode Layout
```
+----------------------------------------------------------+
|  [Turing Patterns Explorer]                              |
+----------------------------------------------------------+
|                                                           |
|  +-------------+  +-------------+  +-----------------+   |
|  |  Pane 1     |  |  Pane 2     |  | K/F Phase Space |   |
|  |  [ACTIVE]   |  |             |  |                 |   |
|  |             |  |             |  |  ● Pane 1 (blue)|   |
|  |   Canvas    |  |   Canvas    |  |  ● Pane 2 (red) |   |
|  |             |  |             |  |                 |   |
|  |             |  |             |  |  [Graph with    |   |
|  |             |  |             |  |   2 markers]    |   |
|  +-------------+  +-------------+  +-----------------+   |
|                                                           |
|  Active Pane: [● Pane 1] [ Pane 2]                       |
|                                                           |
|  Preset: [Spots v]                                        |
|  Feed Rate (F): [========|---] 0.037                     |
|  Kill Rate (K): [=======|----] 0.060                     |
|  Speed:         [======|-----] 1.0x                      |
|                                                           |
|  [▶ Play Both]  [↻ Reset Both]  [✕ Clear Both]          |
|                                                           |
|  [☑ Enable Dual Pane Mode]                               |
+----------------------------------------------------------+
```

## Implementation Notes

### File Structure
```
/index.html           - Main HTML file
/styles.css           - Styling
/js/
  /main.js           - Application entry point
  /simulation.js     - Gray-Scott simulation logic
  /renderer.js       - Canvas rendering
  /controls.js       - UI controls and event handlers
  /graph.js          - K/F phase space graph
  /presets.js        - Preset configurations
```

### State Management
- Keep simulation state separate from UI state
- Store: F, K, speed, grid data (u and v arrays), running state
- For dual pane: maintain two separate simulation states

### Initialization Sequence
1. Create canvas element(s)
2. Initialize simulation grid(s) with default preset
3. Set up UI controls with default values
4. Render initial K/F graph
5. Start animation loop (paused initially)

### Animation Loop
```javascript
function animate() {
  if (isRunning) {
    // Update simulation (compute new u and v values)
    simulation.step();
    
    // Render to canvas
    renderer.draw(simulation.getGrid());
    
    // Update graph marker
    graph.updateMarker(F, K);
  }
  
  requestAnimationFrame(animate);
}
```

### Event Handlers
- Slider input: Update F/K/speed parameters
- Preset selection: Load preset F/K values and reinitialize grid
- Canvas click: Add chemical at click coordinates
- Graph click: Set F/K to clicked coordinates
- Play/Pause: Toggle isRunning flag
- Reset: Reinitialize grid with current preset
- Dual pane toggle: Switch between single/dual layout

## User Experience Considerations

### Visual Feedback
- Show loading state during initialization
- Smooth slider interaction (debounce if computation is heavy)
- Clear visual distinction between active/inactive pane in dual mode
- Highlight active controls

### Accessibility
- Keyboard navigation support for controls
- ARIA labels for sliders and buttons
- Sufficient color contrast for text
- Responsive design for different screen sizes

### Educational Elements (Optional)
- Tooltip on presets explaining the pattern
- Brief description of F/K parameters
- Link to resources about reaction-diffusion systems

## Future Enhancements (Out of Scope for v1)
- Export pattern as PNG image
- Record and export as animated GIF or video
- Custom color schemes
- More diffusion models beyond Gray-Scott
- Save/load custom parameter configurations
- Shareable URLs with encoded parameters
- Brush size control for chemical spawning
- Different grid sizes/resolutions

## Success Criteria
- Smooth 30+ FPS animation on modern browsers
- Real-time parameter updates (<100ms latency)
- Accurate pattern reproduction from presets
- Intuitive UI requiring no instructions to explore
- Stable simulation (no overflow/underflow issues)
- Both single and dual pane modes work reliably

## Browser Compatibility
- Target: Modern browsers (Chrome, Firefox, Safari, Edge)
- Minimum: ES6 support, Canvas 2D API
- Graceful degradation if WebGL unavailable

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-05  
**Target Implementation**: Claude Code
