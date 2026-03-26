# Weather Dashboard — Project Specification

## Overview

A static weather dashboard that fetches live data from the OpenWeatherMap API. The app allows users to search for any city and view current conditions, a 5-day forecast, hourly forecast, air quality data, and an interactive weather map — all styled with a dark/night sky theme.

---

## File Structure

The project must be implemented as exactly **three files**:

```
weather-dashboard/
├── index.html
├── style.css
└── app.js
```

- `index.html` — page structure and semantic markup only; no inline styles or scripts
- `style.css` — all styling, theming, layout, and animations
- `app.js` — all JavaScript logic, API calls, and DOM manipulation

No frameworks, no build tools, no additional files.

---

## API Configuration

- **Provider:** OpenWeatherMap (https://openweathermap.org)
- **Key approach:** Static Page - Basic (API key stored as a plain `const` at the top of `app.js`)
- **Key placeholder:** `const API_KEY = "YOUR_API_KEY_HERE";`
- The user will substitute their own key before running the app

---

## Endpoints Used

| Feature | Endpoint |
|---|---|
| Current weather | `https://api.openweathermap.org/data/2.5/weather?q={city}&appid={key}&units={units}` |
| 5-day / Hourly forecast | `https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={key}&units={units}` |
| Air quality | `https://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={key}` |
| Weather map tiles | `https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid={key}` |

Air quality requires lat/lon, which must be extracted from the current weather response before calling this endpoint.

---

## Features

### Core (Required)

**City Search**
- Text input + search button in the header
- Also triggers on pressing Enter in the input field
- Displays an error message (inline, not `alert()`) if the city is not found or the API returns an error

**Temperature Unit Toggle**
- Toggle button switching between Celsius (°C) and Fahrenheit (°F)
- Default unit: Fahrenheit
- Switching units re-renders all displayed temperature values without making new API calls (re-use cached response data)

**Current Weather Card**
- City name and country code
- Weather condition description and icon (from `https://openweathermap.org/img/wn/{icon}@2x.png`)
- Current temperature
- Feels like temperature
- Humidity (%)
- Wind speed (mph or km/h depending on unit)

### Stretch Features

**5-Day Forecast Panel**
- Displayed as a horizontal row of 5 day cards
- One card per day (use the noon data point from the `/forecast` endpoint for each day, i.e. filter by `dt_txt` containing `"12:00:00"`)
- Each card shows: day of week, weather icon, high/low temperature

**Hourly Forecast Panel**
- Horizontally scrollable strip
- Show the next 8 time slots from the `/forecast` endpoint (covers the next 24 hours in 3-hour intervals)
- Each slot shows: time, weather icon, temperature

**Air Quality Panel**
- Fetched after current weather using lat/lon from that response
- Display the AQI index (1–5) as a colored badge with a label:
  - 1 = Good (green)
  - 2 = Fair (yellow-green)
  - 3 = Moderate (yellow)
  - 4 = Poor (orange)
  - 5 = Very Poor (red)
- Also display: PM2.5, PM10, and CO values with units

**Weather Map Panel**
- Tile-based map rendered using the OpenWeatherMap tile API layered over OpenStreetMap base tiles
- Implemented using [Leaflet.js](https://leafletjs.com/) loaded via CDN (this is the one permitted external library)
- Map auto-centers on the searched city's coordinates after each search
- Three layer toggle buttons: Precipitation, Temperature, Wind Speed
- Only one weather layer is active at a time; switching layers swaps the tile overlay

---

## UX Behavior

- On initial page load, show only the search bar and a prompt (e.g., "Search for a city to see weather data")
- All panels appear/update together after a successful search
- All four API calls (current weather, forecast, air quality) fire in parallel using `Promise.all()`
- Air quality call is made after current weather resolves (to obtain lat/lon), then displayed
- A loading state (spinner or subtle animation) is shown while requests are in flight
- If the API key is the placeholder string `"YOUR_API_KEY_HERE"`, show a visible warning banner at the top of the page prompting the user to add their key

---

## Visual Design

**Theme:** Dark / Night Sky

| Token | Value |
|---|---|
| Background | `#0a0e1a` |
| Card background | `rgba(255, 255, 255, 0.05)` |
| Card border | `rgba(255, 255, 255, 0.08)` |
| Primary text | `#e8eaf6` |
| Secondary text | `#9fa8da` |
| Accent (teal) | `#4dd0e1` |
| Accent (purple) | `#9c6fff` |
| Error color | `#ef5350` |

**Cards:** Use `backdrop-filter: blur(10px)` with a subtle border for a glass-morphism effect

**Background:** A star-speckled sky effect using layered CSS `radial-gradient` with small white dots (no external image required)

**Typography:** System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`)

**Responsive layout:** All panels must be readable on screens as narrow as 375px (mobile). Use CSS Grid and/or Flexbox with `flex-wrap` or `grid-template-columns: repeat(auto-fit, minmax(...))` patterns.

---

## Code Standards

- No use of `var`; use `const` and `let` only
- All API calls use the `fetch()` API with `async/await`
- DOM queries cached in variables at the top of `app.js`; do not re-query the DOM on every function call
- Functions should be small and single-purpose (e.g., `renderCurrentWeather()`, `renderForecast()`, `renderAirQuality()`)
- No external JavaScript libraries except Leaflet.js (loaded via CDN in `index.html`) for the map panel
- `index.html` must include a `<meta name="viewport">` tag for mobile scaling
- All `<img>` tags must include descriptive `alt` attributes

---

## Out of Scope

- No backend, server, or serverless functions
- No build tools (no Webpack, Vite, npm, etc.)
- No authentication or user accounts
- No persistent storage (no localStorage, no cookies)
- No automated tests
