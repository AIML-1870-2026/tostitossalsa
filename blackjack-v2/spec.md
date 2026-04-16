# Blackjack AI Agent — Project Specification

## Overview

A static webpage (HTML, CSS, vanilla JavaScript) implementing a multiplayer Blackjack game where:
- **The human player** makes their own hit/stand/bet decisions
- **Two AI players** (each powered by a different OpenAI model of the user's choosing) independently decide their bets and actions via LLM API calls
- **The dealer** follows standard Blackjack dealer rules (hit on 16 or below, stand on 17+)

The user provides their OpenAI API key by uploading a `.env` file. The key is read in-memory only and never stored or transmitted beyond the API calls.

---

## API Key Handling

- On page load, prompt the user to upload a `.env` file
- Parse the file in-memory for `OPENAI_API_KEY=...`
- Store the key in a JavaScript variable only; never write it to localStorage, sessionStorage, cookies, or any persistent store
- Display a masked confirmation (e.g., `sk-...XXXX`) that the key was loaded successfully
- All three AI participants (AI Player 1, AI Player 2, and the human's advisory calls if any) use this single key

---

## Player Configuration

Before the game starts, the user configures the two AI players via a setup panel:

- **AI Player 1 name** — text input (default: "Agent Alpha")
- **AI Player 1 model** — dropdown populated from a hardcoded list of current OpenAI chat models (e.g., `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-3.5-turbo`, etc.)
- **AI Player 2 name** — text input (default: "Agent Beta")
- **AI Player 2 model** — separate dropdown; defaults to a different model than Player 1
- **Starting bankroll** — numeric input applied to all three players (human + both AIs), default $1,000

The two AI players must be assigned **different models** — enforce this with a validation warning if the user picks the same model for both.

---

## Game Rules

Standard casino Blackjack:
- Single deck, reshuffled each hand (or configurable multi-deck optional stretch goal)
- Players can Hit, Stand, Double Down, or Split (if applicable — see stretch goals)
- Dealer hits on soft 16 and below, stands on soft 17+
- Blackjack pays 3:2
- Insurance not required (can be a stretch goal)
- Bust = over 21, automatic loss
- Tie (push) = bet returned

---

## Turn Order & Hand Flow

Each hand proceeds as follows:

1. **Betting phase** — all three players place bets
   - Human: inputs a bet amount manually
   - AI Player 1 & 2: each makes an LLM API call to decide their bet, given their current bankroll and recent hand history (last 3 hands). Bet is bounded between a minimum ($10) and their available bankroll.
2. **Deal** — dealer deals two cards to each player and two to the dealer (one dealer card face-up, one face-down)
3. **Action phase** — players act left to right: AI Player 1 → AI Player 2 → Human → Dealer
   - Each AI makes an LLM API call to decide hit or stand, given their hand and the dealer's up card
   - Human clicks Hit or Stand buttons
   - Dealer acts last, following fixed rules
4. **Resolution** — compare each player's hand to the dealer; update bankrolls; log results
5. **Next hand** — repeat; eliminated players (bankroll = $0) are shown as "Bust Out" and sit out

---

## LLM Integration

### Endpoint
All calls use `https://api.openai.com/v1/chat/completions`.

### Structured JSON Responses
To avoid keyword-search ambiguity (e.g., a response containing both "hit" and "stand"), all LLM responses **must** be requested as structured JSON. Use the `response_format: { type: "json_object" }` parameter.

#### Bet decision prompt schema
```json
{
  "action": "bet",
  "amount": <integer>
}
```

#### Hit/Stand decision prompt schema
```json
{
  "action": "hit" | "stand",
  "reasoning": "<brief explanation>"
}
```

### System Prompt (for each AI player)
Each AI player's system prompt should include:
- Their name and assigned role as a Blackjack player
- Instruction to respond only in the specified JSON format
- Their current bankroll
- The minimum bet

### User Prompt (per turn)
Include:
- Their current hand (card values + total)
- Dealer's face-up card
- Whether they are deciding a bet or an action
- Last 3 hand outcomes (win/loss/push + amount) for bet sizing context

### Console Logging
Log the following to the browser console for every LLM call:
- The full messages array sent
- The raw response received
- The parsed action extracted
- Any errors or fallback behavior

---

## UI Layout

### Header
- Game title
- `.env` upload button + key status indicator

### Setup Panel (pre-game)
- AI player name/model selectors
- Starting bankroll input
- "Start Game" button

### Main Game Area (during play)
A card table layout with clearly separated zones for each participant:

```
[ Dealer ]
[ AI Player 1 ]    [ AI Player 2 ]
[ Human Player ]
```

Each player zone shows:
- Name + model (for AIs)
- Current hand with card visuals (suit + value)
- Hand total
- Current bankroll
- Current bet for this hand
- Status badge: Thinking… / Hit / Stand / Bust / Blackjack / Win / Loss / Push

### Action Controls (human player)
- Hit button
- Stand button
- Bet input + Confirm Bet button
- Disabled state when it is not the human's turn

### AI Reasoning Panel
Below each AI player zone, show a collapsible "Reasoning" box displaying the `reasoning` field from their last LLM response.

### Game Log
A scrollable sidebar or bottom panel showing a plain-text log of every action taken each hand (bets placed, cards dealt, hits, stands, outcomes).

---

## Performance Analytics (Stretch Feature)

Track and display after each hand:
- Win rate (%) per player
- Bankroll history chart (line chart per player, last N hands)
- Decision quality metric: compare AI decisions against basic strategy and flag deviations

---

## Strategy Visualization (Stretch Feature)

Alongside each AI hit/stand decision, show a small decision matrix heatmap (player total vs. dealer up card) highlighting the optimal basic strategy move and whether the AI agreed or deviated.

---

## Explainability Controls (Stretch Feature)

A toggle for each AI player with three levels:
- **Basic** — just the action ("Hit")
- **Statistical** — action + brief probability reasoning
- **In-depth** — full chain-of-thought explanation

The selected level is injected into the system prompt to control response verbosity.

---

## Multi-Deck / Shoe Option (Stretch Feature)

- Configuration option: 1, 2, 4, or 6 decks
- Visual "cards remaining" indicator
- Reshuffle automatically when shoe drops below 25%

---

## File Structure

```
/
├── index.html
├── style.css
├── main.js           # Game state, flow control, UI rendering
├── blackjack.js      # Deck, dealing, scoring logic
├── llm.js            # All OpenAI API call functions
├── analytics.js      # Stats tracking and chart rendering
└── temp/             # Reference implementation (DO NOT include in final build)
```

---

## Non-Goals / Constraints

- No backend, no server — fully static
- No storing or logging the API key anywhere persistent
- No multiplayer networking — all players run in the same browser tab
- The `temp/` folder is for reference only and must be excluded from the final deliverable
