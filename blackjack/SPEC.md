# Blackjack Web Game — Claude Code Specification

## Project Overview

A fully-featured, browser-based Blackjack game built with HTML5, CSS3, and vanilla JavaScript (or React). The game features rich visual assets, sound effects, split mechanics, betting, and a choice between traditional and high-contrast card styles.

---

## Tech Stack

- **Frontend:** React (single-page app) or vanilla HTML/CSS/JS
- **Audio:** Web Audio API or Howler.js for sound effects
- **Assets:** SVG or PNG cards, rival player avatar, poker chip graphics
- **State Management:** React `useState` / `useReducer` (or plain JS module state)
- **No backend required** — all logic runs client-side

---

## Visual Layout

### Screen Regions (top → bottom)

1. **Header Bar** — Game title, chip balance display, card style toggle (Traditional / High Contrast)
2. **Table Area** — Full-screen felt background image
   - **Dealer Zone** (top half): rival player avatar + dealer's hand
   - **Deck & Chips Zone** (center-right): visual deck stack + poker chip stacks representing available denominations
   - **Player Zone** (bottom half): player's hand(s); if split, two side-by-side hand panels
3. **Action Bar** (bottom): Hit, Stand, Double Down, Split (enabled contextually), Deal buttons
4. **Bet Panel** (above action bar): integer input field + chip quick-select buttons (1, 5, 25, 100, 500); "Place Bet" confirm button

### Asset Requirements

| Asset | Description |
|---|---|
| `rival_player.png` | Dealer/rival character avatar (shown top-center) |
| `card_back.png` | Back face of a card (shown for hole card) |
| `cards_traditional/` | 52 standard card images (e.g., `AS.png`, `KH.png`) |
| `cards_highcontrast/` | 52 high-contrast card images (bold outlines, large symbols, black/white/red only) |
| `chip_1.png`, `chip_5.png`, `chip_25.png`, `chip_100.png`, `chip_500.png` | Poker chip graphics |
| `deck_stack.png` | Visual stack representing the shoe/deck |

> **Note:** Assets can be generated via SVG at runtime if image files are unavailable. Provide SVG fallbacks for all card and chip assets.

---

## Game Logic

### Core Rules

- Standard casino Blackjack rules (Vegas Strip)
- Dealer hits on soft 16, stands on soft 17
- Blackjack pays 3:2
- No insurance mechanic required (optional stretch goal)
- Infinite deck (shuffled randomly each round) or 6-deck shoe (configurable constant)

### Betting

- Player starts with a configurable chip balance (default: **1000 chips**)
- Bet is entered via:
  - **Integer text input** — validates that value is a positive integer ≤ current balance
  - **Quick-chip buttons** — clicking a chip adds its denomination to the current bet
  - **Clear Bet** button resets bet to 0
- Bet is locked in when "Deal" is pressed
- Minimum bet: 1; Maximum bet: player's full balance

### Split Mechanic

- **Trigger condition:** Player's first two cards share the same numeric value (e.g., two 7s, two face cards, two Aces)
- Split button becomes active only when this condition is met and player has sufficient balance to match the original bet
- On split:
  - Cards are separated into two independent hands displayed side by side
  - Each hand receives one new card automatically
  - Player plays each hand in sequence (left → right)
  - Aces split: each Ace receives exactly one card; no further hits allowed on split Aces
  - Wins/losses resolved independently per hand
- Only one split allowed per round (no re-splitting)

### Hand Resolution

- Bust: hand value > 21 → immediate loss
- Blackjack (natural 21 on first two cards): pays 3:2, shown instantly unless dealer also has Blackjack (push)
- Standard win: pays 1:1
- Push: bet returned

---

## Card Style Toggle

- **Toggle control:** Switch or button in the header, labeled "Traditional" / "High Contrast"
- **Traditional:** Standard red/black card deck with suits (♠ ♥ ♦ ♣) in classic font
- **High Contrast:** Bold, enlarged rank and suit symbols; black background with white/red only; accessible for low-vision users
- Toggle applies immediately to all visible cards and persists for the session
- Implemented by swapping the asset directory or CSS class on card components

---

## Sound Effects

All sounds use the Web Audio API or Howler.js. Provide royalty-free `.mp3` / `.ogg` files or generate tones programmatically.

| Event | Sound |
|---|---|
| Card dealt | Short card flip/swoosh |
| Chip placed | Chip clink |
| Player wins | Cheerful win jingle (1–2 sec) |
| Player loses | Low "wah-wah" or thud |
| Blackjack | Fanfare / coins sound |
| Bust | Dramatic descending tone |
| Dealer reveals hole card | Card flip sound |
| Shuffle | Shuffle/riffle sound (played at round start) |
| Split | Two-tone pop confirming split |
| Push | Neutral ding |

- **Mute button** in header to toggle all audio on/off
- Audio context initialized on first user gesture (browser autoplay policy compliance)

---

## UI / UX Details

### Animations

- Cards deal onto table with a slide-in animation (150–200ms ease-out)
- Chip stack visually updates when bet changes
- Winning chips "slide" back to player's stack
- Bust causes hand to flash red briefly
- Dealer avatar reacts: neutral → thinking (during player turn) → happy/sad based on outcome (via CSS class swap or simple sprite sheet)

### Responsive Design

- Minimum supported width: 768px (tablet landscape)
- Optimal: 1280×800 desktop
- Table layout scales proportionally; action bar stays pinned to bottom

### Accessibility

- High-contrast card mode improves readability
- All interactive elements keyboard-navigable (Tab / Enter / Space)
- ARIA labels on buttons and card elements
- Mute button has visible icon + text label

---

## File Structure

```
blackjack/
├── index.html
├── src/
│   ├── main.js / App.jsx          # Entry point
│   ├── game/
│   │   ├── deck.js                # Deck creation, shuffle, deal
│   │   ├── hand.js                # Hand value calculation, bust/blackjack checks
│   │   ├── gameState.js           # Central state machine
│   │   └── rules.js               # Dealer AI, payout logic
│   ├── components/
│   │   ├── Table.jsx              # Main table layout
│   │   ├── Card.jsx               # Single card component (traditional/high-contrast)
│   │   ├── Hand.jsx               # Hand display (single or split)
│   │   ├── DealerAvatar.jsx       # Rival player avatar + dealer hand
│   │   ├── BetPanel.jsx           # Bet input + chip buttons
│   │   ├── ActionBar.jsx          # Hit/Stand/Split/Double/Deal buttons
│   │   ├── ChipBalance.jsx        # Player's chip total display
│   │   ├── DeckVisual.jsx         # Deck stack graphic
│   │   └── CardStyleToggle.jsx    # Traditional / High Contrast switch
│   ├── audio/
│   │   ├── soundManager.js        # Audio context, load & play sounds
│   │   └── sounds/                # .mp3 / .ogg files
│   └── assets/
│       ├── rival_player.png
│       ├── card_back.png
│       ├── cards_traditional/
│       └── cards_highcontrast/
├── public/
│   └── chips/                     # chip_1.png … chip_500.png
└── package.json
```

---

## Game State Machine

```
IDLE → BETTING → DEALING → PLAYER_TURN → [SPLIT_TURN] → DEALER_TURN → RESOLUTION → IDLE
```

| State | Description |
|---|---|
| `IDLE` | Awaiting bet; show previous round result if any |
| `BETTING` | Player adjusting bet amount |
| `DEALING` | Cards animate onto table; shuffle sound plays |
| `PLAYER_TURN` | Player chooses Hit / Stand / Double / Split |
| `SPLIT_TURN` | Player completes second split hand |
| `DEALER_TURN` | Dealer plays automatically; hole card revealed |
| `RESOLUTION` | Outcomes calculated; chips awarded/removed; sounds play |

---

## Configuration Constants

```js
// config.js
export const STARTING_BALANCE = 1000;
export const MIN_BET = 1;
export const DECK_COUNT = 6;           // Number of decks in shoe
export const DEALER_STANDS_ON = 17;    // Dealer stands on soft 17+
export const BLACKJACK_PAYOUT = 1.5;   // 3:2
export const CARD_STYLE_DEFAULT = 'traditional'; // 'traditional' | 'highcontrast'
export const ENABLE_SPLIT = true;
export const ENABLE_DOUBLE_DOWN = true;
```

---

## Stretch Goals (Optional)

- [ ] Insurance side bet when dealer shows Ace
- [ ] Re-split up to 3 hands
- [ ] Persistent high score via `localStorage`
- [ ] Multiple rival player avatar skins selectable before game
- [ ] Animated confetti on Blackjack
- [ ] Difficulty modes affecting deck penetration

---

## Definition of Done

- [ ] Full round of Blackjack playable end-to-end
- [ ] Split mechanic works correctly for matching-value pairs
- [ ] Integer bet input validates and enforces balance limits
- [ ] All sound effects trigger at correct game events
- [ ] Card style toggle switches all cards instantly
- [ ] Deck stack and poker chips visible on table at all times
- [ ] Rival/dealer avatar displayed with contextual reactions
- [ ] No console errors; clean build
- [ ] Responsive at 768px width and above
