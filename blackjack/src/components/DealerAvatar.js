// Dealer avatar with contextual reaction states

export function setDealerMood(mood) {
  const avatar = document.getElementById('dealer-avatar');
  const status = document.getElementById('dealer-status');
  if (!avatar || !status) return;

  avatar.classList.remove('happy', 'sad');

  const moods = {
    neutral:  { label: 'Waiting...',   emoji: '🎩', cls: '' },
    thinking: { label: 'Your turn...', emoji: '🤔', cls: '' },
    happy:    { label: 'Dealer wins!', emoji: '😄', cls: 'happy' },
    sad:      { label: 'You win!',     emoji: '😟', cls: 'sad' },
    bj:       { label: 'Blackjack!',   emoji: '😐', cls: '' },
  };

  const m = moods[mood] || moods.neutral;
  if (m.cls) avatar.classList.add(m.cls);
  // Use data attribute so CSS attr() can reference it
  avatar.dataset.emoji = m.emoji;
  // Also set text content as fallback (inner text won't conflict with ::after)
  avatar.textContent = m.emoji;
  status.textContent = m.label;
}
