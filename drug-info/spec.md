# Drug Safety Explorer — Project Spec

## Overview

A single-page web application that lets general public users search for any drug and explore its safety profile via live OpenFDA API calls. The tool surfaces adverse event data and NDC/product info in a dark, data-dense dashboard layout — think Bloomberg terminal meets consumer health app.

Deployed as a static site to GitHub Pages (no backend required — all API calls are client-side to the public OpenFDA endpoints, which are free and require no API key).

---

## Target Audience

General public / patients who want to understand drug safety in plain language. The UI should feel trustworthy and informative without requiring medical expertise. Help buttons and plain-language explanations are critical.

---

## Visual Design Direction

**Aesthetic**: Dark & data-dense — deep navy/charcoal backgrounds, sharp accent colors (amber or teal), monospace or semi-technical typography for numbers/labels, dense but organized information hierarchy.

**Fonts**: A distinctive display font (e.g. DM Mono, IBM Plex Mono, or Space Mono) for stats and headings. A clean humanist sans (e.g. DM Sans, Outfit, or Figtree) for body/labels. Load both from Google Fonts.

**Colors** (CSS variables):
- `--bg`: `#0d1117` (near-black)
- `--surface`: `#161b22` (card background)
- `--border`: `#30363d`
- `--accent`: `#f0a500` (amber) or `#2dd4bf` (teal) — pick one and commit
- `--text`: `#e6edf3`
- `--muted`: `#8b949e`
- `--danger`: `#f85149`
- `--success`: `#3fb950`

**Motion**: Subtle fade-in + slide-up on card load. Skeleton loaders while API data fetches. Hover glow on cards.

---

## Application Structure

Single HTML file (`index.html`) with embedded CSS and JS. No build tools, no frameworks — vanilla HTML/CSS/JS only (requirement: deployable to GitHub Pages as-is).

### Layout

```
┌─────────────────────────────────────────────────────┐
│  HEADER — App name + disclaimer banner              │
├─────────────────────────────────────────────────────┤
│  SEARCH BAR — Drug name input + Search button       │
│  (supports searching up to 2 drugs simultaneously   │
│   for comparison, but single drug works too)        │
├──────────────────────┬──────────────────────────────┤
│  DRUG PROFILE CARD   │  ADVERSE EVENTS DASHBOARD    │
│  (NDC/product info)  │  (charts + top reactions)    │
├──────────────────────┴──────────────────────────────┤
│  ADVERSE EVENT BREAKDOWN — outcome severity table   │
├─────────────────────────────────────────────────────┤
│  FOOTER — OpenFDA attribution + disclaimer          │
└─────────────────────────────────────────────────────┘
```

When 2 drugs are searched, panels render side-by-side in columns for comparison.

---

## Features

### 1. Drug Search
- Text input accepting a drug brand name or generic name (e.g. "ibuprofen", "Lipitor")
- Optional second drug input for side-by-side comparison
- On submit: fetch from both OpenFDA endpoints simultaneously using `Promise.all()`
- Show skeleton loader cards while fetching
- Show friendly error state if drug not found or API fails

### 2. Drug Profile Card (NDC Endpoint)
**API**: `https://api.fda.gov/drug/ndc.json?search=brand_name:"DRUGNAME"&limit=1`
(fallback: `generic_name:"DRUGNAME"`)

Display:
- Brand name + generic name
- Drug manufacturer (`labeler_name`)
- Dosage form + route (e.g. "Oral tablet")
- Active ingredients list
- Marketing status
- ℹ️ help button → popup: "What is NDC data? The National Drug Code database contains product information submitted by drug manufacturers to the FDA."

### 3. Adverse Events Dashboard (Main Panel)
**API**: `https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"DRUGNAME"&count=patient.reaction.reactionmeddrapt.exact&limit=10`

Display:
- Total adverse event reports (from a separate count call)
- Top 10 reported reactions as a horizontal bar chart (pure CSS bars, no library needed)
- Each bar shows reaction name + count
- Color-code bars: top 3 in accent color, rest in muted
- ℹ️ help button → popup: "What are adverse event reports? These are voluntary reports submitted to FDA by patients, doctors, and manufacturers. A high count does NOT mean the drug causes this reaction — it means it was reported while someone was taking the drug. This data has significant limitations."

### 4. Outcome Severity Table
**API**: Same event endpoint but `count=serious` and counts by outcome type

Display a small table showing report breakdown:
| Outcome | Count |
|---|---|
| Hospitalization | N |
| Life-threatening | N |
| Death | N |
| Disability | N |
| Other serious | N |

- ℹ️ help button → popup explaining serious vs non-serious outcomes and voluntary reporting bias

### 5. Help Buttons & Modals
Every major data section has a small `?` icon button. Clicking opens a modal overlay with:
- Section title
- Plain-language explanation of what the data means
- Key caveats / limitations
- Close button (and click-outside-to-close)

### 6. Data Limitations Banner
Persistent amber banner near the top (dismissible):
> "⚠️ This tool displays FDA-reported data which is voluntary, self-reported, and may be incomplete. It is for educational purposes only. Always consult a healthcare professional."

---

## OpenFDA API Details

Base URL: `https://api.fda.gov`

No API key required for up to ~1,000 requests/day per IP.

Endpoints to use:

| Endpoint | Use |
|---|---|
| `/drug/ndc.json` | Drug product info, ingredients, manufacturer |
| `/drug/event.json` | Adverse event reports, reaction counts |

Key query patterns:
```
# Top reactions for a drug
GET /drug/event.json?search=patient.drug.medicinalproduct:"ibuprofen"&count=patient.reaction.reactionmeddrapt.exact&limit=10

# Total event count
GET /drug/event.json?search=patient.drug.medicinalproduct:"ibuprofen"&limit=1
(use response meta.results.total)

# NDC product lookup
GET /drug/ndc.json?search=brand_name:"ibuprofen"&limit=1
```

Handle API quirks:
- Drug names in OpenFDA are often uppercase — try both casing variants if first fails
- Some drugs return no results from brand name; fall back to `generic_name` search
- Wrap all fetch calls in try/catch; show user-friendly "No data found for this drug" message on failure
- Respect CORS — the OpenFDA API supports it natively, no proxy needed

---

## Required Compliance Elements

These are non-negotiable per the assignment:

1. **Educational disclaimer** (visible in the UI, not just a footer footnote)
2. **OpenFDA attribution** in the footer (exact text):
   > *"This product uses publicly available data from the U.S. Food and Drug Administration (FDA). FDA is not responsible for the product and does not endorse or recommend this or any other product."*
3. All data must come from **live API calls** — no hardcoded drug data

---

## File Structure

```
/
├── index.html        ← entire app (HTML + embedded CSS + embedded JS)
└── README.md         ← brief description + how to deploy to GitHub Pages
```

Keep everything in one file for easy GitHub Pages deployment. No npm, no bundler.

---

## GitHub Pages Deployment

1. Push `index.html` (and `README.md`) to a public GitHub repo
2. Go to repo Settings → Pages → Source: `main` branch, `/ (root)`
3. Site will be live at `https://<username>.github.io/<repo-name>/`

---

## Out of Scope

- Drug recall data (nice-to-have but not required for v1)
- Drug labeling / full prescribing info (too verbose for this dashboard format)
- User accounts, saved searches, or any backend
- Mobile-first optimization (desktop dashboard is fine; basic responsiveness is a bonus)
- Any charting library (use CSS-only bars to keep it dependency-free)
