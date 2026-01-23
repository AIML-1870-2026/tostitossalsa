# Hello World - Retro Arcade Website Specification


## Overview


A single-page retro arcade-styled "Hello World" website designed for GitHub Pages deployment. The page features a flamboyant 80s arcade aesthetic with extensive CSS animations.


## Technical Stack


- **HTML5** - Semantic markup
- **CSS3** - Animations, gradients, filters
- **Font** - Press Start 2P (Google Fonts)
- **Hosting** - GitHub Pages


## Visual Elements


### Main Content
| Element | Description |
|---------|-------------|
| Title | "HELLO WORLD" with rainbow gradient text |
| Icon | Pixel alien emoji (👾) with spin and bounce animation |
| CTA | "★ PRESS START ★" blinking text |


### UI Chrome
| Element | Location | Content |
|---------|----------|---------|
| Score | Top-left | "SCORE: 9999999" |
| Lives | Top-right | 3 fire hearts (❤️‍🔥) |
| High Score | Bottom-center | Scrolling achievement text |


### Background Effects
- Dark purple/black gradient background
- CRT scanline overlay
- Falling rainbow star particles (15 stars)
- Floating explosion emojis (💥⭐🌟✨)
- Animated rainbow border


## Animations


| Animation | Target | Effect |
|-----------|--------|--------|
| `rainbow` | Title | Color cycling gradient |
| `glow` | Title | Pulsing drop shadow |
| `shake` | Container | Subtle screen shake |
| `bounce` | Alien icon | Vertical bounce |
| `spin` | Alien icon | 360° rotation |
| `blink` | Press Start | Rapid on/off flash |
| `colorSwap` | Press Start | Color cycling |
| `pulse` | Score | Scale breathing |
| `heartbeat` | Lives | Scale pulsing |
| `twinkle` | Stars | Opacity/scale pulse |
| `fall` | Stars | Vertical descent |
| `borderRainbow` | Border | Color cycling |
| `explode` | Explosions | Scale up and fade |
| `flash` | High Score | Opacity flash |


## File Structure


```
/
├── index.html    # Main page (self-contained)
└── spec.md       # This specification
```


## Browser Support


- Modern browsers with CSS3 animation support
- Requires JavaScript disabled-friendly (pure CSS)
- Best viewed on desktop for full effect


## Color Palette


| Color | Hex | Usage |
|-------|-----|-------|
| Black | `#000` | Background |
| Purple | `#1a0030` | Background gradient |
| Red | `#ff0000` | Rainbow cycle |
| Orange | `#ff7700` | Rainbow cycle |
| Yellow | `#ffff00` | Rainbow cycle, high score |
| Green | `#00ff00` | Rainbow cycle |
| Cyan | `#00ffff` | Rainbow cycle, score |
| Blue | `#0077ff` | Rainbow cycle |
| Magenta | `#ff00ff` | Rainbow cycle, glow |
