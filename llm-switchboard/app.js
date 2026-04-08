// ═══════════════════════════════════════════════
//  LLM Switchboard — app.js
// ═══════════════════════════════════════════════

// ── Constants ──────────────────────────────────

const MODELS = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5']
};

const SCHEMA_TEMPLATES = {
  'simple-qa': { answer: 'string', confidence: 'high | medium | low' },
  'movie-review': { title: 'string', rating: '1-10', summary: 'string', pros: ['string'], cons: ['string'] },
  'character-profile': { name: 'string', age: 'number', backstory: 'string', strengths: ['string'], flaws: ['string'] },
  'pros-cons': { topic: 'string', pros: ['string'], cons: ['string'], verdict: 'string' },
  'action-plan': { goal: 'string', steps: [{ order: 'number', action: 'string', timeframe: 'string' }], risks: ['string'] }
};

// ── In-memory key store ─────────────────────────
let keys = { openai: '', anthropic: '' };

// ── Mode state ──────────────────────────────────
let currentMode = 'unstructured'; // 'unstructured' | 'structured'

// ── DOM refs ─────────────────────────────────────

const $ = id => document.getElementById(id);

// Key management
const openaiKeyInput    = $('openai-key');
const anthropicKeyInput = $('anthropic-key');
const fileUploadInput   = $('file-upload');
const clearKeysBtn      = $('clear-keys-btn');

// Controls
const singleControls        = $('single-controls');
const providerSelect        = $('provider-select');
const modelSelect           = $('model-select');
const modelSelectGroup      = $('model-select-group');
const anthropicDisabledSingle = $('anthropic-disabled-single');
const seeMoreSingle         = $('see-more-single');
const compareToggle         = $('compare-toggle');
const compareSection        = $('compare-section');
const compareProvider1      = $('compare-provider-1');
const compareProvider2      = $('compare-provider-2');
const compareModel1         = $('compare-model-1');
const compareModel2         = $('compare-model-2');
const modelSelectGroup1     = $('model-select-group-1');
const modelSelectGroup2     = $('model-select-group-2');
const anthropicDisabled1    = $('anthropic-disabled-1');
const anthropicDisabled2    = $('anthropic-disabled-2');
const seeMore1              = $('see-more-1');
const seeMore2              = $('see-more-2');

// Modals
const corsModal             = $('cors-modal');
const corsModalClose        = $('cors-modal-close');
const modelsModal           = $('models-modal');
const modelsModalClose      = $('models-modal-close');
const modelsModalTitle      = $('models-modal-title');
const modelsModalBody       = $('models-modal-body');

// Mode buttons
const btnUnstructured = $('btn-unstructured');
const btnStructured   = $('btn-structured');

// Prompt
const promptExamples = $('prompt-examples');
const promptInput    = $('prompt-input');

// Schema
const schemaSection      = $('schema-section');
const schemaTemplates    = $('schema-templates');
const schemaInput        = $('schema-input');
const validateSchemaBtn  = $('validate-schema-btn');

// Actions
const sendBtn = $('send-btn');

// Single-mode output
const singleOutputSection = $('single-output-section');
const outputPanel         = $('output-panel');
const metricsPanel        = $('metrics-panel');
const errorPanel          = $('error-panel');

// Compare-mode output
const compareOutputSection = $('compare-output-section');
const colHeader1  = $('col-header-1');
const colHeader2  = $('col-header-2');
const output1     = $('output-1');
const output2     = $('output-2');
const metrics1    = $('metrics-1');
const metrics2    = $('metrics-2');
const error1      = $('error-1');
const error2      = $('error-2');

// ── Utility helpers ─────────────────────────────

function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

function showError(el, msg) {
  el.classList.add('visible');
  el.classList.remove('hidden');
  el.textContent = msg;
}

function clearError(el) {
  el.classList.remove('visible');
  el.classList.add('hidden');
  el.textContent = '';
}

function setMetrics(el, timeMs, usage, charCount) {
  let tokenStr = 'N/A';
  if (usage) {
    // OpenAI: prompt_tokens + completion_tokens
    // Anthropic: input_tokens + output_tokens
    const total =
      (usage.total_tokens) ||
      ((usage.prompt_tokens || 0) + (usage.completion_tokens || 0)) ||
      ((usage.input_tokens || 0) + (usage.output_tokens || 0));
    if (total) tokenStr = total + ' tokens';
  }
  el.textContent = `⏱ ${timeMs}ms  🔢 ${tokenStr}  📏 ${charCount} chars`;
}

function populateModelSelect(selectEl, provider) {
  selectEl.innerHTML = '<option value="">— select model —</option>';
  if (provider && MODELS[provider]) {
    MODELS[provider].forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      selectEl.appendChild(opt);
    });
  }
}

function renderCodeBlocks(text) {
  // Replace triple-backtick code blocks with <pre><code> elements
  return text.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
    const langClass = lang ? ` class="language-${lang}"` : '';
    return `<pre><code${langClass}>${escapeHtml(code.trim())}</code></pre>`;
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderResponse(panelEl, metricsEl, errorEl, responseText, timeMs, usage, isStructured) {
  if (isStructured) {
    try {
      const parsed = JSON.parse(responseText);
      const formatted = JSON.stringify(parsed, null, 2);
      panelEl.innerHTML = `<pre><code class="language-json">${escapeHtml(formatted)}</code></pre>`;
      if (typeof hljs !== 'undefined') hljs.highlightAll();
    } catch (e) {
      panelEl.innerHTML = `<pre>${escapeHtml(responseText)}</pre>`;
      showError(errorEl, 'Response wasn\'t valid JSON. Raw output shown above.');
    }
  } else {
    const rendered = renderCodeBlocks(responseText);
    // Wrap plain text (outside code blocks) safely
    // Split on <pre>...</pre> to avoid double-escaping code blocks we just created
    const parts = rendered.split(/(<pre>[\s\S]*?<\/pre>)/);
    panelEl.innerHTML = parts.map((part, i) => {
      if (part.startsWith('<pre>')) return part;
      // Convert newlines to <br> for plain text segments
      return part.replace(/\n/g, '<br>');
    }).join('');
    if (typeof hljs !== 'undefined') hljs.highlightAll();
  }
  setMetrics(metricsEl, timeMs, usage, responseText.length);
}

function clearOutputPanels() {
  outputPanel.innerHTML = '<span class="output-placeholder">Response will appear here...</span>';
  metricsPanel.textContent = '';
  clearError(errorPanel);

  output1.innerHTML = '<span class="output-placeholder">Response A will appear here...</span>';
  output2.innerHTML = '<span class="output-placeholder">Response B will appear here...</span>';
  metrics1.textContent = '';
  metrics2.textContent = '';
  clearError(error1);
  clearError(error2);
}

// ── API call logic ──────────────────────────────

async function callOpenAI(key, model, prompt, isStructured, schemaJson) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const messages = [];
  if (isStructured && schemaJson) {
    messages.push({ role: 'system', content: 'Respond ONLY with valid JSON matching this schema: ' + schemaJson });
  }
  messages.push({ role: 'user', content: prompt });

  let response;
  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify({ model, messages, max_tokens: 1024 }),
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('Request timed out. The model may be busy — try again.');
    throw new Error('Network error. Check your connection.');
  }

  clearTimeout(timeoutId);

  if (response.status === 401 || response.status === 403) {
    throw new Error('API key missing or invalid. Check your key and try again.');
  }
  if (response.status === 429) {
    throw new Error('Rate limit or quota exceeded. Wait a moment and try again — or check that your API key has active billing/credits.');
  }
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content;
  return { text, usage: data.usage };
}

async function callAnthropic(key, model, prompt, isStructured, schemaJson) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const body = {
    model,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  };
  if (isStructured && schemaJson) {
    body.system = 'Respond ONLY with valid JSON matching this schema: ' + schemaJson;
  }

  let response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('Request timed out. The model may be busy — try again.');
    throw new Error('Network error. Check your connection.');
  }

  clearTimeout(timeoutId);

  if (response.status === 401 || response.status === 403) {
    throw new Error('API key missing or invalid. Check your key and try again.');
  }
  if (response.status === 429) {
    throw new Error('Rate limit or quota exceeded. Wait a moment and try again — or check that your API key has active billing/credits.');
  }
  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.content[0].text;
  return { text, usage: data.usage };
}

async function callProvider(provider, model, prompt, isStructured, schemaJson) {
  if (provider === 'anthropic') throw new Error('Anthropic is disabled in this browser-based app.');
  const key = keys[provider];
  if (!key) throw new Error('API key missing or invalid. Check your key and try again.');

  if (provider === 'openai') return callOpenAI(key, model, prompt, isStructured, schemaJson);
  throw new Error('Unknown provider: ' + provider);
}

// ── Send logic ──────────────────────────────────

function setSending(isSending) {
  if (isSending) {
    sendBtn.classList.add('loading');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
  } else {
    sendBtn.classList.remove('loading');
    sendBtn.disabled = false;
    sendBtn.textContent = '▶ Send';
  }
}

async function handleSend() {
  // Sync keys from inputs
  keys.openai    = openaiKeyInput.value.trim();
  keys.anthropic = anthropicKeyInput.value.trim();

  const prompt = promptInput.value.trim();
  if (!prompt) {
    alert('Please enter a prompt before sending.');
    return;
  }

  const isStructured = currentMode === 'structured';
  const schemaJson   = isStructured ? schemaInput.value.trim() : null;

  clearOutputPanels();
  setSending(true);

  const isCompare = compareToggle.checked;

  if (!isCompare) {
    // ── Single mode ──
    const provider = providerSelect.value;
    const model    = modelSelect.value;

    if (!provider) { alert('Please select a provider.'); setSending(false); return; }
    if (!model)    { alert('Please select a model.');    setSending(false); return; }

    const start = Date.now();
    try {
      const { text, usage } = await callProvider(provider, model, prompt, isStructured, schemaJson);
      const elapsed = Date.now() - start;
      renderResponse(outputPanel, metricsPanel, errorPanel, text, elapsed, usage, isStructured);
    } catch (err) {
      showError(errorPanel, err.message);
    }
  } else {
    // ── Compare mode ──
    const provider1 = compareProvider1.value;
    const model1    = compareModel1.value;
    const provider2 = compareProvider2.value;
    const model2    = compareModel2.value;

    if (!provider1 || !model1) { alert('Please select a provider and model for Model A.'); setSending(false); return; }
    if (!provider2 || !model2) { alert('Please select a provider and model for Model B.'); setSending(false); return; }

    colHeader1.textContent = model1;
    colHeader2.textContent = model2;

    const start1 = Date.now();
    const start2 = Date.now();

    const [result1, result2] = await Promise.allSettled([
      callProvider(provider1, model1, prompt, isStructured, schemaJson),
      callProvider(provider2, model2, prompt, isStructured, schemaJson)
    ]);

    const elapsed1 = Date.now() - start1;
    const elapsed2 = Date.now() - start2;

    if (result1.status === 'fulfilled') {
      const { text, usage } = result1.value;
      renderResponse(output1, metrics1, error1, text, elapsed1, usage, isStructured);
    } else {
      showError(error1, result1.reason.message);
    }

    if (result2.status === 'fulfilled') {
      const { text, usage } = result2.value;
      renderResponse(output2, metrics2, error2, text, elapsed2, usage, isStructured);
    } else {
      showError(error2, result2.reason.message);
    }
  }

  setSending(false);
}

// ── File upload parsing ─────────────────────────

function parseEnvFile(content) {
  const lines = content.split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;

    const varName = trimmed.slice(0, eqIdx).trim();
    const value   = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');

    if (varName === 'OPENAI_API_KEY') {
      keys.openai = value;
      openaiKeyInput.value = value;
    } else if (varName === 'ANTHROPIC_API_KEY') {
      keys.anthropic = value;
      anthropicKeyInput.value = value;
    }
  });
}

function parseCsvFile(content) {
  const lines = content.split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const parts = trimmed.split(',');
    if (parts.length < 2) return;
    const provider = parts[0].trim().toLowerCase();
    const key      = parts.slice(1).join(',').trim().replace(/^["']|["']$/g, '');

    if (provider === 'openai' && key) {
      keys.openai = key;
      openaiKeyInput.value = key;
    } else if (provider === 'anthropic' && key) {
      keys.anthropic = key;
      anthropicKeyInput.value = key;
    }
  });
}

function handleFileUpload(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const content = e.target.result;
    const name = file.name.toLowerCase();
    if (name.endsWith('.csv')) {
      parseCsvFile(content);
    } else {
      // .env or plain text
      parseEnvFile(content);
    }
  };
  reader.readAsText(file);
}

// ── Modal helpers ────────────────────────────────

function openCorsModal() { show(corsModal); }
function closeCorsModal() { hide(corsModal); }
function closeModelsModal() { hide(modelsModal); }

const EXTENDED_MODELS = {
  openai: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
    'o1',
    'o1-mini',
    'o1-preview',
    'o3',
    'o3-mini',
    'o4-mini'
  ]
};

function openModelsModal(provider, targetSelectEl) {
  modelsModalTitle.textContent = provider.toUpperCase() + ' — All Models';
  show(modelsModal);

  const ids = EXTENDED_MODELS[provider] || [];
  modelsModalBody.innerHTML = ids.map(id =>
    `<div class="model-list-item" data-model="${escapeHtml(id)}">${escapeHtml(id)}</div>`
  ).join('');
  modelsModalBody.querySelectorAll('.model-list-item').forEach(item => {
    item.addEventListener('click', () => {
      const chosen = item.dataset.model;
      if (![...targetSelectEl.options].some(o => o.value === chosen)) {
        const opt = document.createElement('option');
        opt.value = chosen;
        opt.textContent = chosen;
        targetSelectEl.appendChild(opt);
      }
      targetSelectEl.value = chosen;
      closeModelsModal();
    });
  });
}

// ── UI wiring ───────────────────────────────────

function updateProviderUI(provider, modelSelectEl, modelGroupEl, disabledBannerEl, seeMoreBtn) {
  if (provider === 'anthropic') {
    hide(modelGroupEl);
    show(disabledBannerEl);
    modelSelectEl.innerHTML = '<option value="">— select model —</option>';
  } else {
    show(modelGroupEl);
    hide(disabledBannerEl);
    populateModelSelect(modelSelectEl, provider);
    if (seeMoreBtn) {
      if (provider) show(seeMoreBtn);
      else hide(seeMoreBtn);
    }
  }
}

function setMode(mode) {
  currentMode = mode;
  if (mode === 'unstructured') {
    btnUnstructured.classList.add('active');
    btnStructured.classList.remove('active');
    hide(schemaSection);
  } else {
    btnStructured.classList.add('active');
    btnUnstructured.classList.remove('active');
    show(schemaSection);
  }
  clearOutputPanels();
}

function wireEvents() {

  // Key inputs — sync to in-memory store on change
  openaiKeyInput.addEventListener('input', () => { keys.openai = openaiKeyInput.value.trim(); });
  anthropicKeyInput.addEventListener('input', () => { keys.anthropic = anthropicKeyInput.value.trim(); });

  // Clear keys
  clearKeysBtn.addEventListener('click', () => {
    keys = { openai: '', anthropic: '' };
    openaiKeyInput.value  = '';
    anthropicKeyInput.value = '';
    fileUploadInput.value = '';
  });

  // File upload
  fileUploadInput.addEventListener('change', () => {
    const file = fileUploadInput.files[0];
    handleFileUpload(file);
  });

  // Compare toggle
  compareToggle.addEventListener('change', () => {
    if (compareToggle.checked) {
      hide(singleControls);
      hide(singleOutputSection);
      show(compareSection);
      show(compareOutputSection);
    } else {
      show(singleControls);
      show(singleOutputSection);
      hide(compareSection);
      hide(compareOutputSection);
    }
  });

  // Provider selects
  providerSelect.addEventListener('change', () => {
    updateProviderUI(providerSelect.value, modelSelect, modelSelectGroup, anthropicDisabledSingle, seeMoreSingle);
  });

  compareProvider1.addEventListener('change', () => {
    updateProviderUI(compareProvider1.value, compareModel1, modelSelectGroup1, anthropicDisabled1, seeMore1);
  });

  compareProvider2.addEventListener('change', () => {
    updateProviderUI(compareProvider2.value, compareModel2, modelSelectGroup2, anthropicDisabled2, seeMore2);
  });

  // "Find out why" buttons
  $('why-btn-single').addEventListener('click', openCorsModal);
  $('why-btn-1').addEventListener('click', openCorsModal);
  $('why-btn-2').addEventListener('click', openCorsModal);

  // "See more models" buttons
  seeMoreSingle.addEventListener('click', () => openModelsModal(providerSelect.value, modelSelect));
  seeMore1.addEventListener('click', () => openModelsModal(compareProvider1.value, compareModel1));
  seeMore2.addEventListener('click', () => openModelsModal(compareProvider2.value, compareModel2));

  // Modal close buttons
  corsModalClose.addEventListener('click', closeCorsModal);
  modelsModalClose.addEventListener('click', closeModelsModal);

  // Close modals on overlay click
  corsModal.addEventListener('click', e => { if (e.target === corsModal) closeCorsModal(); });
  modelsModal.addEventListener('click', e => { if (e.target === modelsModal) closeModelsModal(); });

  // Mode buttons
  btnUnstructured.addEventListener('click', () => setMode('unstructured'));
  btnStructured.addEventListener('click',   () => setMode('structured'));

  // Example prompts
  promptExamples.addEventListener('change', () => {
    if (promptExamples.value) {
      promptInput.value = promptExamples.value;
    }
  });

  // Schema templates
  schemaTemplates.addEventListener('change', () => {
    const val = schemaTemplates.value;
    if (val && SCHEMA_TEMPLATES[val]) {
      schemaInput.value = JSON.stringify(SCHEMA_TEMPLATES[val], null, 2);
    }
  });

  // Validate schema
  validateSchemaBtn.addEventListener('click', () => {
    try {
      JSON.parse(schemaInput.value);
      alert('Valid JSON!');
    } catch (e) {
      alert('Invalid JSON: ' + e.message);
    }
  });

  // Send
  sendBtn.addEventListener('click', handleSend);
}

// ── Init ────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Default mode: unstructured
  setMode('unstructured');

  // Ensure compare mode UI is correct at start
  hide(compareSection);
  hide(compareOutputSection);
  show(singleControls);
  show(singleOutputSection);

  // Populate model selects if a provider is already selected (e.g. from browser autofill)
  if (providerSelect.value) {
    updateProviderUI(providerSelect.value, modelSelect, modelSelectGroup, anthropicDisabledSingle, seeMoreSingle);
  }
  if (compareProvider1.value) {
    updateProviderUI(compareProvider1.value, compareModel1, modelSelectGroup1, anthropicDisabled1, seeMore1);
  }
  if (compareProvider2.value) {
    updateProviderUI(compareProvider2.value, compareModel2, modelSelectGroup2, anthropicDisabled2, seeMore2);
  }

  wireEvents();
});
