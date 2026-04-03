'use strict';

const BASE = 'https://api.fda.gov';

// ── HELP CONTENT ────────────────────────────────────
const HELP = {
  ndc: {
    title: 'What is NDC Data?',
    body: `<p>The <strong>National Drug Code (NDC)</strong> database contains product information submitted by drug manufacturers to the FDA. Each drug product gets a unique code identifying its labeler, product, and package.</p>
           <p>This data shows the officially registered details for a drug — manufacturer, dosage form, active ingredients, and marketing status.</p>
           <div class="modal-caveat">NDC data reflects manufacturer submissions and may not capture every version or formulation available on the market.</div>`,
  },
  events: {
    title: 'What are Adverse Event Reports?',
    body: `<p>These are <strong>voluntary reports</strong> submitted to FDA's FAERS system by patients, doctors, pharmacists, and manufacturers when they suspect a drug caused a problem.</p>
           <p>A high count does <strong>NOT</strong> mean the drug causes this reaction — it means the reaction was reported while someone was taking the drug. Correlation, not causation.</p>
           <div class="modal-caveat">Key limitations: Underreporting is widespread. Popular drugs accumulate more reports simply due to usage volume. Reports often lack follow-up confirmation. The same event may appear multiple times.</div>`,
  },
  outcomes: {
    title: 'Understanding Outcome Severity',
    body: `<p>Serious outcomes are self-reported categories checked by the reporter at submission. A single adverse event can be marked serious for <em>multiple</em> reasons simultaneously.</p>
           <p><strong>Death, Hospitalization, Life-threatening,</strong> and <strong>Disability</strong> are distinct seriousness categories — counts will overlap.</p>
           <div class="modal-caveat">These are report counts, not confirmed causal incidents. Serious events are more likely to be reported than minor ones, creating survivorship bias in this data. Always consult a healthcare professional before making any medical decisions.</div>`,
  },
};

// ── MODAL ────────────────────────────────────────────
const overlay = document.getElementById('modal-overlay');
const modalT  = document.getElementById('modal-title');
const modalB  = document.getElementById('modal-body');

function openModal(key) {
  const h = HELP[key];
  if (!h) return;
  modalT.textContent = h.title;
  modalB.innerHTML   = h.body;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('modal-close').addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// Delegate all help button clicks
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-help]');
  if (btn) openModal(btn.dataset.help);
});

// ── BANNER ──────────────────────────────────────────
document.getElementById('dismiss-banner').addEventListener('click', () => {
  document.getElementById('banner').style.display = 'none';
});

// ── API HELPERS ──────────────────────────────────────
async function apiFetch(url) {
  try {
    const res  = await fetch(url);
    const data = await res.json();
    return data.error ? null : data;
  } catch {
    return null;
  }
}

async function fetchNDC(drug) {
  const variants = [drug.trim(), drug.trim().toUpperCase()];
  for (const v of variants) {
    const enc = encodeURIComponent('"' + v + '"');
    for (const field of ['brand_name', 'generic_name']) {
      const d = await apiFetch(BASE + '/drug/ndc.json?search=' + field + ':' + enc + '&limit=1');
      if (d?.results?.length) return d.results[0];
    }
  }
  return null;
}

async function fetchTopReactions(drug) {
  const variants = [drug.trim(), drug.trim().toUpperCase()];
  for (const v of variants) {
    const enc = encodeURIComponent('"' + v + '"');
    const d = await apiFetch(
      BASE + '/drug/event.json?search=patient.drug.medicinalproduct:' + enc +
      '&count=patient.reaction.reactionmeddrapt.exact&limit=10'
    );
    if (d?.results?.length) return d.results;
  }
  return [];
}

async function fetchTotalEvents(drug) {
  const variants = [drug.trim(), drug.trim().toUpperCase()];
  for (const v of variants) {
    const enc = encodeURIComponent('"' + v + '"');
    const d = await apiFetch(
      BASE + '/drug/event.json?search=patient.drug.medicinalproduct:' + enc + '&limit=1'
    );
    if (d?.meta?.results?.total != null) return d.meta.results.total;
  }
  return 0;
}

async function fetchOutcomeCounts(drug) {
  const enc  = encodeURIComponent('"' + drug.trim().toUpperCase() + '"');
  const base = 'patient.drug.medicinalproduct:' + enc;

  const outcomeFields = [
    { label: 'Hospitalization',  field: 'seriousnesshospitalization', danger: false },
    { label: 'Life-threatening', field: 'seriousnesslifethreatening', danger: true  },
    { label: 'Death',            field: 'seriousnessdeath',           danger: true  },
    { label: 'Disability',       field: 'seriousnessdisabling',       danger: false },
    { label: 'Other serious',    field: 'seriousnessother',           danger: false },
  ];

  return Promise.all(
    outcomeFields.map(async ({ label, field, danger }) => {
      const d = await apiFetch(
        BASE + '/drug/event.json?search=' + base + '+AND+' + field + ':1&limit=1'
      );
      return { label, count: d?.meta?.results?.total ?? 0, danger };
    })
  );
}

async function fetchDrugData(drug) {
  const [ndc, reactions, total, outcomes] = await Promise.all([
    fetchNDC(drug),
    fetchTopReactions(drug),
    fetchTotalEvents(drug),
    fetchOutcomeCounts(drug),
  ]);
  return { ndc, reactions, total, outcomes };
}

// ── FORMAT ───────────────────────────────────────────
function fmt(n) {
  return n != null ? Number(n).toLocaleString() : '—';
}

// ── SKELETON ─────────────────────────────────────────
function skelRow(h, w) {
  return '<div class="skel" style="height:' + h + 'px;width:' + w + ';margin-bottom:8px"></div>';
}

function skeletonColumn() {
  return [
    '<div class="drug-column">',
    '  <div class="skel" style="height:14px;width:40%;margin-bottom:12px"></div>',
    '  <div class="top-row">',
    '    <div class="card" style="animation:none">',
    skelRow(13,'55%'), skelRow(11,'80%'), skelRow(11,'70%'), skelRow(11,'60%'),
    '    </div>',
    '    <div class="card" style="animation:none">',
    skelRow(36,'40%'),
    [100,85,70,60,55,50,45,42,38,35].map(w => skelRow(9, w+'%')).join(''),
    '    </div>',
    '  </div>',
    '  <div class="card" style="animation:none">',
    skelRow(13,'30%'),
    skelRow(11,'100%'), skelRow(11,'100%'), skelRow(11,'100%'), skelRow(11,'100%'), skelRow(11,'100%'),
    '  </div>',
    '</div>',
  ].join('');
}

// ── RENDER: PROFILE CARD ─────────────────────────────
function renderProfile(ndc) {
  if (!ndc) {
    return '<div class="card">' +
      '<div class="card-header"><span class="card-title">Drug Profile</span>' +
      '<button class="help-btn" data-help="ndc">?</button></div>' +
      '<div class="err-state"><div class="err-icon">⚠</div>No NDC product data found.</div>' +
      '</div>';
  }

  const route = [ndc.dosage_form, ndc.route?.join(', ')].filter(Boolean).join(' · ');
  const ingredients = (ndc.active_ingredients || [])
    .map(i => '<span class="tag">' + (i.name || '') + '</span>').join('');
  const genericLine = (ndc.generic_name && ndc.generic_name !== ndc.brand_name)
    ? '<div class="drug-generic">' + ndc.generic_name + '</div>' : '<div class="drug-generic"></div>';

  return '<div class="card">' +
    '<div class="card-header"><span class="card-title">Drug Profile</span>' +
    '<button class="help-btn" data-help="ndc">?</button></div>' +
    '<div class="drug-name">' + (ndc.brand_name || ndc.generic_name || '—') + '</div>' +
    genericLine +
    '<div class="profile-items">' +
      '<div class="p-item"><span class="p-label">Manufacturer</span>' +
      '<span class="p-value">' + (ndc.labeler_name || '—') + '</span></div>' +
      '<div class="p-item"><span class="p-label">Form · Route</span>' +
      '<span class="p-value">' + (route || '—') + '</span></div>' +
      '<div class="p-item"><span class="p-label">Active Ingredients</span>' +
      '<div class="tags">' + (ingredients || '<span class="p-value">—</span>') + '</div></div>' +
    '</div></div>';
}

// ── RENDER: EVENTS CARD ──────────────────────────────
function renderEvents(reactions, total) {
  if (!reactions.length) {
    return '<div class="card">' +
      '<div class="card-header"><span class="card-title">Adverse Events Dashboard</span>' +
      '<button class="help-btn" data-help="events">?</button></div>' +
      '<div class="err-state"><div class="err-icon">⚠</div>No adverse event data found for this drug.</div>' +
      '</div>';
  }

  const maxCount = reactions[0]?.count || 1;
  const bars = reactions.map((r, i) => {
    const barPct  = ((r.count / maxCount) * 100).toFixed(1);
    const ofTotal = total > 0 ? ((r.count / total) * 100).toFixed(2) + '%' : '—';
    return '<div class="bar-row">' +
      '<div class="bar-label" title="' + r.term + '">' + r.term + '</div>' +
      '<div class="bar-track"><div class="bar-fill' + (i < 3 ? ' top' : '') +
      '" style="width:' + barPct + '%"></div></div>' +
      '<div class="bar-count"><div>' + fmt(r.count) + '</div><div class="bar-pct">' + ofTotal + '</div></div>' +
      '</div>';
  }).join('');

  return '<div class="card">' +
    '<div class="card-header"><span class="card-title">Adverse Events Dashboard</span>' +
    '<button class="help-btn" data-help="events">?</button></div>' +
    '<div class="stat-row"><div class="big-num">' + fmt(total) + '</div>' +
    '<div class="big-num-label">total reports in FDA database</div></div>' +
    '<div class="bar-chart">' + bars + '</div>' +
    '</div>';
}

// ── RENDER: OUTCOME TABLE ────────────────────────────
function renderOutcomes(outcomes, total) {
  const rows = outcomes.map(({ label, count, danger }) => {
    const pct = (total > 0 && count > 0) ? ((count / total) * 100).toFixed(2) + '%' : '—';
    return '<tr>' +
      '<td>' + label + '</td>' +
      '<td class="outcome-count' + (danger ? ' danger' : '') + '">' + fmt(count) + '</td>' +
      '<td class="outcome-pct">' + pct + '</td>' +
      '</tr>';
  }).join('');

  return '<div class="card">' +
    '<div class="card-header"><span class="card-title">Outcome Severity</span>' +
    '<button class="help-btn" data-help="outcomes">?</button></div>' +
    '<table class="outcome-table"><thead><tr><th>Outcome</th><th>Reports</th><th>% of Reports</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table>' +
    '</div>';
}

// ── RENDER: DRUG COLUMN ──────────────────────────────
function renderColumn(drugName, data) {
  const hasData    = data.ndc || data.reactions.length;
  const displayName = (data.ndc?.brand_name || data.ndc?.generic_name || drugName).toUpperCase();

  if (!hasData) {
    return '<div class="drug-column">' +
      '<div class="col-header">' + drugName.toUpperCase() + '</div>' +
      '<div class="card"><div class="err-state"><div class="err-icon">✕</div>' +
      'No data found for <strong>' + drugName + '</strong>.<br>' +
      'Try a different spelling or the generic name.</div></div>' +
      '</div>';
  }

  return '<div class="drug-column">' +
    '<div class="col-header">' + displayName + '</div>' +
    '<div class="top-row">' + renderProfile(data.ndc) + renderEvents(data.reactions, data.total) + '</div>' +
    renderOutcomes(data.outcomes, data.total) +
    '</div>';
}

// ── SEARCH HANDLER ───────────────────────────────────
document.getElementById('search-form').addEventListener('submit', async e => {
  e.preventDefault();

  const drug1 = document.getElementById('drug1').value.trim();
  const drug2 = document.getElementById('drug2').value.trim();
  if (!drug1) return;

  const comparison = !!drug2;
  const resultsEl  = document.getElementById('results');

  resultsEl.innerHTML =
    '<div class="results-grid ' + (comparison ? 'comparison' : 'single') + '">' +
    skeletonColumn() + (comparison ? skeletonColumn() : '') +
    '</div>';

  try {
    const fetches = [fetchDrugData(drug1)];
    if (comparison) fetches.push(fetchDrugData(drug2));

    const results = await Promise.all(fetches);
    const [data1, data2] = results;

    resultsEl.innerHTML =
      '<div class="results-grid ' + (comparison ? 'comparison' : 'single') + '">' +
      renderColumn(drug1, data1) +
      (comparison ? renderColumn(drug2, data2) : '') +
      '</div>';
  } catch (err) {
    resultsEl.innerHTML =
      '<div class="err-state" style="padding:3rem">' +
      '<div class="err-icon">✕</div>' +
      '<div>Something went wrong fetching data. Please try again.</div>' +
      '<div style="margin-top:.5rem;font-size:.72rem;color:var(--muted)">' + err.message + '</div>' +
      '</div>';
  }
});
