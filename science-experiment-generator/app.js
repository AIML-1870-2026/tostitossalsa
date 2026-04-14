// ═══════════════════════════════════════════════
//  Science Experiment Generator — app.js
// ═══════════════════════════════════════════════

// ── In-memory key store ─────────────────────────
let apiKey = '';

// ── DOM refs ─────────────────────────────────────
const $ = id => document.getElementById(id);

const apiKeyInput         = $('api-key');
const modelSelect         = $('model-select');
const gradeSelect         = $('grade-select');
const suppliesInput       = $('supplies-input');
const generateBtn         = $('generate-btn');
const outputPanel         = $('output-panel');
const errorPanel          = $('error-panel');
const loadingIndicator    = $('loading-indicator');
const difficultyContainer = $('difficulty-badge-container');
const historyList         = $('history-list');
const clearHistoryBtn     = $('clear-history-btn');

// ── Constants ──────────────────────────────────
const STORAGE_KEY = 'science-experiment-history';

const SYSTEM_PROMPT =
  'You are a helpful science teacher assistant. When given a grade level and a list of available supplies, ' +
  'suggest a creative, safe, and grade-appropriate science experiment. Format your response with:\n' +
  '- A title\n' +
  '- A difficulty rating (Easy / Medium / Hard)\n' +
  '- A list of required materials (noting any substitutions if the user is missing common items)\n' +
  '- Step-by-step instructions\n' +
  '- The scientific concept being demonstrated\n' +
  'Use clear markdown formatting.';

// ── Utility helpers ─────────────────────────────
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

function showError(msg) {
  errorPanel.textContent = msg;
  show(errorPanel);
}

function clearError() {
  errorPanel.textContent = '';
  hide(errorPanel);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseDifficulty(text) {
  const match = text.match(/\b(Easy|Medium|Hard)\b/i);
  return match ? match[1] : null;
}

function renderDifficultyBadge(difficulty) {
  if (!difficulty) {
    hide(difficultyContainer);
    return;
  }
  const cls = difficulty.toLowerCase();
  difficultyContainer.innerHTML =
    `<span class="difficulty-badge difficulty-${cls}">${escapeHtml(difficulty)}</span>`;
  show(difficultyContainer);
}

function setGenerating(isGenerating) {
  if (isGenerating) {
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    generateBtn.classList.add('loading');
    show(loadingIndicator);
  } else {
    generateBtn.disabled = false;
    generateBtn.textContent = '🔬 Generate Experiment';
    generateBtn.classList.remove('loading');
    hide(loadingIndicator);
  }
}

// ── API call ─────────────────────────────────────
async function callOpenAI(key, model, gradeLevel, supplies) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const userPrompt =
    `Grade level: ${gradeLevel}\nAvailable supplies: ${supplies}\n\n` +
    'Please suggest a science experiment I can do with these materials.';

  let response;
  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: userPrompt }
        ],
        max_tokens: 1500
      }),
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The model may be busy — try again.');
    }
    throw new Error('Network error. Check your connection.');
  }

  clearTimeout(timeoutId);

  if (response.status === 401 || response.status === 403) {
    throw new Error('API key missing or invalid. Check your key and try again.');
  }
  if (response.status === 429) {
    throw new Error(
      'Rate limit or quota exceeded. Wait a moment and try again — ' +
      'or check that your API key has active billing/credits.'
    );
  }
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ── localStorage helpers ─────────────────────────
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function addToHistory(gradeLevel, supplies, markdown) {
  const history = loadHistory();
  history.unshift({
    timestamp: new Date().toISOString(),
    gradeLevel,
    supplies,
    markdown
  });
  saveHistory(history);
  renderHistory();
}

// ── History rendering ────────────────────────────
function renderHistory() {
  const history = loadHistory();

  if (history.length === 0) {
    historyList.innerHTML =
      '<p class="output-placeholder">No saved experiments yet.</p>';
    return;
  }

  historyList.innerHTML = history.map((entry, i) => {
    const date = new Date(entry.timestamp).toLocaleString();
    const titleMatch = entry.markdown.match(/^#+\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'Experiment';

    return `
      <div class="history-item">
        <button class="history-toggle" aria-expanded="false" data-index="${i}">
          <span class="history-title">${escapeHtml(title)}</span>
          <span class="history-meta">Grade ${escapeHtml(entry.gradeLevel)} &middot; ${escapeHtml(date)}</span>
          <span class="history-chevron">&#9660;</span>
        </button>
        <div class="history-content hidden" id="history-content-${i}">
          <p class="history-supplies">
            <strong>Supplies:</strong> ${escapeHtml(entry.supplies)}
          </p>
          <div class="history-markdown">${marked.parse(entry.markdown)}</div>
        </div>
      </div>
    `;
  }).join('');

  historyList.querySelectorAll('.history-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = btn.dataset.index;
      const content = $(`history-content-${idx}`);
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      btn.classList.toggle('open', !expanded);
      content.classList.toggle('hidden', expanded);
    });
  });
}

// ── Generate handler ─────────────────────────────
async function handleGenerate() {
  apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    showError('Please enter your OpenAI API key.');
    return;
  }

  const supplies = suppliesInput.value.trim();
  if (!supplies) {
    showError('Please enter your available supplies.');
    return;
  }

  const model      = modelSelect.value;
  const gradeLevel = gradeSelect.value;

  clearError();
  hide(difficultyContainer);
  outputPanel.innerHTML =
    '<span class="output-placeholder">Generating...</span>';
  setGenerating(true);

  try {
    const markdown = await callOpenAI(apiKey, model, gradeLevel, supplies);

    outputPanel.innerHTML = marked.parse(markdown);

    const difficulty = parseDifficulty(markdown);
    renderDifficultyBadge(difficulty);

    addToHistory(gradeLevel, supplies, markdown);
  } catch (err) {
    outputPanel.innerHTML =
      '<span class="output-placeholder">Your experiment will appear here...</span>';
    showError(err.message);
  } finally {
    setGenerating(false);
  }
}

// ── Init ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  apiKeyInput.addEventListener('input', () => {
    apiKey = apiKeyInput.value.trim();
  });

  generateBtn.addEventListener('click', handleGenerate);

  clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Clear all saved experiments?')) {
      localStorage.removeItem(STORAGE_KEY);
      renderHistory();
    }
  });

  renderHistory();
});
