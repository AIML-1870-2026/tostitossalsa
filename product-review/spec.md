# ReviewForge — Product Review Generator
## spec.md for Claude Code

---

## Project Overview

Build a dynamic, browser-based **Product Review Generator** that lets a user describe any product, configure multi-dimensional sentiment sliders, choose an OpenAI model, and receive a beautifully formatted AI-generated review. The app must be visually impressive — dark glassmorphism aesthetic, animated sliders that shift color in real time, and a streaming output panel that renders markdown as HTML.

This is a **3-file project**: `index.html`, `styles.css`, and `app.js`. No backend. No build step. Deployable directly to GitHub Pages.

---

## File Structure

```
reviewforge/
├── index.html       # App shell, all markup and DOM structure
├── styles.css       # All visual styling, animations, slider theming
├── app.js           # All logic: .env parsing, API calls, prompt construction, markdown rendering
```

No other files should be created. Do not add a package.json, server.js, or any Node.js server. This is a pure client-side app — "Node.js" in the assignment context refers to the runtime environment, not a server.

---

## Reference Implementation

The `temp/` folder contains my complete LLM Switchboard project (HTML, CSS, and JS files). This is NOT part of the current project — do not include it in the final build or deployment.

Use it as a reference for:
- How to parse a `.env` file for API keys (in-memory only, never stored)
- The `fetch()` call structure for OpenAI's chat completions API
- Error handling patterns for failed API requests
- How logic is organized across separate files
- The general approach to building a single-page LLM tool

Ignore these Switchboard features (not needed here):
- Anthropic integration — this project is OpenAI-only
- The model selection dropdown / provider switching UI pattern (ours is simpler)
- Structured output mode and JSON schema handling

This project uses unstructured (free-form) responses only. Render the model's markdown output as formatted HTML.

---

## Key Design Constraints

1. **OpenAI models only** — no Anthropic, no provider switching. Models available in the dropdown: `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo`.
2. **Unstructured responses** — the model returns free-form markdown text. No JSON parsing needed.
3. **Markdown rendering** — parse the model's response and render it as proper HTML (bold, headers, bullet lists, etc.). Use the `marked.js` CDN library for this. Do not display raw markdown strings to the user.
4. **API key from `.env`** — on page load, prompt the user to paste their `.env` file contents into a modal or a designated input area. Parse the key from it in-memory only. Never store it in localStorage, sessionStorage, or any persistent store.
5. **Single-file deployment** — the final output must work when `index.html` is opened directly in a browser or served from GitHub Pages, with `styles.css` and `app.js` loaded via relative `<link>` and `<script>` tags.
6. **No form tags** — use `<div>` elements with `onClick`/event listeners instead of HTML `<form>` submissions to avoid page reloads.

---

## `index.html` — Structure & Markup

### Page Layout (top to bottom)

1. **Header bar** — App name "ReviewForge" in a stylized logotype font, tagline: *"AI-powered reviews, engineered to your sentiment."*

2. **API Key Section** — A collapsible panel at the top. Contains:
   - A `<textarea>` labeled "Paste your `.env` file contents here"
   - A "Load Key" button that triggers parsing in `app.js`
   - A status indicator (🔴 No key loaded / 🟢 Key loaded)

3. **Main Input Panel** (left column on wide screens, stacked on mobile):
   - **Product Name** — text input, placeholder: *"e.g., Sony WH-1000XM5"*
   - **Product Description** — textarea, placeholder: *"Briefly describe the product..."*
   - **Model Selector** — dropdown with `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo`
   - **Tone Selector** — dropdown: Professional / Casual / Snarky
   - **Review Length** — dropdown: Short (~100 words) / Medium (~250 words) / Long (~500 words)

4. **Sentiment Sliders Panel** (visually prominent, center of the page):
   - Three sliders, each labeled with an emoji and aspect name:
     - 💰 **Price** — range input, 1–10
     - ⚙️ **Features** — range input, 1–10
     - 🖐️ **Usability** — range input, 1–10
   - Each slider shows its current numeric value live
   - Below each slider value, show a short dynamic label: 1–3 = "Poor", 4–5 = "Below Average", 6–7 = "Good", 8–9 = "Great", 10 = "Excellent"
   - A **live sentiment summary sentence** updates as sliders move (e.g., *"Mixed — loves the features, frustrated by the price, usability is average."*)

5. **Generate Button** — large, full-width, prominent CTA: "Generate Review ✦"

6. **Output Panel** (right column on wide screens, below on mobile):
   - Shows a placeholder message when empty: *"Your review will appear here..."*
   - Renders the model's markdown response as formatted HTML using `marked.js`
   - Shows a footer bar with: the model used, token count if available, and a **Copy to Clipboard** button
   - While loading: show an animated spinner or pulsing skeleton inside the panel

---

## `styles.css` — Visual Design

### Aesthetic Direction: Dark Glassmorphism with Neon Sentiment Accents

- **Background**: Deep near-black (`#0a0a0f`) with a subtle animated gradient mesh in the background (slow-moving blobs of deep indigo and dark teal using CSS keyframe animation)
- **Cards/Panels**: Frosted glass effect — `background: rgba(255,255,255,0.04)`, `backdrop-filter: blur(12px)`, `border: 1px solid rgba(255,255,255,0.08)`, `border-radius: 16px`
- **Typography**:
  - Display/Logo font: `Bebas Neue` (Google Fonts) — all caps, wide tracking for "ReviewForge"
  - UI labels and body: `DM Sans` (Google Fonts) — clean, modern, not overused
  - Output review text: `Lora` (Google Fonts) — serif, editorial feel for the generated review content
- **Color palette**:
  - Background: `#0a0a0f`
  - Surface: `rgba(255,255,255,0.04)`
  - Primary accent: `#00e5ff` (electric cyan)
  - Text primary: `#f0f0f0`
  - Text muted: `#888`
  - Danger/low sentiment: `#ff4d4d`
  - Warning/mid sentiment: `#ffd166`
  - Success/high sentiment: `#06d6a0`

### Slider Theming (critical wow-factor element)

Each slider's thumb and filled track color must dynamically update based on its value:
- Value 1–3: red (`#ff4d4d`)
- Value 4–6: yellow (`#ffd166`)
- Value 7–10: green (`#06d6a0`)

Implement this by setting a CSS custom property on the slider's parent element via JavaScript on every `input` event, and using that variable in the CSS for the track fill and thumb glow (`box-shadow` pulse).

### Animations

- Page load: panels fade in with staggered `animation-delay` (0.1s, 0.2s, 0.3s)
- Generate button: subtle shimmer effect on hover using a moving gradient overlay
- Output panel: when review loads, fade-in the content with a 0.4s ease
- Background blobs: slow `@keyframes` drift (20s loop, `transform: translate` + `scale`)
- Slider thumb: `transition: box-shadow 0.2s ease` for smooth glow color changes

### Layout

- Desktop (≥900px): Two-column CSS Grid. Left column: all inputs + sliders. Right column: output panel, sticky.
- Mobile (<900px): Single column, stacked. Output panel moves below inputs.
- Max content width: `1200px`, centered with `margin: auto`

---

## `app.js` — Logic & API

### On Page Load
- Attach all event listeners (sliders, dropdowns, generate button, load key button)
- Initialize slider display values and sentiment summary

### API Key Handling
```
function loadEnvKey(rawText):
  - Split rawText by newlines
  - Find the line that starts with "OPENAI_API_KEY="
  - Extract everything after the "=" sign, strip quotes and whitespace
  - Store in a module-level variable: let apiKey = null
  - Update the status indicator in the DOM
  - Never write the key to localStorage or any persistent store
```

### Slider Logic
```
function updateSliderUI(sliderId, value):
  - Update the numeric display next to the slider
  - Update the label text (Poor / Below Average / Good / Great / Excellent)
  - Compute a color based on value range and set it as a CSS custom property on the slider wrapper
  - Call updateSentimentSummary()

function updateSentimentSummary():
  - Read all three slider values
  - Build a natural language sentence describing the combined sentiment
  - Examples:
      All high → "Highly positive across the board — a strong recommendation."
      Mixed → "Mixed feelings — great features but let down by price and usability."
      All low → "Strongly negative — poor value, frustrating to use."
  - Use a simple rule-based approach with the average and individual values
  - Update the summary text element in the DOM
```

### Prompt Construction
```
function buildPrompt(productName, description, priceScore, featuresScore, usabilityScore, tone, length):
  - System prompt:
      "You are a professional product reviewer. Write reviews in {tone} tone.
       The review should be approximately {length} words.
       Format your response in markdown: use a bold title, a star rating line,
       a short intro paragraph, a ## Pros section, a ## Cons section, and a
       closing Verdict paragraph."
  - User prompt:
      "Write a product review for: {productName}
       Description: {description}

       Sentiment scores (1=worst, 10=best):
       - Price/Value: {priceScore}/10
       - Features: {featuresScore}/10
       - Usability: {usabilityScore}/10

       Make sure the review tone and content accurately reflect these scores.
       A score of 1-3 means that aspect is genuinely bad and should be criticized.
       A score of 8-10 means that aspect is excellent and should be praised."
```

### API Call
```
async function generateReview():
  - Validate: apiKey must be set, productName must not be empty
  - Show loading state on output panel (spinner, disable generate button)
  - Fetch from: https://api.openai.com/v1/chat/completions
  - Method: POST
  - Headers: { "Content-Type": "application/json", "Authorization": "Bearer {apiKey}" }
  - Body:
    {
      model: selectedModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: (short=300, medium=600, long=1000),
      temperature: 0.8
    }
  - On success:
      - Extract response text from data.choices[0].message.content
      - Parse markdown to HTML using marked.parse()
      - Inject into output panel
      - Show model badge and copy button
  - On error:
      - Display a user-friendly error message in the output panel
      - Log full error to console
      - Re-enable the generate button
```

### Copy to Clipboard
```
function copyReview():
  - Get the innerText of the output panel (plain text, not HTML)
  - Use navigator.clipboard.writeText()
  - Temporarily change button label to "Copied ✓" for 2 seconds, then revert
```

---

## External Dependencies (CDN only)

Load these via `<script>` tags in `index.html`. No npm installs.

- **marked.js** — markdown parser: `https://cdn.jsdelivr.net/npm/marked/marked.min.js`
- **Google Fonts** — Bebas Neue, DM Sans, Lora: load via `<link>` in `<head>`

No other external libraries. Do not use React, Vue, jQuery, or any CSS framework.

---

## What NOT to Build

- No backend server or Node.js server process
- No Anthropic / Claude API integration
- No JSON schema or structured output mode
- No localStorage or sessionStorage usage
- No multi-provider switching UI
- No separate CSS file for the slider (all styles go in `styles.css`)
- Do not split `app.js` into multiple JS files

---

## Definition of Done

- [ ] Three files exist: `index.html`, `styles.css`, `app.js`
- [ ] Pasting a `.env` file and clicking "Load Key" correctly extracts the OpenAI key
- [ ] All three sentiment sliders update their color, label, and the summary sentence live
- [ ] Selecting a model, tone, and length affects the API request
- [ ] Clicking "Generate Review" calls the OpenAI API and renders markdown output as HTML
- [ ] Copy button copies plain text to clipboard
- [ ] App is responsive on mobile
- [ ] Background animation and glass card aesthetic are present
- [ ] No errors in the browser console on a normal happy-path run
