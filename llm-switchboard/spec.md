# LLM Switchboard — spec.md

## Overview
A three-file (`index.html`, `styles.css`, `app.js`) web app that lets users send prompts to large language models via their APIs. Supports two providers, dual output modes, side-by-side model comparison, and response metrics. Colorful and playful UI.

---

## UI Style
- **Vibe:** Colorful and playful — bold accent colors, rounded corners, friendly typography, subtle animations
- **Layout:** Single page, no navigation. Sections flow top to bottom: Key Management → Controls → Prompt → Output
- **Responsive:** Should work on desktop; mobile is a nice-to-have

---

## API Key Handling
- Users can provide keys via **manual paste** into a text input OR **file upload** (`.env` or `.csv` format)
- Keys are stored **in memory only** — never written to localStorage, sessionStorage, or cookies
- A visible privacy badge/banner reinforces: *"Your keys never leave your browser"*
- Parsed `.env` format: `OPENAI_API_KEY=sk-...` and `ANTHROPIC_API_KEY=sk-ant-...`
- Parsed `.csv` format: two columns, `provider` and `key`
- Keys can be cleared with a "Clear Keys" button that wipes them from memory

---

## Providers & Models

### OpenAI (fully supported)
- `gpt-4o`
- `gpt-4o-mini`
- `gpt-4-turbo`
- `gpt-3.5-turbo`

### Anthropic (CORS limitation)
- `claude-opus-4-5`
- `claude-sonnet-4-5`
- `claude-haiku-4-5`
- When Anthropic is selected, display a **friendly inline warning** explaining the CORS restriction and providing instructions for routing through a local proxy (e.g., `npx anthropic-proxy` or a simple Express server). Anthropic remains selectable but the user is clearly informed.

Model lists are **hardcoded** — no dynamic fetching.

---

## Output Modes

### Unstructured Mode (default)
- Free-text prompt input
- Response displayed as plain text in a scrollable output panel
- Syntax highlighting for any code blocks in the response

### Structured Mode
- User selects a JSON schema template or writes a custom one
- The schema is injected into the system prompt instructing the model to respond only in valid JSON matching the schema
- Response is displayed as **pretty-printed JSON** in the scrollable output panel
- If the response fails to parse as valid JSON, show an inline error with the raw response

### Toggle
- A clearly visible toggle/tab switches between modes
- Switching modes resets the output panel but preserves the prompt text

---

## Example Prompts
A dropdown of pre-loaded prompts across mixed topics:

| Label | Prompt |
|---|---|
| 🎬 Movie pitch | "Give me a one-paragraph pitch for an original sci-fi movie set on Europa." |
| 🎵 Song analysis | "Explain the chord progression and mood of a classic blues song in simple terms." |
| 🧬 Science explainer | "Explain CRISPR gene editing as if I'm a curious 12-year-old." |
| 🏀 Sports take | "Make the case for why the regular season matters as much as the playoffs in the NBA." |
| ✍️ Story starter | "Write the opening paragraph of a mystery novel set in a rainy, neon-lit city." |
| 🤖 AI ethics | "What's one AI risk that doesn't get enough public attention, and why?" |

Selecting a prompt populates the prompt input. Users can edit it freely after selection.

---

## Schema Templates (Structured Mode)
A dropdown of pre-loaded schema templates:

| Label | Schema Summary |
|---|---|
| 📋 Simple Q&A | `{ answer: string, confidence: "high"\|"medium"\|"low" }` |
| 🎬 Movie Review | `{ title, rating (1–10), summary, pros[], cons[] }` |
| 🧑 Character Profile | `{ name, age, backstory, strengths[], flaws[] }` |
| 📊 Pros & Cons | `{ topic, pros[], cons[], verdict }` |
| 🗓️ Action Plan | `{ goal, steps[{ order, action, timeframe }], risks[] }` |

Users can edit the schema in a text area. A "Validate JSON" button checks syntax before sending.

---

## Side-by-Side Comparison Mode
- A toggle enables **comparison mode**
- User selects **two models** (can be same provider or different)
- A single prompt is sent to both simultaneously (parallel requests)
- Responses appear in two columns with the model name as the column header
- Response metrics are shown independently for each column
- Errors in one column don't block the other
- Use `Promise.allSettled()` so one failure doesn't kill the other column

---

## Response Metrics
Displayed below each output panel after a response is received:

- ⏱ **Response time** — measured client-side from request send to first complete response (ms)
- 🔢 **Token count** — input + output tokens if returned by the API (`usage` field); shown as "N/A" if not available
- 📏 **Response length** — character count of the raw response text

In comparison mode, metrics appear under each respective column.

---

## Error Handling
All errors appear as **inline messages directly below the output panel**, styled with a distinct color (e.g., warm red/orange). Errors do not replace the output — they appear beneath it.

| Error Type | Message |
|---|---|
| Invalid/missing API key | "API key missing or invalid. Check your key and try again." |
| Rate limit (429) | "Rate limit hit. Wait a moment and try again." |
| Timeout | "Request timed out. The model may be busy — try again." |
| CORS (Anthropic) | Shown proactively as a warning before the request, not after |
| Invalid JSON (structured mode) | "Response wasn't valid JSON. Raw output shown above." |
| Network error | "Network error. Check your connection." |

---

## Deliverable
- Three files: `index.html`, `styles.css`, `app.js`
- No build step, no dependencies fetched at runtime except standard CDN-hosted libraries (e.g., highlight.js for code formatting)
- Deployed to GitHub Pages
