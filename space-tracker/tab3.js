/**
 * tab3.js — NEO Watch: Asteroid Detail view with sidebar (Tab 3)
 * Depends on: app.js (window.AppState, window.fetchAsteroidProfile)
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Formatting helpers
  // ---------------------------------------------------------------------------

  function fmtKm(val) {
    return parseFloat(val).toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  function fmtLd(val) {
    return parseFloat(val).toFixed(2);
  }

  function fmtKps(val) {
    return parseFloat(val).toFixed(2);
  }

  function hazardBadge(isHazardous) {
    if (isHazardous) {
      return '<span class="hazard-badge hazardous">Potentially Hazardous</span>';
    }
    return '<span class="hazard-badge safe">Safe</span>';
  }

  function formatApproachRow(approach) {
    const km = fmtKm(approach.miss_distance.kilometers);
    const ld = fmtLd(approach.miss_distance.lunar);
    const kps = fmtKps(approach.relative_velocity.kilometers_per_second);
    return `
      <div class="approach-row">
        <span class="approach-date">${approach.close_approach_date}</span>
        <span class="approach-miss">${km} km / ${ld} LD</span>
        <span class="approach-vel">${kps} km/s</span>
      </div>`;
  }

  // ---------------------------------------------------------------------------
  // Sidebar rendering
  // ---------------------------------------------------------------------------

  function buildSidebarList(neos) {
    const ul = document.getElementById('sidebar-list');
    if (!ul) return;
    ul.innerHTML = '';

    neos.forEach(neo => {
      const li = document.createElement('li');
      li.dataset.id = neo.id;
      li.textContent = neo.name;
      li.addEventListener('click', () => {
        window.Tab3.selectAsteroid(neo.id);
      });
      ul.appendChild(li);
    });
  }

  // ---------------------------------------------------------------------------
  // Profile rendering
  // ---------------------------------------------------------------------------

  function renderProfile(asteroid) {
    const placeholder = document.getElementById('detail-placeholder');
    const content = document.getElementById('detail-content');
    const overview = document.getElementById('detail-overview');
    const approaches = document.getElementById('detail-approaches');

    if (placeholder) placeholder.classList.add('hidden');
    if (content) content.classList.remove('hidden');

    // ---- Overview ----
    const diamMeters = asteroid.estimated_diameter && asteroid.estimated_diameter.meters;
    const dMin = diamMeters ? diamMeters.estimated_diameter_min : 0;
    const dMax = diamMeters ? diamMeters.estimated_diameter_max : 0;
    const dMinFt = dMin * 3.28084;
    const dMaxFt = dMax * 3.28084;
    const orbPeriod = asteroid.orbital_data
      ? parseFloat(asteroid.orbital_data.orbital_period).toFixed(2)
      : 'N/A';

    const badge = hazardBadge(asteroid.is_potentially_hazardous_asteroid);

    overview.innerHTML = `
      <h2>${asteroid.name}</h2>
      ${badge}
      <div class="detail-stats-grid">
        <div class="stat">
          <label>NASA ID</label>
          <span>${asteroid.id}</span>
        </div>
        <div class="stat">
          <label>Abs. Magnitude</label>
          <span>${asteroid.absolute_magnitude_h}</span>
        </div>
        <div class="stat">
          <label>Diameter</label>
          <span>${Math.round(dMin)}–${Math.round(dMax)} m (${Math.round(dMinFt)}–${Math.round(dMaxFt)} ft)</span>
        </div>
        <div class="stat">
          <label>Orbital Period</label>
          <span>${orbPeriod} days</span>
        </div>
      </div>
    `;

    // ---- Approach history ----
    const allApproaches = asteroid.close_approach_data || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const past = allApproaches
      .filter(a => new Date(a.close_approach_date) < today)
      .sort((a, b) => new Date(b.close_approach_date) - new Date(a.close_approach_date));

    const future = allApproaches
      .filter(a => new Date(a.close_approach_date) >= today)
      .sort((a, b) => new Date(a.close_approach_date) - new Date(b.close_approach_date));

    // All-time closest approach (min miss distance across all approach data)
    let closestApproach = null;
    if (allApproaches.length > 0) {
      closestApproach = allApproaches.reduce((min, a) => {
        const km = parseFloat(a.miss_distance.kilometers);
        const minKm = parseFloat(min.miss_distance.kilometers);
        return km < minKm ? a : min;
      });
    }

    let html = '<h3>Close Approach History</h3>';

    if (closestApproach) {
      html += `
        <div class="approach-section">
          <h4>All-Time Closest Approach</h4>
          ${formatApproachRow(closestApproach)}
        </div>`;
    }

    if (past.length > 0) {
      const last3 = past.slice(0, 3);
      html += `
        <div class="approach-section">
          <h4>Recent Historical Approaches</h4>
          ${last3.map(formatApproachRow).join('')}
        </div>`;
    } else {
      html += `
        <div class="approach-section">
          <p class="no-data">No historical data available</p>
        </div>`;
    }

    if (future.length > 0) {
      const next = future[0];
      html += `
        <div class="approach-section">
          <h4>Next Upcoming Approach</h4>
          ${formatApproachRow(next)}
        </div>`;
    } else {
      html += `
        <div class="approach-section">
          <p class="no-data">No upcoming approaches on record</p>
        </div>`;
    }

    approaches.innerHTML = html;
  }

  // ---------------------------------------------------------------------------
  // Show loading state in the detail panel
  // ---------------------------------------------------------------------------

  function showDetailLoading() {
    const placeholder = document.getElementById('detail-placeholder');
    const content = document.getElementById('detail-content');
    if (placeholder) {
      placeholder.classList.remove('hidden');
      placeholder.innerHTML = '<p>Loading asteroid profile…</p>';
    }
    if (content) content.classList.add('hidden');
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  window.Tab3 = {
    init(neos) {
      buildSidebarList(neos || []);

      // Auto-select if a NEO was already selected
      if (window.AppState && window.AppState.selectedNeoId) {
        window.Tab3.selectAsteroid(window.AppState.selectedNeoId);
      }
    },

    async selectAsteroid(id) {
      if (!id) return;

      window.AppState.selectedNeoId = id;

      // Highlight the sidebar item
      const ul = document.getElementById('sidebar-list');
      if (ul) {
        ul.querySelectorAll('li').forEach(li => {
          if (li.dataset.id === String(id)) {
            li.classList.add('selected');
            li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } else {
            li.classList.remove('selected');
          }
        });
      }

      // Show loading state
      showDetailLoading();

      // Fetch and render the profile
      const asteroid = await window.fetchAsteroidProfile(id);
      if (asteroid) {
        renderProfile(asteroid);
      } else {
        const placeholder = document.getElementById('detail-placeholder');
        if (placeholder) {
          placeholder.classList.remove('hidden');
          placeholder.innerHTML = '<p>Failed to load asteroid profile. Please try again.</p>';
        }
      }
    },

    renderProfile
  };

})();
