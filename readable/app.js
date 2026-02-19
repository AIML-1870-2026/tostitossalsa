// ─────────────────────────────────────────────────────────────────
//  Readable — Color Contrast Explorer
//  app.js
// ─────────────────────────────────────────────────────────────────

// ── Mutable state (objects kept by reference so slider callbacks stay valid)
const state = {
  bg:     { r: 255, g: 255, b: 255 },
  text:   { r: 0,   g: 0,   b: 0   },
  size:   18,
  vision: 'normal',
};


// ── WCAG luminance + contrast ratio ──────────────────────────────

function linearize(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r, g, b) {
  return 0.2126 * linearize(r)
       + 0.7152 * linearize(g)
       + 0.0722 * linearize(b);
}

function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}


// ── Helpers ───────────────────────────────────────────────────────

function toHex(r, g, b) {
  return '#' + [r, g, b]
    .map(v => Math.round(v).toString(16).padStart(2, '0').toUpperCase())
    .join('');
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function setControl(prefix, val) {
  document.getElementById(`${prefix}-slider`).value = val;
  document.getElementById(`${prefix}-num`).value    = val;
}


// ── Update functions ──────────────────────────────────────────────

function updateDisplay() {
  const { bg, text, size, vision } = state;
  const display = document.getElementById('text-display');

  display.style.backgroundColor = `rgb(${bg.r}, ${bg.g}, ${bg.b})`;
  display.style.color            = `rgb(${text.r}, ${text.g}, ${text.b})`;
  display.style.fontSize         = `${size}px`;

  // Apply or remove vision-simulation filter class
  display.className = vision === 'normal' ? '' : `vision-${vision}`;
}

function updateMetrics() {
  const { bg, text } = state;

  const bgLum   = relativeLuminance(bg.r,   bg.g,   bg.b);
  const textLum = relativeLuminance(text.r, text.g, text.b);
  const ratio   = contrastRatio(bgLum, textLum);

  // Contrast ratio number
  const ratioEl = document.getElementById('contrast-ratio');
  ratioEl.textContent = `${ratio.toFixed(2)}:1`;

  // Colour-code the big ratio
  ratioEl.className = 'big-ratio ' + (
    ratio >= 4.5 ? 'ratio-pass-aa' :
    ratio >= 3.0 ? 'ratio-pass-la' :
                   'ratio-fail'
  );

  // WCAG badges
  updateBadge('badge-normal-aa', ratio, 4.5);
  updateBadge('badge-large-aa',  ratio, 3.0);

  // Luminance values
  document.getElementById('bg-luminance').textContent   = bgLum.toFixed(4);
  document.getElementById('text-luminance').textContent = textLum.toFixed(4);

  // Luminance dots (show the actual colour)
  document.getElementById('bg-lum-dot').style.backgroundColor =
    `rgb(${bg.r}, ${bg.g}, ${bg.b})`;
  document.getElementById('text-lum-dot').style.backgroundColor =
    `rgb(${text.r}, ${text.g}, ${text.b})`;

  // Colour swatches + hex labels
  document.getElementById('bg-swatch').style.backgroundColor =
    `rgb(${bg.r}, ${bg.g}, ${bg.b})`;
  document.getElementById('text-swatch').style.backgroundColor =
    `rgb(${text.r}, ${text.g}, ${text.b})`;

  document.getElementById('bg-hex').textContent   = toHex(bg.r,   bg.g,   bg.b);
  document.getElementById('text-hex').textContent = toHex(text.r, text.g, text.b);
}

function updateBadge(id, ratio, threshold) {
  const badge  = document.getElementById(id);
  const result = badge.querySelector('.badge-result');
  const pass   = ratio >= threshold;

  badge.className        = `badge ${pass ? 'pass' : 'fail'}`;
  result.textContent     = pass ? 'PASS ✓' : 'FAIL ✗';
}


// ── Slider ↔ number-input synchronisation ────────────────────────

/**
 * Link a range slider and a number input.
 * Both write into stateObj[channel] and trigger re-render.
 *
 * stateObj is passed by reference, so preset changes that mutate
 * properties in-place are automatically reflected here.
 */
function syncPair(sliderId, numId, stateObj, channel) {
  const slider = document.getElementById(sliderId);
  const num    = document.getElementById(numId);

  slider.addEventListener('input', () => {
    const val = parseInt(slider.value, 10);
    stateObj[channel] = val;
    num.value = val;
    updateDisplay();
    updateMetrics();
  });

  num.addEventListener('input', () => {
    let val = parseInt(num.value, 10);
    if (isNaN(val)) return;
    val = clamp(val, 0, 255);
    stateObj[channel] = val;
    slider.value = val;
    updateDisplay();
    updateMetrics();
  });
}


// ── Vision simulation ─────────────────────────────────────────────

function applyVision(visionType) {
  state.vision = visionType;
  updateDisplay();

  const isSimulating = visionType !== 'normal';

  // Disable / enable the colour-control cards
  ['bg-color-section', 'text-color-section'].forEach(id => {
    const section = document.getElementById(id);
    section.querySelectorAll('input').forEach(input => {
      input.disabled = isSimulating;
    });
    section.classList.toggle('section-disabled', isSimulating);
  });

  // Show / hide the advisory note
  const note = document.getElementById('vision-note');
  note.hidden = !isSimulating;
}


// ── Preset loading ────────────────────────────────────────────────

function loadPreset(bgStr, textStr) {
  const [bgR, bgG, bgB] = bgStr.split(',').map(Number);
  const [tR,  tG,  tB]  = textStr.split(',').map(Number);

  // Mutate in-place so syncPair callbacks still reference the same objects
  state.bg.r = bgR;  state.bg.g = bgG;  state.bg.b = bgB;
  state.text.r = tR; state.text.g = tG; state.text.b = tB;

  setControl('bg-r',   bgR);
  setControl('bg-g',   bgG);
  setControl('bg-b',   bgB);
  setControl('text-r', tR);
  setControl('text-g', tG);
  setControl('text-b', tB);

  updateDisplay();
  updateMetrics();
}


// ── Initialisation ────────────────────────────────────────────────

function init() {

  // Wire up all six RGB channel pairs
  syncPair('bg-r-slider',   'bg-r-num',   state.bg,   'r');
  syncPair('bg-g-slider',   'bg-g-num',   state.bg,   'g');
  syncPair('bg-b-slider',   'bg-b-num',   state.bg,   'b');
  syncPair('text-r-slider', 'text-r-num', state.text, 'r');
  syncPair('text-g-slider', 'text-g-num', state.text, 'g');
  syncPair('text-b-slider', 'text-b-num', state.text, 'b');

  // Text size slider ↔ number
  const sizeSlider = document.getElementById('size-slider');
  const sizeNum    = document.getElementById('size-num');

  sizeSlider.addEventListener('input', () => {
    const val = parseInt(sizeSlider.value, 10);
    state.size = val;
    sizeNum.value = val;
    updateDisplay();
  });

  sizeNum.addEventListener('input', () => {
    let val = parseInt(sizeNum.value, 10);
    if (isNaN(val)) return;
    val = clamp(val, 10, 72);
    state.size = val;
    sizeSlider.value = val;
    updateDisplay();
  });

  // Vision simulation radios
  document.querySelectorAll('input[name="vision"]').forEach(radio => {
    radio.addEventListener('change', () => applyVision(radio.value));
  });

  // Preset buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => loadPreset(btn.dataset.bg, btn.dataset.text));
  });

  // Initial render
  updateDisplay();
  updateMetrics();
}

document.addEventListener('DOMContentLoaded', init);
