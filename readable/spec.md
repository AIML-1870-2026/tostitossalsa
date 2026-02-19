# Readable — Color Contrast Explorer: Spec

## Overview

Build a single-page HTML app called **Readable** that lets users explore the readability of background color, text color, and text size combinations. All features update in real-time with no page reloads.

---

## Required Features

### Background Color Controls
- Three sliders labeled R, G, B — each range 0–255
- Each slider is synchronized with an integer input field
- Moving the slider updates the number field; changing the number updates the slider
- Changes are reflected immediately in the Text Display Area

### Text Color Controls
- Same structure as Background Color Controls
- Three synchronized RGB sliders + integer inputs
- Changes reflected immediately in the Text Display Area

### Text Size Control
- Single slider (reasonable range: 10–72px)
- Synchronized with an integer display field
- Changes font size of sample text in real-time

### Text Display Area
- A bordered region rendering sample text (e.g. a pangram or lorem ipsum paragraph)
- Background color, text color, and font size all driven by the controls above
- Updates live as any control changes

### Contrast Ratio Display
- Shows the WCAG contrast ratio between the current background and text colors
- Formatted as `X.XX:1`
- Recalculates automatically whenever either color changes

### Luminosity Displays
- Shows the relative luminance of the background color
- Shows the relative luminance of the text color
- Helps users understand how the contrast ratio is derived

---

## Contrast Ratio Calculation (WCAG)

1. For each RGB channel value `c` (0–255):
   - Normalize: `c_lin = c / 255`
   - Linearize: if `c_lin <= 0.04045` → `c_lin / 12.92`, else `((c_lin + 0.055) / 1.055) ^ 2.4`
2. Relative luminance: `L = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin`
3. Contrast ratio: `(L1 + 0.05) / (L2 + 0.05)` where L1 is the lighter luminance and L2 is the darker
4. Display as `X.XX:1`

---

## Synchronization Behavior

- Slider → number field: updates immediately on `input` event
- Number field → slider: updates immediately on `input` event
- All color/size changes → Text Display Area updates in real-time
- Contrast ratio and luminosity values recalculate on every color change

---

## Enhancement Option A: Vision Type Simulation

Add radio buttons (styled as pill toggles) for:
- Normal vision
- Protanopia (red-blind)
- Deuteranopia (green-blind)
- Tritanopia (blue-blind)
- Monochromacy (complete color blindness)

Apply color transformation matrices to the Text Display Area to simulate each vision type.

**Design note:** When any non-Normal vision type is selected, disable the color controls (sliders + inputs) since the transformations are not invertible. Re-enable them when Normal is reselected.

---

## Enhancement Option B: WCAG Compliance Indicator

Display two pass/fail badges near the contrast ratio:

| Badge | Threshold | Notes |
|-------|-----------|-------|
| Normal Text (AA) | 4.5:1 | Standard body text |
| Large Text (AA) | 3:1 | Text ≥ 18pt or 14pt bold |

- Green + "PASS ✓" when threshold is met
- Red + "FAIL ✗" when threshold is not met
- Update in real-time with contrast ratio

---

## Enhancement Option C: Preset Color Schemes

Provide a set of preset buttons or a dropdown that instantly loads color combinations into the controls:

| Preset Name | Background | Text | Notes |
|-------------|------------|------|-------|
| High Contrast | rgb(255,255,255) | rgb(0,0,0) | WCAG AAA |
| Low Contrast | rgb(200,200,210) | rgb(180,180,190) | Fails WCAG |
| Ocean | rgb(10,40,80) | rgb(180,220,255) | Dark blue theme |
| Sunset | rgb(255,200,100) | rgb(120,30,10) | Warm tones |
| ⚠️ WCAG Fail | rgb(255,255,0) | rgb(255,255,255) | Intentionally bad |

Clicking a preset updates all six RGB sliders/inputs and the display area immediately.

---

## Visual Style

- Colorful and playful aesthetic
- Rounded cards, bold typography, vibrant accent colors
- Fun display font (e.g. Fredoka One) paired with a clean body font (e.g. Nunito)
- Colored slider tracks (R slider tinted red, G tinted green, B tinted blue)
- Smooth transitions on color/size changes

---

## Technical Requirements

- separate .html, .css, and .js files
- No frameworks required; vanilla JS is fine
- Must work in a modern browser without a build step
