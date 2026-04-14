# Science Experiment Generator — spec.md

## Project Overview

A single-file (`index.html`) web app that uses the OpenAI API to generate grade-appropriate science experiments based on a user's selected grade level and available supplies. The app renders the model's response as formatted HTML and includes several stretch features: difficulty ratings, supply substitution suggestions, and persistent experiment history via localStorage.

---

## Deployment

- Multi-file deployment: `index.html`, `style.css`, and `app.js` — ready for GitHub Pages
- No backend server required — OpenAI's API allows direct browser-to-API calls (unlike Anthropic's API, which blocks CORS requests from the browser)
- API key is entered by the user in the UI and stored **in-memory only** — never written to disk, never sent anywhere except the OpenAI API

---

## User Inputs

### 1. API Key Field
- A text input (type `password`) where the user pastes their OpenAI API key
- Stored in a JS variable only — not in localStorage or any persistent store

### 2. Model Selector (dropdown)
Available options:
- `gpt-4o`
- `gpt-4o-mini`
- `gpt-4-turbo`

### 3. Grade Level (dropdown)
Available options:
- K–2
- 3–5
- 6–8
- 9–12
- College

### 4. Available Supplies (text input)
- A free-text field where the user types a comma-separated list of supplies they have on hand
- Example: `baking soda, vinegar, food coloring, plastic bottles`

### 5. Generate Button
- Sends the request to the OpenAI API with the inputs above

---

## API Integration

- Endpoint: `https://api.openai.com/v1/chat/completions`
- Method: `POST`
- Auth: `Authorization: Bearer <user-provided key>`
- Request format: standard OpenAI chat completions (unstructured / free-form text response — no JSON schema or structured output mode)

### System Prompt (suggested)
```
You are a helpful science teacher assistant. When given a grade level and a list of available supplies, suggest a creative, safe, and grade-appropriate science experiment. Format your response with:
- A title
- A difficulty rating (Easy / Medium / Hard)
- A list of required materials (noting any substitutions if the user is missing common items)
- Step-by-step instructions
- The scientific concept being demonstrated
Use clear markdown formatting.
```

### User Prompt (constructed from inputs)
```
Grade level: {gradeLevel}
Available supplies: {supplies}

Please suggest a science experiment I can do with these materials.
```

---

## Response Rendering

- The model's response will be in markdown format
- Render the markdown as formatted HTML (use a library like [Marked.js](https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js), loaded from CDN)
- Display in a styled output panel below the form
- Show a loading indicator while the API call is in progress
- Show a clear, user-friendly error message if the API call fails

---

## Stretch Features

### 1. Difficulty Ratings
- The system prompt instructs the model to include a difficulty rating (Easy / Medium / Hard) in its response
- Display the rating visually as a badge/chip near the top of the output (parse it from the markdown or rely on the model including it in a consistent location)

### 2. Supply Substitution Suggestions
- The system prompt instructs the model to note substitutions for any commonly needed supplies the user may not have listed
- No extra UI needed — this is surfaced naturally in the model's formatted response

### 3. Save & Display Past Experiments
- After each successful generation, save the experiment to `localStorage`
- Each saved entry should store:
  - Timestamp
  - Grade level
  - Supplies entered
  - Full markdown response from the model
- Display a "Saved Experiments" section below the main tool, showing a list of past experiments
- Each saved experiment should be expandable/collapsible
- Include a "Clear History" button to wipe localStorage

---

## Reference Implementation

The `temp/` folder contains a complete LLM Switchboard project (HTML, CSS, and JS files). This is **NOT** part of the current project — do not include it in the final build or deployment.

Use it as a reference for:
- How to parse a `.env` file for API keys (in-memory only)
- The `fetch()` call structure for OpenAI's chat completions API
- Error handling patterns for failed API requests
- How the code is organized across separate files
- The general approach to building a single-page LLM tool

Ignore these Switchboard features (not needed here):
- Anthropic integration (this project is OpenAI-only)
- The model selection dropdown / provider switching logic between families
- Structured output mode and JSON schema handling

This project uses **unstructured (free-form) responses only**. Render the model's markdown output as formatted HTML.

---

## File Structure

```
index.html       ← markup and structure; links to style.css and app.js
style.css        ← all styles (layout, form, output panel, badges, history)
app.js           ← all logic (API calls, markdown rendering, localStorage)
temp/            ← reference only, excluded from build/deploy
```

---

## Non-Goals

- No backend / Node.js server
- No Anthropic or Google API integration
- No JSON schema / structured output parsing
- No user accounts or cloud sync
