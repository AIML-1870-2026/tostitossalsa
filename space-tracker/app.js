/**
 * app.js — NEO Watch: Core app logic, API, navigation
 * Loaded first. Exposes: AppState, navigateToTab, fetchAsteroidProfile
 * (fetchFeedRange and helpers are module-scoped but used by tab scripts via
 *  window.fetchFeedRange / window.fetchAsteroidProfile so they are attached below)
 */

'use strict';

// ---------------------------------------------------------------------------
// API Config
// ---------------------------------------------------------------------------

const NASA_API_KEY = 'DEMO_KEY';
const NEO_BASE = 'https://api.nasa.gov/neo/rest/v1';

// ---------------------------------------------------------------------------
// Global state
// ---------------------------------------------------------------------------

window.AppState = {
  neos: [],           // this week's NEOs (flat array)
  selectedNeoId: null,
  currentTab: 1
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Returns a 'YYYY-MM-DD' string.
 * offsetDays=0 → today, offsetDays=-6 → 6 days ago, offsetDays=6 → 6 days from now
 */
function getDateStr(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Expose globally so tab scripts can use it
window.getDateStr = getDateStr;

function showError(msg) {
  const banner = document.getElementById('error-banner');
  const messageEl = document.getElementById('error-message');
  const closeBtn = document.getElementById('error-close');

  if (messageEl) messageEl.textContent = msg;
  if (banner) banner.classList.remove('hidden');

  if (closeBtn) {
    // Remove any existing listener to avoid stacking
    const newClose = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newClose, closeBtn);
    newClose.addEventListener('click', hideError);
  }
}

function hideError() {
  const banner = document.getElementById('error-banner');
  if (banner) banner.classList.add('hidden');
}

// ---------------------------------------------------------------------------
// NASA API functions
// ---------------------------------------------------------------------------

/**
 * Fetches /feed?start_date=...&end_date=... and returns a flat array of NEOs.
 * On error, calls showError() and returns [].
 */
async function fetchFeedRange(startDate, endDate) {
  const url = `${NEO_BASE}/feed?start_date=${startDate}&end_date=${endDate}&api_key=${NASA_API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      showError(`API error ${res.status}: ${text || res.statusText}`);
      return [];
    }
    const data = await res.json();
    if (!data || typeof data.near_earth_objects !== 'object') {
      showError('Unexpected API response format. Please try again.');
      return [];
    }
    const neosByDate = data.near_earth_objects;
    // Flatten all date arrays into one array
    const flat = Object.values(neosByDate).reduce((acc, arr) => acc.concat(arr), []);
    return flat;
  } catch (err) {
    showError(`Network error: ${err.message}`);
    return [];
  }
}

/**
 * Fetches /neo/{id} and returns the full asteroid object, or null on error.
 */
async function fetchAsteroidProfile(id) {
  const url = `${NEO_BASE}/neo/${id}?api_key=${NASA_API_KEY}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      showError(`API error ${res.status}: ${text || res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    showError(`Network error: ${err.message}`);
    return null;
  }
}

// Expose API functions globally so tab scripts can call them
window.fetchFeedRange = fetchFeedRange;
window.fetchAsteroidProfile = fetchAsteroidProfile;

// ---------------------------------------------------------------------------
// Tab navigation
// ---------------------------------------------------------------------------

window.navigateToTab = function (tabNum, neoId = null) {
  // Hide all tab panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.add('hidden');
    panel.classList.remove('active');
  });

  // Deactivate all tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show target panel
  const targetPanel = document.getElementById(`tab-${tabNum}`);
  if (targetPanel) {
    targetPanel.classList.remove('hidden');
    targetPanel.classList.add('active');
  }

  // Activate target button
  const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabNum}"]`);
  if (targetBtn) targetBtn.classList.add('active');

  // Update state
  window.AppState.currentTab = tabNum;

  if (neoId !== null) {
    window.AppState.selectedNeoId = neoId;
  }

  // Call the appropriate tab render/select function
  if (tabNum === 1 && window.Tab1 && typeof window.Tab1.refresh === 'function') {
    window.Tab1.refresh(window.AppState.neos);
  }

  if (tabNum === 3 && window.Tab3 && typeof window.Tab3.selectAsteroid === 'function' && neoId !== null) {
    window.Tab3.selectAsteroid(neoId);
  }
};

// Wire up tab button clicks
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.navigateToTab(parseInt(btn.dataset.tab, 10));
    });
  });
});

// ---------------------------------------------------------------------------
// Init sequence
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async function () {
  const app = document.getElementById('app');

  // Show loading state
  if (app) app.classList.add('loading');

  // Compute date range: today - 6 days → today
  const startDate = getDateStr(-6);
  const endDate = getDateStr(0);

  // Fetch this week's NEOs
  const neos = await fetchFeedRange(startDate, endDate);
  window.AppState.neos = neos;

  // Remove loading state
  if (app) app.classList.remove('loading');

  // Initialize all tabs
  if (window.Tab1 && typeof window.Tab1.init === 'function') {
    window.Tab1.init();
  }

  if (window.Tab2 && typeof window.Tab2.render === 'function') {
    window.Tab2.render(window.AppState.neos);
  }

  if (window.Tab3 && typeof window.Tab3.init === 'function') {
    window.Tab3.init(window.AppState.neos);
  }

  if (window.Tab4 && typeof window.Tab4.init === 'function') {
    window.Tab4.init();
  }
});
