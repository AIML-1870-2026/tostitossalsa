// ═══════════════════════════════════════════════
//  ReviewForge — app.js
// ═══════════════════════════════════════════════

// ── In-memory API key ──────────────────────────
let apiKey = null;

// ── DOM refs ───────────────────────────────────
const $ = id => document.getElementById(id);

const envInput      = $('env-input');
const loadKeyBtn    = $('load-key-btn');
const keyStatus     = $('key-status');
const apiKeyToggle  = $('api-key-toggle');
const apiKeyBody    = $('api-key-body');
const apiChevron    = $('api-chevron');

const productName   = $('product-name');
const productDesc   = $('product-desc');
const modelSelect   = $('model-select');
const toneSelect    = $('tone-select');
const lengthSelect  = $('length-select');

const sliderPrice       = $('slider-price');
const sliderFeatures    = $('slider-features');
const sliderUsability   = $('slider-usability');
const sentimentSummary  = $('sentiment-summary');

const generateBtn   = $('generate-btn');
const outputPanel   = $('output-panel');
const outputFooter  = $('output-footer');
const outputMeta    = $('output-meta');
const copyBtn       = $('copy-btn');

// ── Collapsible API Key Panel ──────────────────
let apiPanelOpen = true;

apiKeyToggle.addEventListener('click', () => {
  apiPanelOpen = !apiPanelOpen;
  if (apiPanelOpen) {
    apiKeyBody.classList.remove('collapsed');
    apiChevron.classList.remove('open');
  } else {
    apiKeyBody.classList.add('collapsed');
    apiChevron.classList.add('open');
  }
});

// ── API Key Parsing ────────────────────────────
function loadEnvKey(rawText) {
  const lines = rawText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const varName = trimmed.slice(0, eqIdx).trim();
    const value   = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (varName === 'OPENAI_API_KEY' && value) {
      apiKey = value;
      keyStatus.textContent = '🟢 Key loaded';
      keyStatus.classList.remove('no-key');
      keyStatus.classList.add('has-key');
      // Collapse panel after successful load
      apiPanelOpen = false;
      apiKeyBody.classList.add('collapsed');
      apiChevron.classList.add('open');
      return;
    }
  }
  keyStatus.textContent = '🔴 Key not found in .env';
  keyStatus.classList.add('no-key');
  keyStatus.classList.remove('has-key');
}

loadKeyBtn.addEventListener('click', () => {
  loadEnvKey(envInput.value);
});

// ── Slider Logic ───────────────────────────────
function getSliderLabel(value) {
  const v = parseInt(value);
  if (v <= 3)      return 'Poor';
  if (v <= 5)      return 'Below Average';
  if (v <= 7)      return 'Good';
  if (v <= 9)      return 'Great';
  return 'Excellent';
}

function getSliderColor(value) {
  const v = parseInt(value);
  if (v <= 3) return '#ff4d4d';
  if (v <= 6) return '#ffd166';
  return '#06d6a0';
}

function updateSliderUI(sliderId, value) {
  const v = parseInt(value);
  const color = getSliderColor(v);
  const label = getSliderLabel(v);
  const pct = ((v - 1) / 9) * 100;

  const wrapper = $(`slider-${sliderId}-wrapper`);
  wrapper.style.setProperty('--slider-color', color);
  wrapper.style.setProperty('--slider-pct', pct.toFixed(1));

  $(`${sliderId}-value`).textContent = v;
  $(`${sliderId}-label`).textContent  = label;

  updateSentimentSummary();
}

function updateSentimentSummary() {
  const price     = parseInt(sliderPrice.value);
  const features  = parseInt(sliderFeatures.value);
  const usability = parseInt(sliderUsability.value);
  const avg = (price + features + usability) / 3;

  const label = v => v <= 3 ? 'poor' : v <= 5 ? 'below average' : v <= 7 ? 'decent' : 'great';

  let summary;
  if (avg >= 8.5) {
    summary = 'Highly positive across the board — a strong recommendation.';
  } else if (avg <= 2.5) {
    summary = 'Strongly negative — poor value, poor features, and frustrating to use.';
  } else {
    const parts = [];
    if (price >= 7)     parts.push('great price');
    else if (price <= 3) parts.push('overpriced');
    if (features >= 7)   parts.push('impressive features');
    else if (features <= 3) parts.push('lacking features');
    if (usability >= 7)  parts.push('easy to use');
    else if (usability <= 3) parts.push('frustrating to use');

    if (parts.length === 0) {
      summary = `Balanced — ${label(price)} price, ${label(features)} features, ${label(usability)} usability.`;
    } else if (parts.length === 3) {
      summary = `Mixed feelings: ${parts[0]}, ${parts[1]}, but ${parts[2]}.`;
    } else {
      summary = `Mixed — ${parts.join(', ')}.`;
    }
  }

  sentimentSummary.textContent = summary;
}

// ── Prompt Construction ────────────────────────
function buildPrompt(name, desc, priceScore, featuresScore, usabilityScore, tone, length) {
  const wordCount = length === 'short' ? '100' : length === 'medium' ? '250' : '500';

  const system = `You are a professional product reviewer. Write reviews in a ${tone} tone. ` +
    `The review should be approximately ${wordCount} words. ` +
    `Format your response in markdown: use a bold title, a star rating line, ` +
    `a short intro paragraph, a ## Pros section, a ## Cons section, and a closing Verdict paragraph.`;

  const user = `Write a product review for: ${name}\nDescription: ${desc}\n\n` +
    `Sentiment scores (1=worst, 10=best):\n` +
    `- Price/Value: ${priceScore}/10\n` +
    `- Features: ${featuresScore}/10\n` +
    `- Usability: ${usabilityScore}/10\n\n` +
    `Make sure the review tone and content accurately reflect these scores. ` +
    `A score of 1-3 means that aspect is genuinely bad and should be criticized. ` +
    `A score of 8-10 means that aspect is excellent and should be praised.`;

  return { system, user };
}

// ── Generate Review ────────────────────────────
async function generateReview() {
  if (!apiKey) {
    alert('Please load your OpenAI API key first.');
    return;
  }
  if (!productName.value.trim()) {
    alert('Please enter a product name.');
    productName.focus();
    return;
  }

  const model     = modelSelect.value;
  const tone      = toneSelect.value;
  const length    = lengthSelect.value;
  const maxTokens = length === 'short' ? 300 : length === 'medium' ? 600 : 1000;

  const { system, user } = buildPrompt(
    productName.value.trim(),
    productDesc.value.trim(),
    sliderPrice.value,
    sliderFeatures.value,
    sliderUsability.value,
    tone,
    length
  );

  // Show loading state
  generateBtn.classList.add('loading');
  generateBtn.textContent = 'Generating...';
  outputPanel.classList.remove('review-loaded');
  outputFooter.classList.add('hidden');
  outputPanel.innerHTML = `
    <div class="spinner-wrap">
      <div class="spinner"></div>
      <span>Crafting your review...</span>
    </div>`;

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user',   content: user   }
        ],
        max_tokens: maxTokens,
        temperature: 0.8
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 401 || response.status === 403) {
      throw new Error('API key missing or invalid. Check your key and try again.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit or quota exceeded. Wait a moment and try again.');
    }
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data    = await response.json();
    const content = data.choices[0].message.content;
    const usage   = data.usage;

    // Render markdown as HTML
    outputPanel.innerHTML = marked.parse(content);
    outputPanel.classList.add('review-loaded');

    // Footer meta
    const tokenStr = usage
      ? `${usage.prompt_tokens + usage.completion_tokens} tokens`
      : 'N/A';
    outputMeta.textContent = `Model: ${model}  ·  Tokens: ${tokenStr}`;
    outputFooter.classList.remove('hidden');

  } catch (err) {
    clearTimeout(timeoutId);
    const msg = err.name === 'AbortError'
      ? 'Request timed out. The model may be busy — try again.'
      : err.message;
    outputPanel.innerHTML = `<span class="output-placeholder" style="color: #ff4d4d;">⚠ ${msg}</span>`;
    console.error('[ReviewForge] API error:', err);
  } finally {
    generateBtn.classList.remove('loading');
    generateBtn.textContent = 'Generate Review ✦';
  }
}

// ── Copy to Clipboard ──────────────────────────
function copyReview() {
  const text = outputPanel.innerText;
  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = 'Copied ✓';
    setTimeout(() => { copyBtn.textContent = 'Copy to Clipboard'; }, 2000);
  });
}

// ── Init ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all sliders
  updateSliderUI('price',     sliderPrice.value);
  updateSliderUI('features',  sliderFeatures.value);
  updateSliderUI('usability', sliderUsability.value);

  // Slider event listeners
  sliderPrice.addEventListener('input',     () => updateSliderUI('price',     sliderPrice.value));
  sliderFeatures.addEventListener('input',  () => updateSliderUI('features',  sliderFeatures.value));
  sliderUsability.addEventListener('input', () => updateSliderUI('usability', sliderUsability.value));

  // Generate button
  generateBtn.addEventListener('click', generateReview);

  // Copy button
  copyBtn.addEventListener('click', copyReview);
});
