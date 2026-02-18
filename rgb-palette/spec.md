# RGB Color Studio — Project Specification

## Overview

A single-page interactive web application called **RGB Color Studio** that lets users explore RGB color mixing and generate accessible color palettes. Built as a self-contained HTML file with vanilla JS and CSS (no build step required).

---

## Tech Stack

- **Single file:** `index.html` — all HTML, CSS, and JS inline
- **No external dependencies** (optional: use CDN for any canvas/animation helpers if needed)
- **No backend** — all logic runs client-side

---

## Feature 1: Animated Color Explorer

An interactive canvas-based visualization for experimenting with RGB color mixing.

### UI
- Three circular "spotlights" or "light sources", one per channel: Red, Green, Blue
- Each spotlight can be dragged around the canvas freely
- Where spotlights overlap, colors blend additively (matching real RGB light mixing):
  - Red + Green = Yellow
  - Red + Blue = Magenta
  - Green + Blue = Cyan
  - Red + Green + Blue = White
- Dark background to make the light blending effect pop visually

### Controls
- RGB sliders (0–255) for each spotlight's intensity
- Opacity/brightness slider per spotlight
- Reset button to return to default positions
- Optional: toggle between "spotlight" and "particle beam" visual modes

### Implementation Notes
- Use HTML5 Canvas with `globalCompositeOperation = "screen"` for additive blending
- Animate spotlights with `requestAnimationFrame`
- Dragging handled via `mousedown`/`mousemove`/`mouseup` and touch events

---

## Feature 2: Palette Generator

A tool that generates harmonious color palettes based on a user-selected base color.

### UI
- Color picker input for selecting a base color
- Dropdown to select palette type:
  - **Complementary** — 2 colors, opposite on the color wheel
  - **Analogous** — 5 colors, adjacent on the color wheel (±30°, ±60°)
  - **Triadic** — 3 colors, evenly spaced (120° apart)
  - **Split-Complementary** — 3 colors, base + two adjacent to its complement
  - **Tetradic** — 4 colors, two complementary pairs (90° apart)
  - **Monochromatic** — 5 shades/tints of the base color
- Display palette as a row of color swatches
- Each swatch shows its hex code; click to copy to clipboard
- Export button to download palette as a PNG or JSON file

### Implementation Notes
- Convert RGB ↔ HSL for color wheel arithmetic
- All palette math is pure JS, no libraries needed

---

## Feature 3: Contrast Checker

Calculates WCAG contrast ratio between any two colors and indicates pass/fail.

### UI
- Two color pickers (foreground and background)
- Live preview showing sample text rendered with those colors
- Displayed contrast ratio (e.g., `4.72:1`)
- Pass/fail badges for:
  - **AA Normal text** (4.5:1 minimum)
  - **AA Large text** (3:1 minimum)
  - **AAA Normal text** (7:1 minimum)
  - **AAA Large text** (4.5:1 minimum)

### Implementation Notes
- WCAG relative luminance formula: `L = 0.2126R + 0.7152G + 0.0722B` (linearized)
- Contrast ratio: `(L1 + 0.05) / (L2 + 0.05)` where L1 is the lighter color

---

## Feature 4: Color Blindness Simulator

Shows how the current palette appears to people with color vision deficiencies.

### UI
- Displayed beneath the Palette Generator output
- Three simulated palette previews side by side:
  - **Protanopia** (red-blind)
  - **Deuteranopia** (green-blind)
  - **Tritanopia** (blue-blind)
- Toggle to show/hide the simulator

### Implementation Notes
- Apply color transformation matrices to each swatch's RGB values
- Use established LMS-space matrices for each deficiency type
- No canvas needed — pure CSS/JS color manipulation on div backgrounds

**Transformation matrices (sRGB linear space):**

```
Protanopia:
  R' = 0.567R + 0.433G
  G' = 0.558R + 0.442G
  B' = 0.242G + 0.758B

Deuteranopia:
  R' = 0.625R + 0.375G
  G' = 0.700R + 0.300G
  B' = 0.300G + 0.700B

Tritanopia:
  R' = 0.950R + 0.050B
  G' = 0.433G + 0.567B
  B' = 0.475G + 0.525B
```

---

## Feature 5: Accessible Palette Mode

An option in the Palette Generator that adjusts generated colors to ensure sufficient contrast.

### UI
- Toggle checkbox: **"Accessible Mode"**
- When enabled, a background color picker appears (defaults to white)
- Generated palette colors are adjusted so each has at least **4.5:1 contrast** against the background
- Adjusted colors are flagged with a small accessibility icon on their swatch

### Implementation Notes
- After generating a palette, check each color's contrast against the background
- If below threshold, darken or lighten the color (shift HSL lightness) until it passes
- Cap attempts at 20 iterations to avoid infinite loops

---

## Layout & Navigation

- Single page with a sticky top nav containing tabs:
  - `Color Explorer` | `Palette Generator` | `Contrast Checker`
- Palette Generator tab includes the Color Blindness Simulator and Accessible Palette Mode as sub-sections below the main palette output
- Responsive: functional on mobile (≥ 375px wide), optimized for desktop

---

## Visual Design

- Dark theme with a near-black background (`#0f0f0f`)
- Accent colors pulled from the currently selected/active palette
- Clean sans-serif typography (system font stack)
- Smooth transitions on all interactive elements (sliders, swatches, toggles)
- Color swatches have a minimum size of 80×80px for usability

---

## File Structure

```
rgb-color-studio/
└── index.html       # Everything: HTML + embedded <style> + embedded <script>
```

---

## Acceptance Criteria

- [ ] Canvas Color Explorer renders additive RGB blending correctly
- [ ] All 6 palette types generate correct harmonious colors
- [ ] Hex codes are copyable from swatches
- [ ] Contrast checker calculates correct WCAG ratios and pass/fail status
- [ ] Color blindness simulator renders visually distinct previews for all 3 types
- [ ] Accessible palette mode adjusts colors and flags changes
- [ ] App works without an internet connection (no required CDN calls)
- [ ] No console errors on load or interaction
