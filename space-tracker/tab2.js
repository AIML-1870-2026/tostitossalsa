/**
 * tab2.js — NEO Watch: Sortable "This Week" table (Tab 2)
 * Depends on: app.js (window.navigateToTab)
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Sort state
  // ---------------------------------------------------------------------------

  let sortState = { col: 'date', dir: 'asc' };
  let currentNeos = [];
  let headersWired = false;

  // ---------------------------------------------------------------------------
  // Formatting helpers
  // ---------------------------------------------------------------------------

  function formatMissDistance(approach) {
    const km = parseFloat(approach.miss_distance.kilometers);
    const ld = parseFloat(approach.miss_distance.lunar);
    return `${km.toLocaleString(undefined, { maximumFractionDigits: 0 })} km / ${ld.toFixed(2)} LD`;
  }

  function formatDiameter(neo) {
    if (!neo.estimated_diameter || !neo.estimated_diameter.meters) return '—';
    const dMin = neo.estimated_diameter.meters.estimated_diameter_min;
    const dMax = neo.estimated_diameter.meters.estimated_diameter_max;
    return `${Math.round(dMin)}–${Math.round(dMax)} m`;
  }

  function formatVelocity(approach) {
    return `${parseFloat(approach.relative_velocity.kilometers_per_second).toFixed(2)} km/s`;
  }

  function hazardBadge(neo) {
    if (neo.is_potentially_hazardous_asteroid) {
      return '<span class="hazard-badge hazardous">Potentially Hazardous</span>';
    }
    return '<span class="hazard-badge safe">Safe</span>';
  }

  // ---------------------------------------------------------------------------
  // Sort helpers
  // ---------------------------------------------------------------------------

  function getSortValue(neo, col) {
    const approach = neo.close_approach_data && neo.close_approach_data[0];
    switch (col) {
      case 'name':
        return neo.name.toLowerCase();
      case 'miss_km':
        return approach ? parseFloat(approach.miss_distance.kilometers) : 0;
      case 'diameter':
        return (neo.estimated_diameter && neo.estimated_diameter.meters)
          ? neo.estimated_diameter.meters.estimated_diameter_min
          : 0;
      case 'velocity':
        return approach ? parseFloat(approach.relative_velocity.kilometers_per_second) : 0;
      case 'date':
        return approach ? new Date(approach.close_approach_date).getTime() : 0;
      case 'hazard':
        // hazardous first for 'asc' → treat hazardous as 0, safe as 1
        return neo.is_potentially_hazardous_asteroid ? 0 : 1;
      default:
        return 0;
    }
  }

  function sortNeos(neos, col, dir) {
    const sorted = neos.slice().sort((a, b) => {
      const va = getSortValue(a, col);
      const vb = getSortValue(b, col);
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }

  // ---------------------------------------------------------------------------
  // Row rendering
  // ---------------------------------------------------------------------------

  function buildRow(neo) {
    const approach = neo.close_approach_data && neo.close_approach_data[0];
    const tr = document.createElement('tr');

    // Name cell — clickable link
    const tdName = document.createElement('td');
    const nameLink = document.createElement('a');
    nameLink.href = '#';
    nameLink.textContent = neo.name;
    nameLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof window.navigateToTab === 'function') {
        window.navigateToTab(3, neo.id);
      }
    });
    tdName.appendChild(nameLink);
    tr.appendChild(tdName);

    // Miss distance
    const tdMiss = document.createElement('td');
    tdMiss.textContent = approach ? formatMissDistance(approach) : '—';
    tr.appendChild(tdMiss);

    // Diameter
    const tdDiam = document.createElement('td');
    tdDiam.textContent = formatDiameter(neo);
    tr.appendChild(tdDiam);

    // Velocity
    const tdVel = document.createElement('td');
    tdVel.textContent = approach ? formatVelocity(approach) : '—';
    tr.appendChild(tdVel);

    // Approach date
    const tdDate = document.createElement('td');
    tdDate.textContent = approach ? approach.close_approach_date : '—';
    tr.appendChild(tdDate);

    // Hazard badge
    const tdHazard = document.createElement('td');
    tdHazard.innerHTML = hazardBadge(neo);
    tr.appendChild(tdHazard);

    // Row click — navigate to Tab 3 (name link handles its own click; row click for other cells)
    tr.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') return; // let the link handle it
      if (typeof window.navigateToTab === 'function') {
        window.navigateToTab(3, neo.id);
      }
    });

    return tr;
  }

  // ---------------------------------------------------------------------------
  // Render tbody rows
  // ---------------------------------------------------------------------------

  function renderRows() {
    const tbody = document.getElementById('neo-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    const sorted = sortNeos(currentNeos, sortState.col, sortState.dir);
    sorted.forEach(neo => tbody.appendChild(buildRow(neo)));

    updateSortIcons();
  }

  // ---------------------------------------------------------------------------
  // Sort icon updates
  // ---------------------------------------------------------------------------

  function updateSortIcons() {
    document.querySelectorAll('#neo-table thead th.sortable').forEach(th => {
      const icon = th.querySelector('.sort-icon');
      if (!icon) return;
      if (th.dataset.col === sortState.col) {
        icon.textContent = sortState.dir === 'asc' ? '↑' : '↓';
      } else {
        icon.textContent = '↕';
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Sort header click wiring
  // ---------------------------------------------------------------------------

  function wireSortHeaders() {
    if (headersWired) return;
    headersWired = true;
    document.querySelectorAll('#neo-table thead th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.col;
        if (col === sortState.col) {
          sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
        } else {
          sortState.col = col;
          sortState.dir = 'asc';
        }
        renderRows();
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  window.Tab2 = {
    render(neos) {
      currentNeos = neos || [];
      // Wire sort headers once (idempotent — duplicate clicks are harmless since
      // each call to render replaces the same handlers on the same static <th> elements)
      wireSortHeaders();
      renderRows();
    }
  };

})();
