/**
 * tab1.js — NEO Watch: 3D Earth Globe (Tab 1)
 * Depends on: globe.gl (window.Globe), app.js (window.AppState)
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function seededRng(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function neoToPoint(neo) {
    const approach = neo.close_approach_data && neo.close_approach_data[0];
    if (!approach) return null;
    if (!neo.estimated_diameter || !neo.estimated_diameter.meters) return null;

    const missKm = parseFloat(approach.miss_distance.kilometers);
    const missLd = parseFloat(approach.miss_distance.lunar);
    const velocity = parseFloat(approach.relative_velocity.kilometers_per_second);
    const dMin = neo.estimated_diameter.meters.estimated_diameter_min;
    const dMax = neo.estimated_diameter.meters.estimated_diameter_max;
    const numericId = parseInt(neo.id, 10) || 0;

    const lat = seededRng(numericId) * 180 - 90;
    const lng = seededRng(numericId + 1) * 360 - 180;
    const altitude = Math.max(0.1, Math.min(missKm / 500000, 2.0));
    const color = neo.is_potentially_hazardous_asteroid ? '#ef4444' : '#22c55e';

    return {
      lat,
      lng,
      altitude,
      color,
      radius: 0.5,
      neo,
      label: neo.name,
      missKm,
      missLd,
      velocity,
      dMin,
      dMax,
      date: approach.close_approach_date,
    };
  }

  function moonPoint() {
    return {
      lat: 0,
      lng: 90,
      altitude: 384400 / 500000, // ~0.769
      color: '#c0c0c0',
      radius: 0.8,
      neo: null,
      label: 'Moon \u2014 1 LD',
      isMoon: true,
    };
  }

  function getDateForOffset(offset) {
    // slider value: 6 = today, 0 = 6 days ago
    const d = new Date();
    d.setDate(d.getDate() - (6 - offset));
    return d;
  }

  function formatDateISO(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatDateDisplay(d) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  let globeInstance = null;
  let currentNeos = [];

  // ---------------------------------------------------------------------------
  // Tooltip
  // ---------------------------------------------------------------------------

  function showTooltip(point) {
    if (point.isMoon) return;
    const neo = point.neo;
    if (!neo) return;

    const tooltip = document.getElementById('asteroid-tooltip');
    const nameEl = document.getElementById('tooltip-name');
    const bodyEl = document.getElementById('tooltip-body');
    const profileBtn = document.getElementById('tooltip-profile-btn');

    nameEl.textContent = neo.name;

    const hazardBadge = neo.is_potentially_hazardous_asteroid
      ? '<span class="hazard-badge hazardous">Potentially Hazardous</span>'
      : '<span class="hazard-badge safe">Safe</span>';

    bodyEl.innerHTML = `
      <table class="tooltip-table">
        <tr><th>Miss Distance</th><td>${point.missKm.toLocaleString(undefined, { maximumFractionDigits: 0 })} km (${point.missLd.toFixed(2)} LD)</td></tr>
        <tr><th>Diameter</th><td>${Math.round(point.dMin)}–${Math.round(point.dMax)} m</td></tr>
        <tr><th>Speed</th><td>${point.velocity.toFixed(2)} km/s</td></tr>
        <tr><th>Hazard</th><td>${hazardBadge}</td></tr>
        <tr><th>Approach Date</th><td>${point.date}</td></tr>
      </table>
    `;

    profileBtn.dataset.asteroidId = neo.id;
    tooltip.classList.remove('hidden');
  }

  function hideTooltip() {
    const tooltip = document.getElementById('asteroid-tooltip');
    if (tooltip) tooltip.classList.add('hidden');
  }

  // ---------------------------------------------------------------------------
  // Filtering by date
  // ---------------------------------------------------------------------------

  function filterByDate(neos, dateISO) {
    return neos.filter(neo => {
      if (!neo.close_approach_data || !neo.close_approach_data.length) return false;
      // Include neo if any close approach is on this date
      return neo.close_approach_data.some(ca => ca.close_approach_date === dateISO);
    });
  }

  function buildPoints(neos, dateISO) {
    const filtered = filterByDate(neos, dateISO);
    const astPoints = filtered.map(neoToPoint).filter(Boolean);
    return [moonPoint(), ...astPoints];
  }

  // ---------------------------------------------------------------------------
  // Globe setup
  // ---------------------------------------------------------------------------

  function initGlobe(neos) {
    const container = document.getElementById('globe-container');
    if (!container) return;

    if (typeof window.Globe === 'undefined') {
      container.innerHTML = '<div style="color:#ef4444;padding:2rem;text-align:center;">globe.gl failed to load from CDN. Please check your connection and refresh.</div>';
      return;
    }

    const sliderEl = document.getElementById('time-slider');
    const labelEl = document.getElementById('time-label');

    // Determine initial date (slider defaults to 6 = today)
    const initialOffset = parseInt(sliderEl ? sliderEl.value : 6, 10);
    const initialDate = getDateForOffset(initialOffset);
    const initialISO = formatDateISO(initialDate);

    if (labelEl) labelEl.textContent = initialOffset === 6 ? 'Today' : formatDateDisplay(initialDate);

    const points = buildPoints(neos, initialISO);

    const w = container.offsetWidth || window.innerWidth;
    const h = container.offsetHeight || window.innerHeight - 80;

    globeInstance = Globe()(container)
      .width(w)
      .height(h)
      .backgroundColor('#0a0c14')
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .pointsData(points)
      .pointLat(d => d.lat)
      .pointLng(d => d.lng)
      .pointAltitude(d => d.altitude)
      .pointColor(d => d.color)
      .pointRadius(d => d.radius)
      .pointLabel(d => d.label)
      .onPointClick(point => showTooltip(point));

    // Disable auto-rotation
    if (typeof globeInstance.controls === 'function') {
      const controls = globeInstance.controls();
      if (controls) {
        controls.autoRotate = false;
        controls.enableDamping = true;
      }
    }

    // Window resize handler
    window.addEventListener('resize', () => {
      if (!globeInstance) return;
      const cw = container.offsetWidth;
      const ch = container.offsetHeight;
      if (cw && ch) {
        globeInstance.width(cw).height(ch);
      }
    });

    // Time slider
    if (sliderEl) {
      sliderEl.addEventListener('input', () => {
        const offset = parseInt(sliderEl.value, 10);
        const date = getDateForOffset(offset);
        const iso = formatDateISO(date);
        if (labelEl) {
          labelEl.textContent = offset === 6 ? 'Today' : formatDateDisplay(date);
        }
        const newPoints = buildPoints(currentNeos, iso);
        globeInstance.pointsData(newPoints);
      });
    }

    // Tooltip close button
    const closeBtn = document.getElementById('tooltip-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', hideTooltip);
    }

    // Profile button
    const profileBtn = document.getElementById('tooltip-profile-btn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        const asteroidId = profileBtn.dataset.asteroidId;
        if (asteroidId && typeof window.navigateToTab === 'function') {
          window.navigateToTab(3, asteroidId);
        }
        hideTooltip();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  window.Tab1 = {
    init() {
      currentNeos = (window.AppState && window.AppState.neos) ? window.AppState.neos : [];
      initGlobe(currentNeos);
    },

    refresh(neos) {
      currentNeos = neos || [];
      if (!globeInstance) return;

      const sliderEl = document.getElementById('time-slider');
      const offset = parseInt((sliderEl && sliderEl.value) || 6, 10);
      const date = getDateForOffset(offset);
      const iso = formatDateISO(date);
      const newPoints = buildPoints(currentNeos, iso);
      globeInstance.pointsData(newPoints);
    },
  };

})();
