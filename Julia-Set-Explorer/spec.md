# Julia Set Explorer - Technical Specification

## Project Overview
A web-based interactive Julia Set fractal explorer designed for fractal enthusiasts and artists, emphasizing real-time parameter control and artistic color customization.

## Target Audience
- Fractal enthusiasts exploring mathematical beauty
- Digital artists seeking generative art inspiration
- Users who want an intuitive yet powerful exploration tool

## Core Objectives
1. Provide smooth, real-time Julia set rendering with interactive parameter control
2. Offer extensive color scheme customization for artistic expression
3. Balance accessibility with advanced features through a moderate complexity interface
4. Enable high-quality visual output suitable for artistic purposes

---

## Technical Stack

### Recommended Technologies
- **Framework**: React (for reactive UI and state management)
- **Rendering**: HTML5 Canvas with optional WebGL acceleration
- **Language**: JavaScript/TypeScript
- **Styling**: Tailwind CSS or styled-components
- **Build Tool**: Vite or Create React App

### Why These Choices?
- Canvas provides pixel-level control needed for fractal rendering
- React enables responsive UI updates as parameters change
- WebGL acceleration optional for performance optimization

---

## Feature Specification

### Priority 1: Essential Features

#### 1.1 Interactive Canvas
- **Main fractal display area** (minimum 800x600px, scales to viewport)
- Click-to-set complex parameter (c = real + imaginary)
  - Click on canvas sets new c value based on click coordinates
  - Visual feedback showing current c value position
- Real-time rendering updates (< 100ms response time for parameter changes)
- Smooth pan and zoom controls
  - Mouse wheel zoom (centered on cursor position)
  - Click-and-drag to pan
  - Zoom level indicator
  - Reset view button

#### 1.2 Parameter Controls (Always Visible)
- **Complex Parameter (c) Input**
  - Real component slider: range [-2, 2], step 0.01
  - Imaginary component slider: range [-2, 2], step 0.01
  - Numeric input fields for precise values
  - "Randomize" button for exploration
  
- **Iteration Controls**
  - Max iterations slider: range [50, 1000], default 256
  - Escape radius: fixed at 2.0 (or advanced setting)

- **Color Scheme Selector**
  - Dropdown with preset palettes (see Color Customization section)
  - Quick preview of each palette
  - Custom palette editor (expandable)

#### 1.3 Preset Julia Sets
- Curated list of famous/beautiful Julia sets
- Each preset includes:
  - Thumbnail preview
  - c value (real and imaginary)
  - Descriptive name
  - Optional: suggested color palette
  
**Recommended Presets:**
1. "Dendrite" (c = 0 + 1i)
2. "Rabbit" (c = -0.123 + 0.745i)
3. "Dragon" (c = -0.8 + 0.156i)
4. "Douady's Rabbit" (c = -0.122561 + 0.744862i)
5. "Siegel Disk" (c = -0.391 - 0.587i)
6. "San Marco" (c = -0.75 + 0.0i)
7. "Spiral" (c = -0.4 + 0.6i)
8. "Leaf" (c = 0.285 + 0.01i)

### Priority 2: Color Customization

#### 2.1 Color Palette System
- **Palette Types**:
  - Gradient-based (smooth color transitions)
  - Discrete bands (distinct color steps)
  - Cyclic (repeating patterns)

#### 2.2 Built-in Palettes
Minimum 8-10 preset color schemes:
1. **Classic** - Blue to white gradient
2. **Fire** - Black → Red → Orange → Yellow → White
3. **Ocean** - Deep blue → Cyan → White
4. **Forest** - Dark green → Light green → Yellow
5. **Sunset** - Purple → Pink → Orange → Yellow
6. **Monochrome** - Black to white
7. **Electric** - Neon colors (Cyan → Magenta → Yellow)
8. **Psychedelic** - High contrast vibrant cycling colors
9. **Earth** - Browns and greens
10. **Ice** - White → Light blue → Deep blue

#### 2.3 Custom Palette Editor
- Color stop editor (gradient points)
- Add/remove color stops
- Adjust stop positions along gradient
- Color picker for each stop
- Preview area showing gradient
- Save custom palettes to browser localStorage
- Export/import palette as JSON

#### 2.4 Color Mapping Options
- **Mapping function**: How iterations map to colors
  - Linear
  - Logarithmic (smoother transitions)
  - Square root
  - Custom power function
- **Color cycling**: Animate colors over time (optional advanced feature)
- **Inversion**: Swap inside/outside set colors

### Priority 3: Advanced Features (Collapsible Panel)

#### 3.1 Rendering Quality
- Resolution multiplier (1x, 2x, 4x for high-quality export)
- Anti-aliasing toggle (supersampling)
- Rendering algorithm selector:
  - Standard escape-time
  - Continuous coloring (smooth gradients)

#### 3.2 Display Options
- Show/hide coordinate grid
- Show/hide axes
- Display current c value on canvas
- FPS counter (for performance monitoring)

#### 3.3 Mathematical Options
- Escape radius adjustment (default 2.0)
- Julia set formula variants (z² + c is standard, could add z³ + c, etc.)

---

## User Interface Layout

### Overall Structure
```
┌─────────────────────────────────────────────────────┐
│  HEADER                                              │
│  Julia Set Explorer    [Preset ▼] [Export] [Help]   │
├──────────────┬──────────────────────────────────────┤
│              │                                       │
│  CONTROLS    │         CANVAS                        │
│  PANEL       │      (Main Fractal Display)           │
│              │                                       │
│  (300px)     │       (Fills remaining space)         │
│              │                                       │
│              │                                       │
├──────────────┴───────────────────────────────────────┤
│  STATUS BAR                                          │
│  c = -0.123 + 0.745i | Iterations: 256 | Zoom: 1.5x  │
└──────────────────────────────────────────────────────┘
```

### Controls Panel (Left Sidebar - 300px wide)

**Section 1: Parameter Control** (Always visible)
- Label: "Complex Parameter (c)"
- Real component slider + input
- Imaginary component slider + input
- Randomize button

**Section 2: Iterations** (Always visible)
- Label: "Max Iterations"
- Slider + numeric input
- Quick preset buttons: [100] [250] [500] [1000]

**Section 3: Colors** (Always visible)
- Label: "Color Palette"
- Palette dropdown with previews
- [Edit Custom Palette] button → opens modal/drawer

**Section 4: Presets** (Collapsible, expanded by default)
- Label: "Famous Julia Sets"
- Grid of preset thumbnails (2 columns)
- Click to load preset

**Section 5: Advanced** (Collapsible, collapsed by default)
- Resolution settings
- Anti-aliasing toggle
- Mathematical options
- Display options

### Canvas Area
- **Center**: Main fractal rendering
- **Overlay** (semi-transparent, corners):
  - Top-left: Current c value display
  - Top-right: Zoom level indicator
  - Bottom-right: Rendering status (if slow)
- **Cursor**: Crosshair when hovering (shows would-be c value)

### Header Bar
- **Left**: Title "Julia Set Explorer"
- **Center**: Quick preset dropdown
- **Right**: 
  - Export button (PNG download)
  - Help/Info button (opens modal with instructions)

### Status Bar
- Current c value
- Current max iterations
- Current zoom level
- Optional: Rendering time

---

## User Interactions & Workflows

### Primary Workflow: Exploration
1. User loads app → sees default Julia set
2. User clicks on canvas → c parameter updates, fractal re-renders
3. User adjusts colors to enhance visual appeal
4. User zooms/pans to explore details
5. User exports favorite discoveries

### Secondary Workflow: Preset Exploration
1. User clicks preset thumbnail
2. Fractal updates with recommended settings
3. User fine-tunes parameters
4. User customizes colors

### Tertiary Workflow: Custom Creation
1. User manually inputs c values
2. User opens custom palette editor
3. User creates gradient with 5-10 color stops
4. User exports high-resolution image

---

## Technical Requirements

### Performance Targets
- Initial render: < 200ms (at 1000x800, 256 iterations)
- Parameter change response: < 100ms
- Zoom/pan: 60 FPS smooth animation
- Support up to 2000 iterations without freezing

### Rendering Algorithm
```
For each pixel (px, py):
  1. Convert pixel to complex number z₀ = x + yi
     (based on current zoom and pan)
  2. Iterate: z_{n+1} = z_n² + c
  3. Count iterations until |z| > escape_radius or max_iterations
  4. Map iteration count to color using selected palette
  5. Set pixel color
```

### Optimization Strategies
- Use typed arrays for faster computation
- Consider Web Workers for non-blocking rendering
- Implement viewport culling (only render visible area)
- Cache rendered tiles when zooming
- Progressive rendering (low res preview → high res final)

---

## Color Palette Data Structure

```javascript
{
  name: "Fire",
  type: "gradient", // or "discrete" or "cyclic"
  stops: [
    { position: 0.0, color: "#000000" },
    { position: 0.3, color: "#8B0000" },
    { position: 0.6, color: "#FF4500" },
    { position: 0.8, color: "#FFD700" },
    { position: 1.0, color: "#FFFFFF" }
  ],
  mapping: "logarithmic" // or "linear", "sqrt", "power"
}
```

---

## Export Functionality

### Image Export
- Format: PNG (lossless)
- Resolution options:
  - Current view (screen resolution)
  - 2x resolution (for retina)
  - Custom (width x height input)
- Filename: `julia-set-[c-real]-[c-imag]-[timestamp].png`

### Settings Export (Future)
- Export current configuration as JSON
- Import configuration to recreate exact view
- Share configuration via URL parameters

---

## Accessibility Considerations

- Keyboard navigation for all controls
- Tab order follows logical flow
- Aria labels for screen readers
- Sufficient color contrast in UI
- Focus indicators on interactive elements
- Alternative text for preset thumbnails

---

## Browser Compatibility

### Minimum Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

### Required APIs
- Canvas 2D Context
- ES6+ JavaScript
- CSS Grid/Flexbox
- LocalStorage

---

## Future Enhancements (Out of Scope for V1)

1. **Animation System**
   - Animate c parameter along a path
   - Record animations as GIF/MP4
   - Keyframe system

2. **WebGL Renderer**
   - GPU-accelerated computation
   - Support for higher resolutions and iteration counts

3. **Mandelbrot Set Integration**
   - Show small Mandelbrot set navigator
   - Highlight current c position on Mandelbrot set
   - Click Mandelbrot to set Julia c parameter

4. **Gallery/Collection System**
   - Save favorite configurations
   - User gallery of discoveries
   - Share gallery publicly

5. **Advanced Mathematical Features**
   - Different Julia set formulas (z³+c, z⁴+c, etc.)
   - Newton fractals
   - Other escape-time fractals

---

## Development Milestones

### Milestone 1: Core Rendering
- [ ] Set up React project structure
- [ ] Implement basic Julia set algorithm
- [ ] Render to canvas at fixed resolution
- [ ] Basic parameter input (sliders)

### Milestone 2: Interactivity
- [ ] Click-to-set c parameter
- [ ] Zoom and pan controls
- [ ] Real-time parameter updates
- [ ] Status bar display

### Milestone 3: Color System
- [ ] Implement color palette system
- [ ] Create 10 built-in palettes
- [ ] Palette selector UI
- [ ] Color mapping functions

### Milestone 4: Presets & Polish
- [ ] Implement preset system
- [ ] Create preset thumbnails
- [ ] Custom palette editor
- [ ] Export functionality

### Milestone 5: Advanced Features
- [ ] Collapsible advanced panel
- [ ] High-resolution rendering
- [ ] Performance optimizations
- [ ] Help documentation

---

## Testing Checklist

- [ ] Fractals render correctly for known c values
- [ ] Click-to-set parameter works accurately
- [ ] Zoom centers on cursor position
- [ ] Pan moves viewport smoothly
- [ ] All color palettes display correctly
- [ ] Custom palette editor saves/loads
- [ ] Export produces correct image
- [ ] Presets load with correct parameters
- [ ] UI responsive on different screen sizes
- [ ] Performance acceptable up to 1000 iterations
- [ ] No UI blocking during rendering
- [ ] LocalStorage persistence works

---

## File Structure Recommendation

```
julia-set-explorer/
├── src/
│   ├── components/
│   │   ├── Canvas.jsx              # Main fractal canvas
│   │   ├── ControlPanel.jsx        # Left sidebar container
│   │   ├── ParameterControls.jsx   # c value inputs
│   │   ├── IterationControls.jsx   # Max iterations
│   │   ├── ColorPicker.jsx         # Palette selector
│   │   ├── ColorEditor.jsx         # Custom palette editor
│   │   ├── PresetGallery.jsx       # Preset thumbnails
│   │   ├── AdvancedPanel.jsx       # Collapsible advanced
│   │   ├── StatusBar.jsx           # Bottom status
│   │   └── Header.jsx              # Top navigation
│   ├── hooks/
│   │   ├── useJuliaRenderer.js     # Rendering logic
│   │   ├── useCanvasInteraction.js # Zoom/pan/click
│   │   └── useColorPalette.js      # Color management
│   ├── utils/
│   │   ├── juliaSet.js             # Core algorithm
│   │   ├── colorMapping.js         # Iteration → color
│   │   ├── palettes.js             # Built-in palettes
│   │   └── export.js               # Image export
│   ├── data/
│   │   └── presets.js              # Famous Julia sets
│   ├── App.jsx
│   └── main.jsx
├── public/
│   └── preset-thumbnails/          # Preset images
├── package.json
└── README.md
```

---

## Implementation Notes for Claude Code

### Key Implementation Details

1. **State Management**: Use React Context or component state for:
   - Current c value (real, imaginary)
   - Max iterations
   - Current palette
   - Zoom/pan transform
   - Advanced settings

2. **Canvas Rendering**: 
   - Use `useRef` for canvas element
   - Implement rendering in `useEffect` triggered by parameter changes
   - Consider debouncing rapid parameter changes

3. **Color Interpolation**:
   - Linear interpolation between color stops
   - Convert hex to RGB for calculation
   - Support different color spaces (RGB vs HSL)

4. **Performance**:
   - Use `requestAnimationFrame` for smooth updates
   - Consider ImageData API for fast pixel manipulation
   - Implement progressive rendering for high iteration counts

5. **LocalStorage**:
   - Save custom palettes: `localStorage.setItem('customPalettes', JSON.stringify(palettes))`
   - Restore on load: `JSON.parse(localStorage.getItem('customPalettes'))`

### Suggested Starting Point
Begin with Milestone 1 (Core Rendering) and build incrementally. The fractal algorithm is the foundation everything else builds upon.

---

## Questions for Refinement

Before implementation, consider:
1. Should the canvas be resizable by dragging?
2. Touch device support priority (mobile/tablet)?
3. Preference for light/dark theme or both?
4. Should there be undo/redo for parameter changes?
5. Maximum supported resolution for export?

---

## Additional Resources

- [Julia Set Mathematics](https://en.wikipedia.org/wiki/Julia_set)
- [Escape-time Algorithm](https://en.wikipedia.org/wiki/Plotting_algorithms_for_the_Mandelbrot_set)
- [Color Theory for Data Visualization](https://colorbrewer2.org/)

---

**Document Version**: 1.0  
**Created**: 2026-02-10  
**Target Completion**: TBD based on development capacity
