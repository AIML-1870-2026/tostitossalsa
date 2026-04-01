/**
 * tab4.js — NEO Watch: Progressive 30-day forecast (Tab 4)
 * Depends on: app.js (window.getDateStr, window.fetchFeedRange, window.navigateToTab)
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Card rendering
  // ---------------------------------------------------------------------------

  function renderForecastCard(neo) {
    const approach = neo.close_approach_data && neo.close_approach_data[0];

    const date = approach ? approach.close_approach_date : '—';
    const km = approach
      ? parseFloat(approach.miss_distance.kilometers).toLocaleString(undefined, { maximumFractionDigits: 0 })
      : '—';
    const ld = approach
      ? parseFloat(approach.miss_distance.lunar).toFixed(2)
      : '—';
    const kps = approach
      ? parseFloat(approach.relative_velocity.kilometers_per_second).toFixed(2)
      : '—';

    const dMin = (neo.estimated_diameter && neo.estimated_diameter.meters)
      ? Math.round(neo.estimated_diameter.meters.estimated_diameter_min)
      : 0;
    const dMax = (neo.estimated_diameter && neo.estimated_diameter.meters)
      ? Math.round(neo.estimated_diameter.meters.estimated_diameter_max)
      : 0;

    const isHazardous = neo.is_potentially_hazardous_asteroid;
    const badge = isHazardous
      ? '<span class="hazard-badge hazardous">Potentially Hazardous</span>'
      : '<span class="hazard-badge safe">Safe</span>';

    const card = document.createElement('div');
    card.className = 'forecast-card';
    if (isHazardous) card.classList.add('hazardous');

    card.innerHTML = `
      <div class="forecast-card-name">${neo.name}</div>
      ${badge}
      <div class="forecast-card-details">
        <div class="forecast-stat">
          <label>Approach Date</label>
          <span>${date}</span>
        </div>
        <div class="forecast-stat">
          <label>Miss Distance</label>
          <span>${km} km / ${ld} LD</span>
        </div>
        <div class="forecast-stat">
          <label>Est. Size</label>
          <span>${dMin}–${dMax} m</span>
        </div>
        <div class="forecast-stat">
          <label>Speed</label>
          <span>${kps} km/s</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      if (typeof window.navigateToTab === 'function') {
        window.navigateToTab(3, neo.id);
      }
    });

    return card;
  }

  // ---------------------------------------------------------------------------
  // Append a batch of NEOs to the forecast grid
  // ---------------------------------------------------------------------------

  function appendBatch(neos) {
    const grid = document.getElementById('forecast-grid');
    if (!grid || !neos.length) return;

    // Sort within batch by approach date ascending
    const sorted = neos.slice().sort((a, b) => {
      const aApproach = a.close_approach_data && a.close_approach_data[0];
      const bApproach = b.close_approach_data && b.close_approach_data[0];
      const aDate = aApproach ? new Date(aApproach.close_approach_date).getTime() : 0;
      const bDate = bApproach ? new Date(bApproach.close_approach_date).getTime() : 0;
      return aDate - bDate;
    });

    sorted.forEach(neo => {
      const card = renderForecastCard(neo);
      grid.appendChild(card);
    });
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  window.Tab4 = {
    async init() {
      const loadingEl = document.getElementById('forecast-loading');

      // Define 5 weekly batches: today → today+6, today+7 → today+13, etc.
      const batches = [
        { start: 0,  end: 6  },
        { start: 7,  end: 13 },
        { start: 14, end: 20 },
        { start: 21, end: 27 },
        { start: 28, end: 34 },
      ];

      for (const batch of batches) {
        const startDate = window.getDateStr(batch.start);
        const endDate = window.getDateStr(batch.end);

        // Show spinner
        if (loadingEl) loadingEl.classList.remove('hidden');

        let results = [];
        try {
          results = await window.fetchFeedRange(startDate, endDate);
        } catch (err) {
          console.error('Forecast batch failed:', batch, err);
          results = [];
        }

        if (results && results.length > 0) {
          appendBatch(results);
        }
        // If empty, skip silently
      }

      // All batches done — hide spinner
      if (loadingEl) loadingEl.classList.add('hidden');
    }
  };

})();
