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

### Deck & Shuffle
- Default: single 52-card deck, reshuffled before every hand
- Multi-deck shoe is a stretch goal (see below)
- Card values: number cards = face value; J/Q/K = 10; Ace = 11 unless it causes a bust, in which case it counts as 1
- A "soft" hand contains an Ace counted as 11; a "hard" hand does not

### Blackjack
- A natural Blackjack is an Ace + any 10-value card dealt as the initial two cards
- Blackjack pays **3:2** (e.g., $10 bet wins $15)
- If the dealer also has Blackjack, the result is a **push** (bet returned) — player Blackjack does NOT beat dealer Blackjack
- A Blackjack after splitting is not a natural — it pays even money (1:1)

### Bust
- Any hand totaling over 21 is a bust and is an immediate loss, regardless of what the dealer does

### Push
- If the player and dealer finish with the same total (and neither busted), the bet is returned

### Player Actions
Players may take the following actions on their turn. All three human/AI players have access to all of these:

#### Hit
- Draw one additional card
- A player may hit as many times as they like until they stand or bust

#### Stand
- Take no more cards; end your turn

#### Double Down
- Available **only on the initial two-card hand** (before any hits)
- The player doubles their original bet and receives **exactly one more card**, then must stand
- Cannot double down after splitting unless the house rules allow it (see Split below)
- AI players may choose to double down via the LLM action response

#### Split
- Available **only when the initial two cards have the same value** (e.g., two 8s, two Kings, an Ace and an Ace)
- The hand is split into two separate hands; each receives a second card; the original bet is duplicated on the second hand (costs the same as the original bet, deducted from bankroll)
- Each split hand is then played independently (hit, stand, double down allowed on each)
- **Splitting Aces**: each Ace hand receives exactly one card and cannot hit further (standard casino rule)
- A player may re-split up to a maximum of **3 times** (resulting in up to 4 hands), except for Aces (no re-splitting Aces)
- Blackjack after splitting pays **1:1**, not 3:2
- AI players may choose to split via the LLM action response; the LLM will be called separately for each resulting split hand

#### Surrender (Late Surrender)
- Available **only on the initial two-card hand**, before any other action
- The player forfeits the hand and recovers **half their bet**
- Not available after the dealer checks for Blackjack (late surrender only — no early surrender)
- AI players may choose to surrender via the LLM action response

### Insurance
- Offered when the dealer's face-up card is an Ace, before the dealer checks the hole card
- A side bet of up to **half the original bet** that the dealer has Blackjack
- Pays **2:1** if the dealer has Blackjack; otherwise the insurance bet is lost and play continues normally
- "Even money" — if a player has Blackjack and takes insurance, they are paid 1:1 immediately regardless of the dealer's hand
- AI players are prompted with an insurance decision when applicable; they respond via the LLM

### Dealer Rules
- Dealer acts last, after all players have finished
- Dealer **must hit** on any total of 16 or below, and on a **soft 17** (Ace + 6)
- Dealer **must stand** on hard 17 or above, and on soft 18 or above
- Dealer does not split, double down, surrender, or take insurance
- If the dealer busts, all players who have not already busted win

### Payouts Summary
| Outcome | Payout |
|---|---|
| Win (standard) | 1:1 |
| Blackjack (natural) | 3:2 |
| Blackjack after split | 1:1 |
| Push | Bet returned |
| Loss / Bust | Bet lost |
| Surrender | Half bet returned |
| Insurance win | 2:1 on insurance bet |
| Insurance loss | Insurance bet lost |

---

## Turn Order & Hand Flow

Each hand proceeds as follows:

1. **Betting phase** — all three players place bets
   - Human: inputs a bet amount manually
   - AI Player 1 & 2: each makes an LLM API call to decide their bet, given their current bankroll and recent hand history (last 3 hands). Bet is bounded between a minimum ($10) and their available bankroll.
2. **Deal** — dealer deals two cards to each player and two to the dealer (one dealer card face-up, one face-down)
3. **Insurance check** — if dealer shows an Ace, each player is offered insurance before any actions. AI players are prompted via LLM. Human is given Yes/No buttons.
4. **Dealer Blackjack check** — if dealer has Blackjack, reveal hole card, resolve insurance bets, and end the hand (all non-Blackjack players lose; Blackjack players push)
5. **Action phase** — players act left to right: AI Player 1 → AI Player 2 → Human → Dealer
   - On each turn, available actions depend on hand state:
     - **Any turn**: Hit, Stand
     - **First action only**: Double Down, Split (if pair), Surrender
   - Each AI makes one LLM API call per decision point (including each card after a split)
   - Human clicks the appropriate action buttons (non-applicable buttons are disabled)
   - If a player splits, their split hands are resolved fully before the next player acts
   - Dealer acts last, following fixed rules
6. **Resolution** — compare each player's hand (or split hands) to the dealer; apply payouts; update bankrolls; log results
7. **Next hand** — repeat; players with a $0 bankroll are shown as "Bust Out" and sit out

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
  "amount": <integer>,
  "reasoning": "<brief explanation>"
}
```

#### Insurance decision prompt schema
```json
{
  "action": "insurance",
  "take": true | false,
  "amount": <integer>,
  "reasoning": "<brief explanation>"
}
```

#### Action decision prompt schema
```json
{
  "action": "hit" | "stand" | "double" | "split" | "surrender",
  "reasoning": "<brief explanation>"
}
```

The `action` field must be one of the five exact strings above. The game engine validates that the chosen action is legal for the current hand state (e.g., `split` is only valid if the player has a pair and sufficient bankroll; `surrender` only on the initial two-card hand). If an illegal action is returned, the engine defaults to `"stand"` and logs a warning.

### System Prompt (for each AI player)
Each AI player's system prompt should include:
- Their name and assigned role as a Blackjack player
- Instruction to respond only in the specified JSON format
- Their current bankroll
- The minimum bet

### User Prompt (per turn)
Include:
- Their current hand (card values + total, soft/hard label)
- Whether the hand is a split hand and which split number it is (e.g., "Split hand 2 of 2")
- Dealer's face-up card
- Which actions are currently legal (e.g., `["hit", "stand", "double", "split"]`)
- Current bet on this hand and current bankroll
- Whether they are deciding a bet, insurance, or an action
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
- Status badge: Thinking… / Hit / Stand / Double / Split / Surrender / Bust / Blackjack / Win / Loss / Push / Bust Out
- For split hands, each sub-hand is shown as a separate card group within the player's zone with its own bet, total, and status badge

### Action Controls (human player)
- **Hit** button
- **Stand** button
- **Double Down** button — enabled only on initial two-card hand with sufficient bankroll
- **Split** button — enabled only when initial two cards match in value and bankroll covers the additional bet
- **Surrender** button — enabled only on initial two-card hand before any other action
- **Insurance** Yes/No buttons — shown only when dealer up card is an Ace, before actions
- **Bet input + Confirm Bet** button — shown during betting phase
- All buttons are disabled when it is not the human's turn or when the action is not legal for the current hand state

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

Alongside each AI decision, show a small decision matrix heatmap (player total vs. dealer up card) highlighting the optimal basic strategy move and whether the AI agreed or deviated. The matrix must cover all five possible actions: Hit, Stand, Double Down, Split, and Surrender.

---

## Explainability Controls (Stretch Feature)

A toggle for each AI player with three levels:
- **Basic** — just the action ("Hit")
- **Statistical** — action + brief probability reasoning
- **In-depth** — full chain-of-thought explanation

The selected level is injected into the system prompt to control response verbosity.

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
