// Deck stack graphic — shows remaining cards as layered rectangles
export function renderDeck(remaining, total) {
  const el = document.getElementById('deck-visual');
  if (!el) return;
  el.innerHTML = '';

  const ratio = Math.max(0.05, remaining / total);
  const layers = Math.ceil(ratio * 5); // 1–5 visible layers

  for (let i = 0; i < layers; i++) {
    const layer = document.createElement('div');
    layer.className = 'top-card';
    layer.style.transform = `translate(${-i * 2}px, ${-i * 2}px)`;
    layer.style.zIndex = layers - i;
    el.appendChild(layer);
  }
}
