# Stellar Web

## Objective

Create an interactive webpage featuring a particle system that generates a "Stellar Web" - a dynamic network of connected particles floating in 2D space. Your implementation should include interactive sliders that allow users to control various attributes of the animation in real-time.

## What is a Stellar Web?

A Stellar Web is a particle network visualization where:

- **Nodes** (particles) move freely through 2D space
- **Edges** (connections) automatically form between nodes within a certain distance
- The connectivity creates an ever-changing web-like structure
- Visual properties like thickness, transparency, and opacity affect the aesthetic
- The **connectivity radius** determines how close nodes need to be to connect

## Requirements

### Core Features

1. **Particle System**
   - Create multiple nodes that move through 2D space
   - Each node should have position, velocity, and directional movement
   - Nodes should bounce off boundaries or wrap around the canvas

2. **Connection System**
   - Automatically draw edges between nodes within the connectivity radius
   - Edge appearance should reflect the distance between connected nodes
   - Update connections dynamically as nodes move

3. **Interactive Controls**
   Create sliders to control:
   - Number of particles/nodes
   - Particle/node size
   - Movement speed or velocity
   - Connectivity radius (detection distance)
   - Edge thickness
   - Edge opacity/transparency
   - Additional parameters as desired

### Technical Implementation

**HTML Structure**
- Canvas element for rendering the particle system
- Slider controls (input type="range") with labels
- Display values for each slider

**JavaScript/Animation**
- Animation loop using `requestAnimationFrame()`
- Particle class/object to manage node properties
- Distance calculation for connectivity detection
- Dynamic edge rendering based on connectivity radius
- Slider event listeners to update parameters in real-time

**Visual Design**
- Clean, intuitive control panel
- Smooth animations (60 FPS target)
- Visually appealing color scheme
- Clear visual feedback for parameter changes

## Key Concepts to Understand

### Connectivity Radius
The maximum distance at which two nodes will connect with an edge. This is typically calculated using the distance formula:

```
distance = √[(x₂-x₁)² + (y₂-y₁)²]
```


### Edge Properties
- **Thickness**: The width of connection lines
- **Opacity/Transparency**: How visible the edges are (often mapped to distance - closer = more opaque)
- **Color**: Can be static or dynamic based on properties like distance or velocity


### Basic Enhancements
- **Dynamic Opacity**: Make edges more transparent as nodes get farther apart
- **Variable Thickness**: Thicker edges for closer nodes, thinner for distant ones
- **Color Gradients**: Change edge colors based on length or node velocity

### Intermediate Features
- **Mouse Interaction**: 
  - Attract nodes toward the cursor
  - Repel nodes away from the cursor
  - Create a "gravity well" effect
- **Pulsing Effects**: 
  - Nodes that grow and shrink rhythmically
  - Edges that pulse based on distance changes
- **Speed Variation**: Different particles move at different velocities


## Tips for Success

1. **Start Simple**: Begin with 2D movement and basic connections before adding complexity
2. **Optimize Performance**: 
   - Use spatial partitioning for large numbers of particles
   - Limit connection checks to nearby nodes
   - Consider using `requestAnimationFrame()` efficiently
3. **Visual Polish**: Small details like smooth color transitions and subtle animations make a big difference
4. **Responsive Design**: Ensure the canvas resizes properly and controls are usable on different screen sizes
5. **Debug Incrementally**: Test each feature independently before combining them

## Example Slider Parameters

Consider including controls for:
- **Node Count**: 10-200 particles
- **Node Size**: 1-10 pixels radius
- **Speed**: 0.1-5.0 units per frame
- **Connectivity Radius**: 50-300 pixels
- **Edge Thickness**: 0.5-5.0 pixels
- **Edge Opacity**: 0.0-1.0 (or 0-100%)
- **Attraction Strength** (if implementing mouse interaction)



## Bonus Challenges

- Add a "reset" button to randomize particle positions
- Create preset configurations (sparse, dense, chaotic, etc.)
- Implement a trail effect showing particle movement history
- Add sound that responds to the number of active connections
- Create a fullscreen mode
- Export the current state as an image or animation

## Resources to Consider

- `requestAnimationFrame()` for smooth animations
- Distance formula and geometry
- Color theory for gradients
- Performance optimization techniques

---

