# Decision Neuron - Detailed Specification

## Project Overview
An interactive web application that visualizes and trains a simple decision neuron using supervised learning. Users can create custom decision-making models by defining parameters, adjusting weights, and training the model with yes/no examples. Features an isometric/diorama-style 3D visualization with a cozy video game aesthetic.

---

## Visual Design System

### Aesthetic: Cozy Video Game Vibe
- **Color Palette:**
  - Backgrounds: Warm creamy tones (#FFF8E7, #F5E6D3)
  - Primary accents: Soft greens (#88B888, #A8D5A8) and warm blues (#7BA7BC, #A4C5D9)
  - YES points: Gentle green (#6BCF6B) with soft glow
  - NO points: Soft red/coral (#F07167) with soft glow
  - UI panels: Warm wooden browns (#D4A574, #B8956A)
  
- **Typography:**
  - Headers: Rounded, friendly font (similar to Varela Round or Quicksand)
  - Body/Math: Clean monospace for equations (JetBrains Mono or similar)
  - Sizes: Comfortable reading sizes, good hierarchy
  
- **UI Elements:**
  - Rounded corners on all panels (8-12px border radius)
  - Subtle texture overlays (paper grain, soft noise at ~5% opacity)
  - Gentle drop shadows (soft, warm-toned)
  - Smooth transitions and animations (300-500ms easing)
  
- **Interactive Feedback:**
  - Hover states: Gentle lift/glow effect
  - Active states: Slight press-down effect
  - Success animations: Soft particle bursts
  - Gentle floating/bobbing animations for points

---

## Application Layout

### Overall Structure (Desktop: 1920x1080 optimal)

```
┌─────────────────────────────────────────────────────────────┐
│  [Decision Neuron Lab 🧠]           [History ▼] [New Decision] │
├──────────────┬──────────────────────────┬──────────────────┤
│              │                          │                  │
│   CONTROLS   │   ISOMETRIC GRAPH       │   INFO/TEST      │
│   (Left)     │   (Center-Top)          │   (Right)        │
│              │                          │                  │
│              │                          │                  │
├──────────────┴──────────────────────────┴──────────────────┤
│                                                             │
│              MATH PANEL (Bottom)                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Grid Layout Breakdown
- **Top Bar:** 60px height, full width
- **Main Area:** 2x2 grid
  - Left Panel (Controls): 25% width
  - Center (Graph): 50% width, 60% height
  - Right Panel (Info): 25% width
  - Bottom (Math): Full width, 40% height

---

## Component Specifications

### 1. Top Navigation Bar

**Elements:**
- **Title:** "Decision Neuron Lab" with small brain emoji/icon
- **Decision Name Input:** Editable field showing current decision name
  - Default: "Untitled Decision"
  - Auto-save on blur
- **History Dropdown:** 
  - Shows last 5 saved decisions
  - Each entry: thumbnail + name + date
  - Click to load
- **New Decision Button:**
  - Prominent, cozy button style
  - Saves current decision before creating new

**Styling:**
- Background: Slightly darker warm tone
- Soft bottom border/shadow
- Icons: Simple, rounded style

---

### 2. Left Panel - Controls

**Section 1: Decision Name**
- Large, friendly input field at top
- Placeholder: "Name your decision..."

**Section 2: Parameters**
- **Parameter List:**
  - Each parameter shows:
    - Name input field (e.g., "Time Available")
    - Unit input (optional, e.g., "minutes")
    - Range inputs: Min and Max values
  - Delete button (X) for each parameter
  - Drag handle to reorder

- **Add Parameter Button:**
  - "Add Parameter +" button at bottom of list
  - Max 6 parameters (practical limit)

**Section 3: Weights & Bias**
- **Weight Sliders:**
  - One slider per parameter
  - Range: -2.0 to +2.0
  - Step: 0.1
  - Shows current value next to slider
  - Color-coded by positive/negative value

- **Bias Slider:**
  - Distinct visual treatment (different color/style)
  - Range: -5.0 to +5.0
  - Step: 0.1
  - Label: "Bias (y-intercept)"

**Section 4: Action Buttons**
- **Reset Button:** Clears all weights to 0
- **Train Mode Button:** Enters training mode
  - Changes to "Exit Training" when active
  - Prominent visual state change

**Styling:**
- Wooden panel aesthetic with subtle texture
- Gentle padding (16-24px)
- Collapsible sections with smooth accordion animation
- Scrollable if content exceeds height

---

### 3. Center Panel - Isometric Graph

#### 3A. Graph Canvas

**Isometric View Setup:**
- **Camera Angle:** Fixed isometric (~30° from horizontal)
- **Projection:** Orthographic for true isometric feel
- **Rotation:** 90° increments (N, E, S, W cardinal directions)
- **Zoom:** 0.5x to 2x range, smooth scrolling

**Visual Elements:**

1. **Base Platform:**
   - Wooden texture or grassy terrain
   - Grid lines: Soft dotted/dashed in light color
   - Size: Scales to fit data range
   - Slight shadow beneath for depth

2. **Axes:**
   - Style: Wooden stakes or gentle tree branches
   - Labels: Parameter names at endpoints
   - Tick marks: Every unit or smart intervals
   - Color: Natural wood brown or soft gray

3. **Decision Boundary:**
   - **2D (2 params):** Glowing line with particle trail
   - **3D (3 params):** Translucent plane with soft glow edges
   - Color: Magical blue/cyan (#7BA7BC, 40% opacity)
   - Edge particles: Gentle floating sparkles
   - Updates smoothly when weights change (500ms transition)

4. **Data Points:**
   - **YES Points:**
     - Green gems/orbs (#6BCF6B)
     - Soft glow effect
     - Gentle idle bobbing animation
   - **NO Points:**
     - Red/coral crystals (#F07167)
     - Soft glow effect
     - Gentle idle bobbing animation
   - **Point Size:** Scales with zoom (6-12px radius)
   - **Hover State:**
     - Point enlarges slightly
     - Brighter glow
     - Tooltip appears with coordinates and prediction

5. **Lighting:**
   - Warm ambient light from top-left (golden hour)
   - Subtle rim lighting on points
   - Soft shadows on base

**Dimension Selector (for >3 parameters):**
- Position: Top-right corner of graph
- Style: Cute toggle switches or radio buttons
- Shows: "Display Dimensions: [X▼] [Y▼] [Z▼]"
- Dropdowns show all parameter names
- Smooth cross-fade when changing dimensions (800ms)

**Camera Controls:**
- **Rotation Buttons:** Four arrows (N/E/S/W) around graph edge
- **Zoom:** Scroll wheel or +/- buttons
- **Reset View Button:** Returns to default angle/zoom

#### 3B. Training Mode Overlay

When training mode is active:

**Visual Changes:**
- Slight vignette darkens edges
- "Training Mode" badge in top-left corner
- Progress indicator: "Point 3/10"

**Point Generation:**
- 10 random points generated in parameter space
- Points appear one at a time with drop-in animation:
  - Drops from above
  - Gentle bounce on landing
  - Soft particle burst

**Labeling Interface:**
- Current point glows brightly and pulses
- Large, friendly YES/NO buttons appear:
  - Position: Floating near the point or bottom-center
  - Style: Big, rounded, cozy game buttons
  - Keyboard shortcuts: Y/N or ←/→

**Animation Flow:**
1. Point drops in → pulses
2. User clicks YES or NO
3. Point changes color (green/red) with particle burst
4. Point settles into position
5. Next point drops in
6. After 10 labels: "Calculating..." animation
7. Weights update smoothly
8. Success message with gentle celebration

---

### 4. Right Panel - Info & Testing

**Section 1: Current Decision Function**
```
Decision Function:
━━━━━━━━━━━━━━━━━━
y = w₁x₁ + w₂x₂ + w₃x₃ + b

With values:
y = (0.5)x₁ + (0.3)x₂ + (0.8)x₃ + (-1.2)
```
- Clean, readable math formatting
- Parameter names instead of x₁, x₂... when possible
- Updates in real-time as weights change

**Section 2: Test Your Decision**
- **Input Fields:**
  - One input per parameter
  - Shows parameter name and unit
  - Smart default values (middle of range)
  
- **Calculate Button:**
  - Runs decision function
  - Smooth animation while "thinking"

- **Result Display:**
  - Large, friendly result:
    - "YES ✓" in green if result > 0
    - "NO ✗" in red if result < 0
    - Shows exact score value
  - Visual indicator: Progress bar or thermometer
  - Suggestion: "Strong Yes" / "Weak No" based on magnitude

**Section 3: Model Stats (if trained)**
- Accuracy on training data
- Number of training points
- Last trained timestamp

**Styling:**
- Clipboard or notebook page aesthetic
- Clean sections with gentle dividers
- Scrollable if needed

---

### 5. Bottom Panel - Math Visualization

**Display Mode: Real-time Calculation**

Shows the most recent calculation (from test section or hover):

```
📊 Current Calculation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Decision Function:
y = w₁(Time) + w₂(Energy) + w₃(Tasks) + bias

Point: [45 min, 7 energy, 2 tasks]

Step-by-step:
  w₁ × Time     = 0.5 × 45    = 22.5
  w₂ × Energy   = 0.3 × 7     = 2.1
  w₃ × Tasks    = -0.8 × 2    = -1.6
  bias          =             = -1.2
                              -------
  Sum                         = 21.8

Result: 21.8 > 0  →  YES ✓
```

**Display Mode: Training Animation**

During training, shows:

```
🎓 Training in Progress (Point 7/10)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Labeled Points:
✓ [30, 8, 1] → YES
✓ [15, 3, 5] → NO
✓ [60, 9, 0] → YES
... (shows recent 5)

After all 10 labels:

Calculating Optimal Weights...
━━━━━━━━━━━━━━━━━━━━━━━━
Using Least Squares Method:

Xᵀ X = [matrix shown]
Xᵀ y = [vector shown]

Solving: w = (XᵀX)⁻¹Xᵀy

New weights:
  w₁ (Time): 0.42 → 0.53 ↑
  w₂ (Energy): 0.31 → 0.38 ↑
  w₃ (Tasks): -0.75 → -0.82 ↓
  bias: -1.20 → -0.95 ↑

✨ Training Complete!
```

**Styling:**
- Journal/notebook aesthetic with soft paper texture
- Monospace font for numbers and equations
- Animated number updates (count-up effect)
- Gentle glow on important values
- Progress bars during calculation

---

## Preset: "Should I Watch YouTube?"

### Preset Configuration

**Decision Name:** "Should I Watch YouTube?"

**Parameters (3):**
1. **Time Available**
   - Unit: "minutes"
   - Range: 0 - 120
   - Default weight: 0.5

2. **Energy Level**
   - Unit: "1-10 scale"
   - Range: 1 - 10
   - Default weight: 0.3

3. **Tasks Remaining**
   - Unit: "count"
   - Range: 0 - 10
   - Default weight: -0.8

**Default Bias:** -1.2

**Pre-loaded Training Data (10 points):**
```javascript
[
  { values: [15, 3, 5], label: "NO" },   // Low time, low energy, many tasks
  { values: [60, 8, 0], label: "YES" },  // Lots of time, high energy, no tasks
  { values: [30, 5, 2], label: "NO" },   // Medium time, medium energy, some tasks
  { values: [90, 9, 1], label: "YES" },  // Lots of time, high energy, few tasks
  { values: [10, 2, 8], label: "NO" },   // Low time, low energy, many tasks
  { values: [45, 7, 1], label: "YES" },  // Good time, good energy, few tasks
  { values: [20, 4, 6], label: "NO" },   // Low time, low energy, many tasks
  { values: [75, 8, 2], label: "YES" },  // Good time, high energy, few tasks
  { values: [25, 6, 4], label: "NO" },   // Low time, medium energy, several tasks
  { values: [50, 9, 0], label: "YES" }   // Medium time, high energy, no tasks
]
```

**Starting View:**
- All points already plotted and colored
- Decision boundary already visible
- User can immediately test values or retrain

---

## History System

### Storage
- **Method:** localStorage (browser-based)
- **Key:** `decision-neuron-history`
- **Max Stored:** 5 most recent decisions
- **Auto-save:** On any change (debounced 1 second)

### Data Structure
```javascript
{
  id: "uuid-string",
  name: "Should I Watch YouTube?",
  createdAt: "2024-01-15T10:30:00Z",
  lastModified: "2024-01-15T11:45:00Z",
  parameters: [
    { name: "Time Available", unit: "minutes", min: 0, max: 120 },
    { name: "Energy Level", unit: "1-10", min: 1, max: 10 },
    { name: "Tasks Remaining", unit: "count", min: 0, max: 10 }
  ],
  weights: [0.53, 0.38, -0.82],
  bias: -0.95,
  trainingData: [
    { values: [15, 3, 5], label: "NO" },
    // ... all training points
  ],
  thumbnail: "base64-image-data" // Optional: mini screenshot of graph
}
```

### History Panel UI

**Dropdown from Top Bar:**
- Triggered by "History ▼" button
- Appears as dropdown menu (300px wide)
- Shows 5 most recent decisions

**Each History Item:**
```
┌────────────────────────────────┐
│ [Thumbnail]  Should I Watch... │
│              3 parameters      │
│              Jan 15, 11:45 AM  │
│              [Load] [Delete]   │
└────────────────────────────────┘
```

- **Thumbnail:** 60x60px isometric view snapshot (if available)
- **Name:** Truncated to fit (tooltip shows full name)
- **Metadata:** Parameter count, last modified time
- **Actions:**
  - Load button: Restores this decision
  - Delete button (×): Removes from history
  - Click anywhere else on item also loads it

**Empty State:**
- "No saved decisions yet"
- Encouraging message: "Create your first decision!"

---

## Training Algorithm

### Simple Supervised Learning Approach

**Method:** Ordinary Least Squares (Linear Regression)

**Process:**
1. Collect 10 labeled points from user
2. Build design matrix X (n × p+1, includes bias column)
3. Build target vector y (YES = 1, NO = -1 or 0)
4. Solve: w = (XᵀX)⁻¹Xᵀy
5. Update weight sliders with new values
6. Animate decision boundary transition

**Alternative (if matrix inversion issues):**
- Use gradient descent with ~50-100 iterations
- Learning rate: 0.01
- Show progress with animated loss decrease

**Edge Cases:**
- If all points are same label: Set weights to 0, show message
- If matrix is singular: Fallback to gradient descent
- If user cancels mid-training: Discard partial data

---

## Technical Stack Recommendations

### Core Technologies
- **Framework:** React 18+ (with hooks)
- **3D Graphics:** Three.js + React Three Fiber
- **Math:** math.js or simple custom linear algebra
- **State Management:** React Context or Zustand (lightweight)
- **Styling:** Tailwind CSS + CSS Modules for custom cozy styles
- **Storage:** localStorage API
- **Build Tool:** Vite

### Key Libraries
```json
{
  "react": "^18.2.0",
  "react-three-fiber": "^8.15.0",
  "three": "^0.160.0",
  "@react-three/drei": "^9.92.0",
  "mathjs": "^12.3.0",
  "zustand": "^4.4.7",
  "uuid": "^9.0.1",
  "date-fns": "^3.0.0"
}
```

### File Structure
```
src/
├── components/
│   ├── TopBar/
│   ├── ControlPanel/
│   ├── IsometricGraph/
│   │   ├── Scene.jsx
│   │   ├── DataPoint.jsx
│   │   ├── DecisionBoundary.jsx
│   │   ├── Platform.jsx
│   │   └── TrainingMode.jsx
│   ├── InfoPanel/
│   ├── MathPanel/
│   └── HistoryDropdown/
├── hooks/
│   ├── useDecisionModel.js
│   ├── useTraining.js
│   └── useHistory.js
├── utils/
│   ├── math.js (linear algebra helpers)
│   ├── storage.js
│   └── presets.js
├── styles/
│   ├── globals.css
│   └── cozy-theme.css
└── App.jsx
```

---

## User Flows

### Flow 1: First-Time User with Preset

1. User lands on app
2. Sees preset card: "Should I Watch YouTube?" with description
3. Clicks preset card
4. Graph loads with 10 pre-plotted points (YES/NO colored)
5. Decision boundary visible
6. User can:
   - Adjust weight sliders → see boundary move
   - Test values in right panel
   - View math calculations
   - Click "Train Mode" to re-train with new points

### Flow 2: Creating Custom Decision

1. User clicks "New Decision" button
2. Current decision auto-saves to history
3. Fresh blank canvas loads
4. User names decision: "Should I Go to the Gym?"
5. Adds parameters:
   - "Energy Level" (1-10)
   - "Time Available" (0-120 min)
   - "Weather Quality" (1-10)
6. Clicks "Train Mode"
7. 10 random points appear one by one
8. User labels each YES/NO based on their preference
9. Algorithm calculates weights
10. Decision boundary appears
11. User tests scenarios in test panel

### Flow 3: Returning to Saved Decision

1. User clicks "History" dropdown
2. Sees list of 5 recent decisions with thumbnails
3. Clicks "Should I Watch YouTube?" from 2 days ago
4. Graph loads with previous state (weights, points, etc.)
5. User adjusts bias slider to tune decision
6. Tests new scenarios
7. Changes auto-save

### Flow 4: Training Mode Detail

1. User in any decision clicks "Train Mode"
2. Button changes to "Exit Training" with different style
3. UI state changes:
   - Graph gets vignette overlay
   - "Training Mode - Point 1/10" badge appears
   - Controls panel dims slightly (non-interactive)
4. First point drops onto graph with bounce animation
5. Point pulses, YES/NO buttons appear
6. User presses Y key (or clicks YES)
7. Point turns green, particle burst, settles
8. Counter updates: "Point 2/10"
9. Next point drops in
10. ... repeat until 10 points labeled
11. "Calculating..." message appears in math panel
12. Math panel shows matrix calculation steps (animated)
13. Weights update with smooth slider animation
14. Decision boundary morphs to new position
15. "✨ Training Complete!" message
16. Training mode exits automatically
17. All UI returns to normal state

---

## Interaction Details

### Graph Interactions

**Mouse/Touch:**
- **Click on Point:** Show tooltip with exact coordinates
- **Drag:** Rotate view (if rotation enabled)
- **Scroll:** Zoom in/out
- **Hover over Point:** Slight enlarge + glow
- **Hover over Boundary:** Show equation tooltip

**Keyboard (when graph focused):**
- **Arrow Keys:** Rotate view in 90° increments
- **+/-:** Zoom in/out
- **R:** Reset view to default
- **Spacebar:** Toggle training mode (if not already in training)

### Slider Interactions

**Weight/Bias Sliders:**
- **Drag:** Smooth update with immediate visual feedback
- **Click on Track:** Jump to value
- **Keyboard (when focused):**
  - Arrow keys: ±0.1 adjustment
  - Shift + Arrows: ±0.5 adjustment
  - Home/End: Min/max values
- **Double-click:** Reset to 0

**Visual Feedback:**
- Slider thumb shows current value in tooltip while dragging
- Decision boundary updates in real-time (throttled to 60fps)
- Math panel updates calculation live

---

## Responsive Design

### Breakpoints

**Desktop (1920x1080+):** Full 2x2 layout as specified

**Laptop (1366x768):** Slightly compressed, same layout

**Tablet (768-1024px):**
- Switch to stacked layout:
  1. Top bar (full width)
  2. Graph (full width, 50% height)
  3. Controls + Info (side-by-side, 50/50)
  4. Math panel (full width, collapsible)

**Mobile (< 768px):**
- Full vertical stack:
  1. Top bar (hamburger menu for history)
  2. Graph (full width, square aspect)
  3. Controls (full width, accordion sections)
  4. Test panel (full width)
  5. Math panel (full width, collapsed by default)
- Training mode YES/NO buttons: Large, thumb-friendly
- Dimension selector: Dropdown instead of inline toggles

---

## Animations & Transitions

### Global Timing
- **Quick:** 200ms (hover states, small UI changes)
- **Standard:** 300ms (slider updates, panel toggles)
- **Slow:** 500ms (decision boundary morphing, view transitions)
- **Special:** 800ms (dimension switching, training complete)

### Easing Functions
- **UI Elements:** cubic-bezier(0.4, 0.0, 0.2, 1) [Material ease-out]
- **Physics (points):** cubic-bezier(0.34, 1.56, 0.64, 1) [Back ease-out for bounce]
- **Boundary:** cubic-bezier(0.25, 0.46, 0.45, 0.94) [Gentle ease-in-out]

### Key Animations

**Point Drop-in (Training Mode):**
```
1. Start: y = +5 (above view), opacity = 0, scale = 0.5
2. Animate: 600ms with back-easeOut
3. End: y = final position, opacity = 1, scale = 1
4. Add: 200ms overshoot bounce
5. Particle burst on landing
```

**Decision Boundary Morph:**
```
1. On weight/bias change:
2. Tween boundary position over 500ms
3. Use linear interpolation for plane equation
4. Add subtle glow pulse during transition
```

**Weight Slider Update (from training):**
```
1. Calculate new weight value
2. Animate slider from old → new over 800ms
3. Count-up number display simultaneously
4. Flash subtle highlight on slider
```

**Success Celebration (training complete):**
```
1. Particle burst from all YES points (green)
2. Particle burst from all NO points (red)
3. Decision boundary glows brighter for 1 second
4. "✨ Training Complete!" message fades in
5. Confetti-like particles fall gently (optional)
```

---

## Accessibility

### Keyboard Navigation
- Full tab order through all interactive elements
- Visible focus indicators (cozy style: soft glow instead of harsh outline)
- Escape key: Exit training mode, close dropdowns
- Enter/Space: Activate buttons

### Screen Reader Support
- Semantic HTML elements
- ARIA labels on all controls
- Live region announcements for:
  - Training progress
  - Weight changes
  - Test results
- Alt text for all icons/images

### Visual Accessibility
- Color contrast: WCAG AA minimum (4.5:1 for text)
- Don't rely solely on color (YES/NO use icons too: ✓/✗)
- Adjustable zoom without breaking layout
- Optional high-contrast mode toggle

### Motor Accessibility
- Large click targets (min 44x44px on mobile)
- Sliders have keyboard controls
- No time-sensitive actions (except optional training timer)

---

## Performance Considerations

### Optimization Targets
- **Initial Load:** < 2 seconds on 3G
- **Bundle Size:** < 500KB gzipped
- **Interaction Latency:** < 16ms (60fps)
- **Graph Rendering:** 60fps with up to 50 points

### Strategies

**Code Splitting:**
- Lazy load Three.js components
- Separate preset data bundle
- Dynamic import for math libraries

**Rendering:**
- Use React.memo for expensive components
- Throttle slider updates (60fps max)
- Debounce auto-save (1 second)
- Limit graph point rendering (simplify distant points)

**State Management:**
- Avoid unnecessary re-renders
- Use selective subscriptions (Zustand slices)
- Memoize expensive calculations

**Assets:**
- Optimize textures (compressed, appropriate sizes)
- Use CSS for simple effects over images
- Lazy load history thumbnails

---

## Error Handling

### User-Facing Errors

**Input Validation:**
- Parameter names: Required, max 30 chars
- Ranges: Min < Max, reasonable bounds
- Show inline validation messages (friendly tone)
- Example: "Oops! Max should be bigger than Min 😊"

**Training Issues:**
- All same label: "All your points are the same! Try mixing YES and NO answers."
- Too few points: "Label at least 5 points to train."
- Numerical issues: "Hmm, something went wrong with the math. Try different points?"

**Storage Errors:**
- localStorage full: "Your browser storage is full. Delete some history to continue."
- localStorage blocked: "Can't save your work. Check browser settings."
- Corrupted data: "This decision file is damaged. Starting fresh!"

**General Approach:**
- Never show raw error messages
- Always offer a solution or next step
- Use friendly, encouraging language
- Provide reset/retry options

### Developer Errors (Console Only)
- Log detailed errors to console
- Include component stack traces
- Warn on performance issues
- Helpful messages for common setup mistakes

---

## Future Enhancements (Out of Scope for V1)

### Potential Features
- Export decision as JSON/image
- Share decision URL with others
- Multiple training algorithms (SVM, neural net)
- Animated decision boundary history slider
- Sound effects (cozy game-style chimes)
- More presets (Should I buy this?, Go on a date?, etc.)
- Collaborative training (multiple users label points)
- Dark mode toggle
- Seasonal themes/skins
- Mobile AR view of decision boundary

---

## Testing Checklist

### Functional Tests
- [ ] Create new decision with 2, 3, 4+ parameters
- [ ] Train model with all YES, all NO, mixed labels
- [ ] Adjust weights/bias and verify boundary updates
- [ ] Test decision with various input values
- [ ] Save and load from history
- [ ] Delete from history
- [ ] Switch between decisions without data loss
- [ ] Load YouTube preset correctly
- [ ] Training mode completes successfully
- [ ] Exit training mode mid-flow
- [ ] Dimension selector with 4+ parameters

### Visual Tests
- [ ] Isometric graph renders correctly
- [ ] Points animate smoothly
- [ ] Decision boundary updates in real-time
- [ ] Math panel shows accurate calculations
- [ ] Cozy aesthetic consistent across all panels
- [ ] Responsive layout works on all breakpoints
- [ ] History thumbnails display correctly

### Edge Cases
- [ ] Zero parameters (prevent or handle gracefully)
- [ ] Single parameter (show 1D line)
- [ ] Ten parameters (verify dimension selector)
- [ ] Very large/small weight values
- [ ] Extremely skewed data (all in one corner)
- [ ] Rapid slider changes (performance)
- [ ] localStorage full scenario
- [ ] Corrupt history data recovery

### Browser Compatibility
- [ ] Chrome (latest, -1)
- [ ] Firefox (latest, -1)
- [ ] Safari (latest, -1)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Development Phases

### Phase 1: Core Framework (Week 1)
- Set up React + Vite project
- Implement basic layout (2x2 grid)
- Create cozy CSS theme
- Build control panel with sliders
- Basic state management

### Phase 2: Isometric Graph (Week 2)
- Integrate Three.js / React Three Fiber
- Create isometric camera setup
- Render platform and axes
- Display data points (static first)
- Add basic camera controls

### Phase 3: Decision Logic (Week 3)
- Implement decision function calculation
- Create decision boundary visualization (2D and 3D)
- Real-time boundary updates from weights
- Math panel with live calculations
- Test panel functionality

### Phase 4: Training Mode (Week 4)
- Point generation algorithm
- Training UI flow
- Least squares implementation
- Smooth weight animation after training
- Success celebration effects

### Phase 5: Presets & History (Week 5)
- YouTube preset implementation
- localStorage history system
- History dropdown UI
- Save/load functionality
- Thumbnail generation

### Phase 6: Polish & Animation (Week 6)
- Cozy animations throughout
- Particle effects
- Sound effects (optional)
- Accessibility improvements
- Performance optimization
- Bug fixes

---

## Technical Notes

### Math Implementation Details

**Decision Function:**
```javascript
function decide(parameters, weights, bias) {
  let sum = bias;
  for (let i = 0; i < parameters.length; i++) {
    sum += parameters[i] * weights[i];
  }
  return sum; // Positive = YES, Negative = NO
}
```

**Least Squares Training:**
```javascript
function trainModel(trainingData) {
  // trainingData: [{values: [x1,x2,x3], label: "YES"/"NO"}, ...]
  
  const X = trainingData.map(d => [1, ...d.values]); // Add bias column
  const y = trainingData.map(d => d.label === "YES" ? 1 : -1);
  
  // Compute: w = (X^T X)^(-1) X^T y
  const XT = transpose(X);
  const XTX = multiply(XT, X);
  const XTXinv = inverse(XTX);
  const XTy = multiply(XT, y);
  const weights = multiply(XTXinv, XTy);
  
  return {
    bias: weights[0],
    weights: weights.slice(1)
  };
}
```

**Decision Boundary (3D):**
For 3 parameters: w₁x + w₂y + w₃z + b = 0

Solve for z: z = -(w₁x + w₂y + b) / w₃

Generate mesh by sampling x,y grid and computing z values.

### Three.js Scene Setup

```javascript
// Isometric camera setup
const camera = new THREE.OrthographicCamera(
  -10, 10,  // left, right
  10, -10,  // top, bottom
  0.1, 1000 // near, far
);

// Isometric angle: ~35.264° from horizontal
camera.position.set(10, 10, 10);
camera.lookAt(0, 0, 0);

// Disable perspective, use orthographic
camera.updateProjectionMatrix();
```

### LocalStorage Schema

```javascript
// Key: "decision-neuron-history"
// Value: JSON array of decision objects

{
  version: "1.0",
  decisions: [
    {
      id: "uuid",
      name: "string",
      createdAt: "ISO date string",
      lastModified: "ISO date string",
      parameters: [/* param objects */],
      weights: [/* numbers */],
      bias: number,
      trainingData: [/* labeled points */]
    },
    // ... up to 5 total
  ]
}
```

---

## Glossary

- **Decision Neuron:** A simple linear model that outputs YES/NO based on weighted inputs
- **Parameters:** The input features (e.g., Time, Energy, Tasks)
- **Weights:** Coefficients that determine each parameter's importance
- **Bias:** Y-intercept, shifts the decision boundary
- **Decision Boundary:** The line/plane separating YES from NO regions
- **Training:** Process of finding optimal weights from labeled examples
- **Isometric View:** Pseudo-3D perspective with no vanishing point
- **Least Squares:** Mathematical method to find best-fit line/plane

---

## Design Assets Needed

### Icons (Simple, Rounded Style)
- Brain emoji/icon (logo)
- Plus sign (add parameter)
- X/close (delete, close)
- Checkmark (YES)
- X-mark (NO)
- Refresh (reset)
- History/clock (history dropdown)
- Sparkles (training complete)
- Arrow keys (rotation controls)
- Zoom +/- (zoom controls)

### Textures
- Wood grain (panels, platform)
- Paper grain (math panel)
- Subtle noise overlay (backgrounds)
- Grass/terrain (optional for platform)

### Particles
- Sparkle sprites (boundary glow)
- Dust/magic particles (training animations)
- Confetti (celebration, optional)

### Colors Reference
```css
:root {
  /* Backgrounds */
  --bg-cream: #FFF8E7;
  --bg-warm: #F5E6D3;
  
  /* Panels */
  --panel-wood-light: #D4A574;
  --panel-wood-dark: #B8956A;
  
  /* Data Points */
  --point-yes: #6BCF6B;
  --point-no: #F07167;
  
  /* Boundary */
  --boundary-blue: #7BA7BC;
  
  /* Accents */
  --accent-green: #88B888;
  --accent-blue: #A4C5D9;
  
  /* Text */
  --text-dark: #2D3436;
  --text-medium: #636E72;
  --text-light: #B2BEC3;
}
```

---

## End of Specification

**Total Lines:** ~985

This specification covers all discussed features and provides comprehensive guidance for implementation with Claude Code. The cozy video game aesthetic, isometric graph, training mode, presets, and history system are all detailed with technical specifics, user flows, and design guidelines.
