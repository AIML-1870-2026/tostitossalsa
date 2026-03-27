const DEFAULT_API_KEY = "2539f612faa49566e6e9e6f4f114bcaa";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// ── DOM References ──
const apiKeyInputEl  = document.getElementById("api-key-input");
const cityInput      = document.getElementById("city-input");
const searchBtn      = document.getElementById("search-btn");
const unitToggleBtn  = document.getElementById("unit-toggle");
const errorMsgEl     = document.getElementById("error-msg");
const promptEl       = document.getElementById("prompt");
const loadingEl      = document.getElementById("loading");
const dashboardEl    = document.getElementById("dashboard");

const cityNameEl     = document.getElementById("city-name");
const conditionDescEl = document.getElementById("condition-desc");
const weatherIconEl  = document.getElementById("weather-icon");
const currentTempEl  = document.getElementById("current-temp");
const feelsLikeEl    = document.getElementById("feels-like");
const humidityEl     = document.getElementById("humidity");
const windEl         = document.getElementById("wind");

const aqiBadgeEl     = document.getElementById("aqi-badge");
const aqiLabelEl     = document.getElementById("aqi-label");
const pm25El         = document.getElementById("pm25");
const pm10El         = document.getElementById("pm10");
const coEl           = document.getElementById("co");

const hourlyStripEl  = document.getElementById("hourly-strip");
const forecastRowEl  = document.getElementById("forecast-row");
const mapLayerBtns   = document.querySelectorAll(".map-layer-btn");

// ── Weather icon mapping (OWM code → Basmilius animated SVG) ──
const OWM_ICON_MAP = {
  "01d": "clear-day",
  "01n": "clear-night",
  "02d": "partly-cloudy-day",
  "02n": "partly-cloudy-night",
  "03d": "cloudy",
  "03n": "cloudy",
  "04d": "overcast",
  "04n": "overcast",
  "09d": "drizzle",
  "09n": "drizzle",
  "10d": "rain",
  "10n": "rain",
  "11d": "thunderstorms-rain",
  "11n": "thunderstorms-rain",
  "13d": "snow",
  "13n": "snow",
  "50d": "fog",
  "50n": "fog",
};

function weatherIconUrl(owmIcon) {
  const name = OWM_ICON_MAP[owmIcon] ?? "cloudy";
  return `https://cdn.jsdelivr.net/gh/basmilius/weather-icons@dev/production/fill/all/${name}.svg`;
}

// ── API key helper (defined after DOM refs) ──
function getApiKey() {
  const custom = apiKeyInputEl ? apiKeyInputEl.value.trim() : "";
  return custom || DEFAULT_API_KEY;
}

// ── State ──
let isFahrenheit   = true;
let cachedWeather  = null;
let cachedForecast = null;
let cachedHourly   = null;
let leafletMap     = null;
let owmLayer       = null;
let activeMapLayer = "precipitation_new";

// ── Event Listeners ──
searchBtn.addEventListener("click", handleSearch);
cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});
unitToggleBtn.addEventListener("click", toggleUnits);
mapLayerBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    mapLayerBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeMapLayer = btn.dataset.layer;
    updateMapLayer();
  });
});

// ── Unit helpers ──
// Raw API data is always in metric (°C, m/s). Convert for display.
function displayTemp(celsius) {
  if (isFahrenheit) return `${Math.round(celsius * 9 / 5 + 32)}°F`;
  return `${Math.round(celsius)}°C`;
}

function displayWind(mps) {
  if (isFahrenheit) return `${Math.round(mps * 2.237)} mph`;
  return `${Math.round(mps * 3.6)} km/h`;
}

// ── UI state helpers ──
function showError(message) {
  errorMsgEl.textContent = message;
  errorMsgEl.classList.remove("hidden");
}

function clearError() {
  errorMsgEl.textContent = "";
  errorMsgEl.classList.add("hidden");
}

function showLoading() {
  promptEl.classList.add("hidden");
  dashboardEl.classList.add("hidden");
  loadingEl.classList.remove("hidden");
}

function showDashboard() {
  loadingEl.classList.add("hidden");
  dashboardEl.classList.remove("hidden");
}

function showPrompt() {
  loadingEl.classList.add("hidden");
  dashboardEl.classList.add("hidden");
  promptEl.classList.remove("hidden");
}

// ── Main search ──
async function handleSearch() {
  const city = cityInput.value.trim();
  if (!city) return;

  clearError();
  showLoading();

  try {
    // Fetch current weather first to get lat/lon for One Call API
    const weatherRes = await fetch(
      `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${getApiKey()}&units=metric`
    );
    if (!weatherRes.ok) {
      throw new Error(weatherRes.status === 404 ? "City not found." : `Weather API error (${weatherRes.status}).`);
    }
    cachedWeather = await weatherRes.json();
    const { lat, lon } = cachedWeather.coord;

    // Fire forecast, One Call (hourly), and AQI in parallel now that we have coords
    const [forecastRes, oneCallRes] = await Promise.all([
      fetch(`${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${getApiKey()}&units=metric`),
      fetch(`${BASE_URL}/onecall?lat=${lat}&lon=${lon}&appid=${getApiKey()}&units=metric&exclude=current,minutely,daily,alerts`),
    ]);

    if (!forecastRes.ok) {
      throw new Error(`Forecast API error (${forecastRes.status}).`);
    }
    cachedForecast = await forecastRes.json();

    // One Call hourly is best-effort — fall back to 3-hour forecast if unavailable
    cachedHourly = null;
    if (oneCallRes.ok) {
      const oneCallData = await oneCallRes.json();
      cachedHourly = oneCallData.hourly ?? null;
    }

    renderCurrentWeather(cachedWeather);
    renderForecast(cachedForecast, cachedHourly);
    showDashboard();

    centerMap(lat, lon);
    fetchAndRenderAirQuality(lat, lon);

  } catch (err) {
    showPrompt();
    showError(err.message);
  }
}

// ── Render: current weather ──
function renderCurrentWeather(data) {
  cityNameEl.textContent      = `${data.name}, ${data.sys.country}`;
  conditionDescEl.textContent = data.weather[0].description;
  weatherIconEl.src           = weatherIconUrl(data.weather[0].icon);
  weatherIconEl.alt           = data.weather[0].description;
  currentTempEl.textContent   = displayTemp(data.main.temp);
  feelsLikeEl.textContent     = `Feels like ${displayTemp(data.main.feels_like)}`;
  humidityEl.textContent      = `${data.main.humidity}%`;
  windEl.textContent          = displayWind(data.wind.speed);
}

// ── Render: forecast (hourly strip + 5-day) ──
function renderForecast(data, hourlyData) {
  // One Call hourly gives true 1-hour intervals; fall back to 3-hour forecast data
  const useOneCall = Array.isArray(hourlyData) && hourlyData.length > 0;
  const hourlyItems = useOneCall ? hourlyData.slice(0, 12) : data.list.slice(0, 4);

  hourlyStripEl.innerHTML = hourlyItems.map((item) => {
    const time = new Date(item.dt * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    // One Call hourly stores temp directly; forecast stores it under main.temp
    const temp = useOneCall ? item.temp : item.main.temp;
    return `
      <div class="hourly-item">
        <span class="hourly-time">${time}</span>
        <img
          src="${weatherIconUrl(item.weather[0].icon)}"
          alt="${item.weather[0].description}"
          class="hourly-icon"
        />
        <span class="hourly-temp">${displayTemp(temp)}</span>
      </div>`;
  }).join("");

  const noonItems = data.list
    .filter((item) => item.dt_txt.includes("12:00:00"))
    .slice(0, 5);

  forecastRowEl.innerHTML = noonItems.map((item) => {
    const day = new Date(item.dt * 1000).toLocaleDateString([], { weekday: "short" });
    return `
      <div class="forecast-card">
        <span class="forecast-day">${day}</span>
        <img
          src="${weatherIconUrl(item.weather[0].icon)}"
          alt="${item.weather[0].description}"
          class="forecast-icon"
        />
        <div class="forecast-temps">
          <span class="forecast-high">${displayTemp(item.main.temp_max)}</span>
          <span class="forecast-low">${displayTemp(item.main.temp_min)}</span>
        </div>
      </div>`;
  }).join("");
}

// ── Render: air quality ──
const AQI_LABELS = ["", "Good", "Fair", "Moderate", "Poor", "Very Poor"];
const AQI_COLORS = ["", "#4caf50", "#8bc34a", "#ffeb3b", "#ff9800", "#f44336"];

async function fetchAndRenderAirQuality(lat, lon) {
  try {
    const res = await fetch(
      `${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${getApiKey()}`
    );
    if (!res.ok) return;
    const data = await res.json();
    renderAirQuality(data);
  } catch {
    // AQI is non-critical — fail silently
  }
}

function renderAirQuality(data) {
  const { aqi }                      = data.list[0].main;
  const { pm2_5, pm10, co }          = data.list[0].components;

  aqiBadgeEl.textContent             = aqi;
  aqiBadgeEl.style.backgroundColor   = AQI_COLORS[aqi];
  aqiLabelEl.textContent             = AQI_LABELS[aqi];
  pm25El.textContent                 = `${pm2_5.toFixed(1)} µg/m³`;
  pm10El.textContent                 = `${pm10.toFixed(1)} µg/m³`;
  coEl.textContent                   = `${co.toFixed(1)} µg/m³`;
}

// ── Unit toggle ──
function toggleUnits() {
  isFahrenheit = !isFahrenheit;
  unitToggleBtn.textContent = isFahrenheit ? "Switch to °C" : "Switch to °F";
  if (cachedWeather)  renderCurrentWeather(cachedWeather);
  if (cachedForecast) renderForecast(cachedForecast, cachedHourly);
}

// ── Map ──
function initMap() {
  if (leafletMap) return;

  leafletMap = L.map("weather-map").setView([20, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(leafletMap);

  updateMapLayer();
}

function centerMap(lat, lon) {
  initMap();
  leafletMap.setView([lat, lon], 9);
  updateMapLayer();
}

function updateMapLayer() {
  if (!leafletMap) return;

  if (owmLayer) {
    leafletMap.removeLayer(owmLayer);
  }

  owmLayer = L.tileLayer(
    `https://tile.openweathermap.org/map/${activeMapLayer}/{z}/{x}/{y}.png?appid=${getApiKey()}`,
    { opacity: 0.7, maxZoom: 18 }
  );
  owmLayer.addTo(leafletMap);
}
