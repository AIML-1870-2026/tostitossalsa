# NEO Watch — Near Earth Object Dashboard
## Claude Code Project Spec

---

## Overview

A single-page web dashboard that pulls live data from the NASA NeoWs (Near Earth Object Web Service) API and presents it across four tabs. The app tracks asteroids making close approaches to Earth, visualizes them in 3D, and gives users the ability to explore both historical and future approach data.

---

## API

- **Primary:** NASA NeoWs — `https://api.nasa.gov/neo/rest/v1/`
- **API Key:** Free key required — get one at [api.nasa.gov](https://api.nasa.gov) before building
- **Key endpoints:**
  - `/feed?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&api_key=KEY` — returns all NEOs for a date range (max 7 days per call)
  - `/neo/{asteroid_id}` — returns full profile for a single asteroid including all historical close approaches
- **Forecast note:** The feed endpoint caps at 7 days per request. To cover 30 days for the Forecast tab, chain 4–5 sequential API calls with progressive loading — render cards as each batch resolves rather than waiting for all data.

---

## Tech Stack Recommendations

- **3D Globe:** `globe.gl` (wraps Three.js, easiest path to interactive Earth with markers)
- **Charts/Tables:** Your choice — lightweight options like Chart.js or plain JS are fine
- **Framework:** React or vanilla JS — whichever you're comfortable with
- **Styling:** Dark space theme throughout (see Design section)

---

## Tab Structure

### Tab 1 — 3D Earth (Landing Page / Default Tab)

**Purpose:** The hero view. Shows Earth with all this week's asteroids plotted at their real relative miss distances from Earth, with the Moon as a reference point.

**Globe behavior:**
- Rendered with `globe.gl`
- Globe stays fixed — does NOT auto-rotate
- User can drag to rotate manually
- Asteroids move in real time (positions update as time progresses)

**Asteroid markers:**
- Rendered as colored dots
- Red dot = potentially hazardous (NASA official classification)
- Green dot = not potentially hazardous
- Dot size does NOT need to reflect real diameter — uniform size is fine

**Moon:**
- Shown as a marker at exactly 1 Lunar Distance (LD) from Earth
- Label: "Moon — 1 LD" so users can instantly compare asteroid miss distances to it

**Time slider:**
- Allows scrubbing up to 7 days into the past
- When slider is moved, asteroids animate smoothly to their positions on the selected date (do not snap/reload)
- Default position: today

**Asteroid click — Floating Tooltip:**
- Clicking an asteroid opens a floating tooltip near the asteroid's position on the globe
- Tooltip has an X button in the top-right corner to close it
- Tooltip displays:
  1. Asteroid name
  2. Miss distance (km and LD)
  3. Estimated diameter (min–max in meters)
  4. Hazard status (badge: "Potentially Hazardous" or "Safe")
  5. Speed (km/s)
- Tooltip includes a **"View Full Profile →"** button that navigates to Tab 3 with that asteroid pre-selected

---

### Tab 2 — This Week's Close Approaches

**Purpose:** A clean, scannable table of all NEOs passing by in the current 7-day window.

**Table columns:**
| Column | Notes |
|---|---|
| Name | Clickable — navigates to Tab 3 with that asteroid selected |
| Miss Distance | Show in both km and LD |
| Estimated Size | Min–max diameter in meters |
| Velocity | km/s |
| Approach Date | Date + time |
| Hazard | Badge — "Potentially Hazardous" (red) or "Safe" (green), based on NASA official classification |

**Sorting:**
- Every column header is clickable to sort ascending/descending
- Default sort: approach date ascending

**Row click:**
- Clicking any row navigates to Tab 3 with that asteroid pre-selected

---

### Tab 3 — Asteroid Detail

**Purpose:** Deep-dive profile for a single asteroid. Can be reached from Tab 1 (tooltip button), Tab 2 (row click), or navigated to directly.

**Layout:**
- **Left sidebar:** Scrollable list of all NEOs from the current week's feed. Click any name to load its profile in the main panel. No search or filter — just scroll. Highlight the currently selected asteroid.
- **Main panel:** Full profile of the selected asteroid

**Main panel content:**

*Overview section:*
- Full name and NASA designation
- Estimated diameter range (meters and feet)
- Absolute magnitude
- Potentially hazardous status (NASA official, prominent badge)
- Discovery date (if available from API)
- Orbital period

*Close Approach Data section:*
- **Closest approach on record** — highlighted separately (largest headline stat)
- **Last 3 historical approaches** — date, miss distance, velocity for each
- **Next upcoming approach** — date, miss distance, velocity

*Data note:* Fetch the full asteroid profile from `/neo/{id}` which includes all historical close approaches. Parse to find the closest ever, pull the 3 most recent past ones, and the next future one.

**Pre-selection:**
- When navigating from Tab 1 or Tab 2, the asteroid should be automatically selected and its profile loaded on arrival
- The sidebar should scroll to and highlight that asteroid

---

### Tab 4 — Future Forecast

**Purpose:** A forward-looking view of all asteroids making close approaches in the next 30 days.

**Layout:** Card grid — 3 columns on desktop, 2 on tablet, 1 on mobile

**Loading behavior:**
- Fetch data in 4–5 weekly batches (7 days per API call)
- Render cards progressively as each batch resolves — do not block the view waiting for all data
- Show a loading indicator (spinner or skeleton cards) for batches still in flight

**Each card displays:**
- Asteroid name
- Approach date
- Miss distance (km and LD)
- Estimated diameter range (meters)
- Speed (km/s)
- Hazard badge (red/green, NASA official)

**Card interaction:**
- Clicking a card navigates to Tab 3 with that asteroid pre-selected

**Sorting/filtering:** Not required — cards appear in chronological order by approach date

---

## Design

**Theme:** Dark space aesthetic throughout
- Deep dark backgrounds (#0a0c14 range)
- Subtle star-field or noise texture on backgrounds optional
- High contrast text
- Red/green for hazard status consistently across all tabs
- Monospace or technical-feeling font for data values; clean sans-serif for UI chrome

**Hazard classification:**
- Always use NASA's official `is_potentially_hazardous_asteroid` boolean from the API
- Never invent a custom risk scale
- Red badge = `true`, green badge = `false`

---

## Cross-Tab Navigation

- Tab 1 tooltip **"View Full Profile →"** → Tab 3, asteroid pre-selected
- Tab 2 row click → Tab 3, asteroid pre-selected
- Tab 4 card click → Tab 3, asteroid pre-selected
- Tab 3 sidebar is the only place to browse and switch between asteroids manually

---

## Error & Edge Case Handling

- If NASA API is down or returns an error, show a user-friendly message (not a raw error)
- If an asteroid has no historical approach data beyond the current one, show "No historical data available" in that section of Tab 3
- If the forecast returns zero asteroids for a given week, skip that week silently (no empty section header)
- Handle the API rate limit gracefully (1,000 requests/hour on free tier) — the chained forecast calls should be sequential, not parallel, to avoid hammering the limit

---

## Out of Scope (explicitly)

- User accounts or saved asteroids
- Push notifications
- Mobile app
- Auto-rotation on the globe
- Custom risk scoring beyond NASA's official classification
- Asteroid size scaling on the globe (uniform dots only)
- Search/filter on the Tab 3 sidebar
