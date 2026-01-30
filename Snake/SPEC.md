# SNAKE - Technical Specification

## Game Overview
A fantasy-themed snake game with infinite progression, boss battles every 5 levels, and cycling biomes. Features 16-bit pixel art aesthetic with procedurally generated levels and unique boss mechanics.

---

## Core Game Mechanics

### Snake Movement
- **Grid-based movement**: 4-directional (up, down, left, right)
- **Collision detection**: 
  - Self-collision = death
  - Wall collision = death
  - Obstacle collision = death
  - Food collision = grow + progress toward goal
- **Growth**: Snake grows by 1 segment when eating food
- **Speed**: Increases permanently after each boss defeat

### Win/Loss Conditions
- **Level Complete**: Reach target length for current level
- **Game Over**: Hit wall, obstacle, or self
- **Infinite Progression**: Game continues indefinitely with scaling difficulty

---

## Progression System

### Level Structure (5-Level Cycles)
```
Levels 1-4:   Regular gameplay, obstacles increase (0→1→2→3→4)
Level 5:      Boss fight (biome 1)
Levels 6-9:   RESET to 0 obstacles, then increase (1→2→3→4), snake faster
Level 10:     Boss fight (biome 1 again)
Levels 11-14: RESET to 0 obstacles, then increase, snake even faster
Level 15:     Boss fight (biome 2)
... continues infinitely cycling through 5 biomes
```

### Length Requirements
- **Levels 1-10**: Gradual increase
  - Level 1: 10
  - Level 2: 15
  - Level 3: 20
  - Level 4: 25
  - Level 5: 30 (boss)
  - Level 6: 35
  - Level 7: 40
  - Level 8: 45
  - Level 9: 48
  - Level 10: 50 (boss)
- **Level 11+**: Maximum stays at 50

### Difficulty Scaling
- **Speed increase**: After each boss defeat (levels 5, 10, 15, 20, etc.)
- **Obstacle reset**: After each boss, next cycle starts with 0 obstacles
- **Obstacle progression**: Within each 4-level cycle, obstacles increase by 1 per level
- **Obstacle placement**: Randomized but always solvable

---

## Biomes (Cycling Every 5 Levels)

### 1. Enchanted Forest (Levels 1-10, 21-30, 41-50...)
**Visual Theme**: Deep greens, earthy browns, bioluminescent accents
- Mossy stones, mushrooms, fireflies, ancient trees
- Animated particle effects: floating spores, gentle wind

**Regular Obstacles**: Mossy rocks, tree stumps, mushroom clusters

**Food**: Glowing berries, magical fruit (animated glow pulse)

**Background**: Dark forest with depth layers, firefly particles

---

### 2. Volcanic Cavern (Levels 11-20, 31-40, 51-60...)
**Visual Theme**: Reds, oranges, blacks, glowing embers
- Lava flows, obsidian formations, fire crystals
- Animated particle effects: rising embers, heat waves

**Regular Obstacles**: Lava rocks, obsidian chunks, fire crystals

**Food**: Fire gems, molten crystals (animated flicker)

**Background**: Cave walls with lava veins, ember particles

---

### 3. Frozen Tundra (Levels 21-30, 41-50, 61-70...)
**Visual Theme**: Blues, whites, purples (northern lights)
- Ice formations, snow drifts, frozen landscape
- Animated particle effects: falling snow, aurora shimmer

**Regular Obstacles**: Ice blocks, frozen stalagmites, snow piles

**Food**: Frozen berries, ice crystals (animated sparkle)

**Background**: Icy cavern with aurora borealis, snow particles

---

### 4. Desert Ruins (Levels 31-40, 51-60, 71-80...)
**Visual Theme**: Golds, sandy yellows, stone grays
- Ancient architecture, hieroglyphs, weathered stone
- Animated particle effects: swirling sand, heat shimmer

**Regular Obstacles**: Sandstone blocks, broken pillars, ancient urns

**Food**: Golden scarabs, enchanted gems (animated shine)

**Background**: Desert temple ruins, sand particle effects

---

### 5. Celestial Sky (Levels 41-50, 61-70, 81-90...)
**Visual Theme**: Deep purples, cosmic blues, starlight whites
- Floating islands, constellations, cosmic clouds
- Animated particle effects: twinkling stars, nebula swirls

**Regular Obstacles**: Floating rocks, star fragments, cloud formations

**Food**: Star fruit, cosmic orbs (animated twinkle)

**Background**: Starfield with nebulae, celestial particles

---

## Boss Mechanics

### Boss Trigger
- Occurs every 5th level (5, 10, 15, 20, etc.)
- Boss corresponds to current biome
- Same boss appears twice per biome cycle (levels 5 & 10 for biome 1, etc.)

### Universal Boss Rules
- **No regular obstacles** spawn during boss fights
- **Same length requirement** as regular levels
- **Stage progression**: Boss mechanics intensify based on current length vs target
  - Stage 1: 0-33% of target length
  - Stage 2: 33-66% of target length
  - Stage 3: 66-100% of target length

---

### Boss 1: Forest Spirit (Enchanted Forest)
**Appearance**: Large ethereal tree creature looming above the board

**Mechanic**: Drops acorn obstacles
- **Warning system**: Red circle indicator appears 2 seconds before acorn lands
- **Temporary obstacles**: Acorns remain for ~3 seconds, then disappear
- **Stage progression**: 
  - Stage 1: Slow drop rate
  - Stage 2: Medium drop rate
  - Stage 3: Fast drop rate
- **Drop frequency**: Increases proportionally with stage

**Visual**: Acorns glow red during warning, become solid brown obstacles

---

### Boss 2: Volcano Dragon (Volcanic Cavern)
**Appearance**: Massive dragon head breathing fire from above

**Mechanic**: Drops expanding lava pools
- **Permanent obstacles**: Lava pools never disappear
- **Expansion**: Each pool slowly grows in size over ~5 seconds
- **No stages**: Consistent drop rate throughout fight
- **Progressive difficulty**: Board fills up, creating maze-like patterns
- **Race against time**: Player must complete before board is too full

**Visual**: Lava pools start small, expand with animated glow, create heat wave effects

---

### Boss 3: Ice Giant (Frozen Tundra)
**Appearance**: Towering frost giant throwing projectiles

**Mechanic**: Two attack types
1. **Snowballs**: 
   - Hit ground and create icy patch (4x4 area)
   - Icy patch = speed boost when snake head touches it
   - Patches last ~5 seconds then melt
   - Visual: Blue glowing ice with sparkle effect

2. **Icicles**:
   - Function like Forest Spirit acorns
   - Red warning indicator 2 seconds before impact
   - Become temporary obstacles (~3 seconds)
   - Visual: Sharp ice spikes

**Stage progression**:
- Stage 1: Only snowballs
- Stage 2: Snowballs + occasional icicles
- Stage 3: Increased frequency of both

**Strategy**: Use icy patches for speed boost to navigate around icicles

---

### Boss 4: Desert Sphinx (Desert Ruins)
**Appearance**: Ancient sphinx statue above board, eyes glowing

**Mechanic**: Wind manipulation
- **Wind direction**: Constant wind blowing in one of 4 cardinal directions
- **Speed modification**:
  - Moving WITH wind: 1.5x speed
  - Moving AGAINST wind: 0.5x speed
  - Moving perpendicular: Normal speed
- **Wind change warning**: 
  - Visual: Swirling sand particles + directional arrow indicator
  - Warning lasts 2 seconds before wind changes
  - Sound cue recommended

**Stage progression**:
- Stage 1: Wind fixed in one direction
- Stage 2: Wind changes direction every 8-10 seconds (with warning)
- Stage 3: Wind changes + throws sandstone obstacles
  - Fewer obstacles than other bosses (~1 every 5 seconds)
  - Standard warning system (2 second red indicator)

**Visual**: Wind shown with animated sand streams, arrow UI element

---

### Boss 5: Thunder Bird (Celestial Sky)
**Appearance**: Massive cosmic bird with lightning emanating from wings

**Mechanic**: Lightning attacks with escalating complexity

**Stage 1 (0-33%)**: Blinding flashes
- Lightning strike blinds player (screen flashes white)
- Blindness lasts 0.25 seconds
- Player must navigate by memory during flash
- Occurs every 4-6 seconds
- Visual: Full screen white flash with lightning bolt overlay

**Stage 2 (33-66%)**: Temporary obstacles
- Lightning creates obstacle at random location
- Warning: Location flashes/glows yellow for 1 second
- Obstacle exists for 2 seconds then disappears
- Occurs every 3-5 seconds
- Visual: Crackling electrical field

**Stage 3 (66-100%)**: Combined chaos
- BOTH previous mechanics active
- Blinding flashes + temporary obstacles
- Higher frequency of both
- Visual: Overlapping lightning effects and flashes

**Strategy**: Most difficult boss - requires memory, timing, and spatial awareness

---

## UI/UX Design

### Start Screen
- **Title**: "SNAKE" in fantasy-styled font
- **Large START button**: Begins game at level 1
- **Level select**: Text input + "Go" button to start at specific level
- **Visual theme**: 16-bit fantasy aesthetic matching first biome
- **Optional**: High score display, credits

### HUD (In-Game)
Minimal overlay to avoid obstructing gameplay:
- **Top-left**: 
  - "Level: [number]"
  - "Length: [current] / [target]"
- **Font**: Pixel font matching 16-bit aesthetic
- **Colors**: High contrast, biome-themed

### Boss Fight HUD
- Add boss health/stage indicator (optional)
- Display boss name
- Stage indicator (1/2/3) or progress bar

### Death Screen
- "Game Over" message
- Final level reached
- Final snake length
- **Restart** button (returns to level 1)
- **Menu** button (returns to start screen)

### Level Complete Transition
- Brief animation showing level number incrementing
- Smooth fade between biomes
- "Boss Incoming!" warning before boss levels

---

## Technical Implementation

### Game Grid
- **Size**: 20x20 cells (adjustable)
- **Cell size**: 32x32 pixels (16-bit sprite scale)
- **Border**: Visible walls or edge detection

### Game Loop
- **Target framerate**: 60 FPS for smooth animations
- **Update rate**: Tied to snake speed (starts ~10 moves/second, increases with difficulty)
- **Render loop**: Separate from game logic for smooth visuals

### State Management
```javascript
GameState {
  level: number
  currentBiome: number (0-4)
  snakeLength: number
  targetLength: number
  baseSpeed: number
  speedMultiplier: number
  obstacles: Array<Obstacle>
  snake: Array<Position>
  food: Position
  isBossLevel: boolean
  bossStage: number (1-3)
  gameStatus: "playing" | "won" | "lost"
}
```

### Obstacle Generation
- **Regular levels**: 
  - Calculate obstacle count based on level within cycle
  - Randomly place obstacles ensuring path exists
  - Use flood-fill or A* to verify solvability
- **Boss levels**: 
  - Dynamic obstacle spawning based on boss mechanics
  - Track temporary obstacle timers

### Boss State Management
```javascript
BossState {
  type: "forestSpirit" | "dragon" | "iceGiant" | "sphinx" | "thunderBird"
  stage: 1 | 2 | 3
  activeEffects: Array<Effect>
  warnings: Array<Warning>
  timers: Map<string, number>
}
```

### Collision Detection
- **Snake-food**: Check if head position === food position
- **Snake-obstacle**: Check if head position in obstacle array
- **Snake-self**: Check if head position in snake body array
- **Snake-wall**: Check if head position outside grid bounds

### Animation System
- **Snake movement**: Smooth interpolation between grid cells
- **Particles**: Background ambient effects per biome
- **Boss animations**: Sprite-based or procedural
- **Warning indicators**: Pulsing, flashing, scaling effects
- **Transitions**: Fade, slide, or dissolve between levels/biomes

---

## Asset Requirements

### Sprites (16-bit Pixel Art)
**Snake**:
- Head (4 directions)
- Body segments
- Tail (4 directions)
- Corner pieces for smooth turns

**Food** (per biome):
- Idle animation frames
- Collection animation

**Obstacles** (per biome):
- Regular obstacles (3-5 variations)
- Boss-specific obstacles (acorns, lava, ice, etc.)

**Bosses**:
- Idle animation
- Attack animations
- Stage transition effects

**UI Elements**:
- HUD frames
- Buttons
- Text boxes
- Warning indicators

### Background Layers
- **Far background**: Parallax layer 1
- **Mid background**: Parallax layer 2
- **Near background**: Parallax layer 3 (optional)
- **Particle effects**: Overlay layer

### Sound Effects (Optional but Recommended)
- Snake movement
- Food collection
- Obstacle hit/death
- Boss attacks
- Warning sounds
- Level complete
- Boss defeat

### Music (Optional)
- Menu theme
- Biome themes (5 tracks)
- Boss battle theme

---

## Controls

### Keyboard
- **Arrow Keys** or **WASD**: Movement
- **Spacebar**: Pause
- **R**: Restart
- **Esc**: Menu

### Touch (Mobile Support)
- **Swipe**: Change direction
- **Tap**: Pause

### Gameplay
- Movement queuing to prevent missed inputs
- Can't reverse directly into self (up→down blocked if moving up)

---

## Difficulty Balancing

### Speed Progression
```
Level 1-5:   Base speed (10 cells/sec)
Level 6-10:  1.15x speed
Level 11-15: 1.3x speed
Level 16-20: 1.45x speed
Level 21+:   +0.15x per boss cycle
```

### Obstacle Density
- **Level 1-4 of cycle**: 0, 1, 2, 3, 4 obstacles
- **Randomized placement** with mandatory solvable path
- **Minimum spacing**: 2 cells between obstacles

### Boss Difficulty Scaling
- Boss mechanics stay consistent
- Increased snake speed makes bosses harder naturally
- Later boss cycles = less time to react

---

## Procedural Generation Rules

### Food Placement
- Never on snake body
- Never on obstacles
- Never on edge (1 cell minimum from walls)
- Randomized within valid cells

### Obstacle Placement (Regular Levels)
1. Generate random positions
2. Ensure obstacles not adjacent to each other
3. Ensure obstacles not near starting position (5x5 safe zone)
4. Run pathfinding to verify food is reachable
5. Regenerate if unsolvable

### Boss Obstacle Patterns
- **Forest Spirit**: Completely random drops with warning
- **Dragon**: Clustered lava pools to create zones
- **Ice Giant**: Mix of random snowballs and targeted icicles
- **Sphinx**: Random obstacles in final stage only
- **Thunder Bird**: Random lightning strikes across board

---

## Polish & Juice

### Screen Shake
- On death
- On boss attacks
- On level complete

### Particle Effects
- Food collection burst
- Snake trail (subtle)
- Biome ambient particles
- Boss attack effects

### Color Flashing
- Snake invincibility frames after respawn (if implemented)
- Warning indicators pulse
- Boss stage transitions

### Smooth Transitions
- Level fade in/out
- Biome transitions with cross-fade
- Death screen fade

### Visual Feedback
- Snake segments squash/stretch on turns
- Food wobble/pulse animation
- Obstacles with subtle idle animations

---

## Development Phases

### Phase 1: Core Game
- Grid system
- Snake movement and collision
- Food spawning
- Length tracking
- Basic win/loss

### Phase 2: Progression
- Level system
- Length requirements
- Speed scaling
- Obstacle spawning
- Level transitions

### Phase 3: Biomes
- Visual themes for all 5 biomes
- Biome-specific sprites
- Background art
- Particle systems

### Phase 4: Bosses
- Boss 1 (Forest Spirit)
- Boss 2 (Dragon)
- Boss 3 (Ice Giant)
- Boss 4 (Sphinx)
- Boss 5 (Thunder Bird)

### Phase 5: UI/UX
- Start menu
- HUD
- Level select
- Death/victory screens
- Polish and transitions

### Phase 6: Audio & Polish
- Sound effects
- Music
- Screen effects
- Final balancing

---

## Future Enhancements (Post-Launch)

### Power-ups
- Speed boost
- Invincibility
- Score multiplier
- Temporary shield

### Achievements
- Reach level 50
- Defeat all 5 bosses
- Complete level without turning
- Speedrun challenges

### Unlockables
- Alternative snake skins
- Custom color schemes
- Cheat codes/modifiers

### Stats Tracking
- Total deaths
- Highest level
- Total food collected
- Boss attempts

---

## Technical Stack Recommendation

### React Implementation
- React for UI and game rendering
- Canvas or SVG for game grid
- CSS animations for particles
- State management (useState/useReducer)
- RequestAnimationFrame for game loop

### Styling
- Tailwind CSS for UI components
- Custom pixel art font (Google Fonts)
- CSS variables for biome theming

### Libraries
- None required for core game
- Optional: Howler.js for audio
- Optional: GSAP for complex animations

---

## File Structure
```
snake-game/
├── components/
│   ├── Game.jsx (main game component)
│   ├── StartMenu.jsx
│   ├── GameGrid.jsx
│   ├── Snake.jsx
│   ├── Food.jsx
│   ├── Obstacle.jsx
│   ├── Boss.jsx
│   ├── HUD.jsx
│   └── GameOver.jsx
├── hooks/
│   ├── useGameLoop.js
│   ├── useKeyboard.js
│   └── useBoss.js
├── utils/
│   ├── collision.js
│   ├── pathfinding.js
│   ├── biomes.js
│   └── bosses.js
├── constants/
│   ├── biomes.js
│   ├── bosses.js
│   └── config.js
└── assets/
    ├── sprites/
    ├── backgrounds/
    └── sounds/
```

---

## Success Metrics

### Gameplay
- Average session length
- Highest level reached
- Boss completion rate
- Death frequency by level

### Engagement
- Restart rate (do players retry?)
- Level select usage
- Time spent per biome

---

## End of Specification

This specification provides complete implementation details for SNAKE. All game mechanics, boss behaviors, progression systems, and technical requirements are defined and ready for development.