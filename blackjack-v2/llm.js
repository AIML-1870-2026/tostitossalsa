// llm.js — OpenAI API call functions

let openaiKey = '';

export function setApiKey(key) {
  openaiKey = key;
}

export function getApiKey() {
  return openaiKey;
}

async function callOpenAI(model, messages) {
  if (!openaiKey) throw new Error('No API key set');

  const body = {
    model,
    messages,
    response_format: { type: 'json_object' },
    max_tokens: 300
  };

  console.log('[LLM] Request to', model, ':', messages);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + openaiKey
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.error?.message || `HTTP ${res.status}`;
    console.error('[LLM] Error:', msg);
    throw new Error(msg);
  }

  const data = await res.json();
  const raw = data.choices[0].message.content;
  console.log('[LLM] Raw response:', raw);

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error('[LLM] JSON parse failed:', e);
    throw new Error('Invalid JSON response from model');
  }

  console.log('[LLM] Parsed action:', parsed);
  return parsed;
}

function buildSystemPrompt(playerName, model, bankroll, minBet, explainLevel = 'basic') {
  let prompt = `You are ${playerName}, an AI Blackjack player using the ${model} model.
Respond ONLY with valid JSON in the exact format requested.
Your current bankroll: $${bankroll}
Minimum bet: $${minBet}
Play strategically to maximize long-term winnings.`;
  if (explainLevel === 'basic') prompt += '\nKeep your reasoning to one sentence maximum.';
  else if (explainLevel === 'statistical') prompt += '\nInclude brief probability and odds reasoning in 2-3 sentences.';
  else if (explainLevel === 'in-depth') prompt += '\nProvide a full chain-of-thought explanation covering all factors.';
  return prompt;
}

export async function getBetDecision(playerName, model, bankroll, minBet, handHistory, explainLevel = 'basic') {
  const historyText = handHistory.length
    ? handHistory.map(h => `${h.outcome} $${h.amount}`).join(', ')
    : 'No previous hands';

  const messages = [
    { role: 'system', content: buildSystemPrompt(playerName, model, bankroll, minBet, explainLevel) },
    {
      role: 'user',
      content: `Place your bet for this hand.
Bankroll: $${bankroll}
Min bet: $${minBet}
Last 3 hands: ${historyText}
Respond with JSON: {"action":"bet","amount":<integer between ${minBet} and ${bankroll}>,"reasoning":"<brief explanation>"}`
    }
  ];

  const parsed = await callOpenAI(model, messages);
  const amount = Math.max(minBet, Math.min(bankroll, Math.round(Number(parsed.amount) || minBet)));
  console.log('[LLM] Bet decision:', amount, '-', parsed.reasoning);
  return { amount, reasoning: parsed.reasoning || '' };
}

export async function getInsuranceDecision(playerName, model, bankroll, bet, hand, handHistory, explainLevel = 'basic') {
  const maxInsurance = Math.floor(bet / 2);
  const messages = [
    { role: 'system', content: buildSystemPrompt(playerName, model, bankroll, 10, explainLevel) },
    {
      role: 'user',
      content: `Dealer shows an Ace. Do you want insurance?
Your hand: ${hand.cards.map(c => c.rank + c.suit).join(', ')} (${hand.label})
Your bet: $${bet}
Max insurance bet: $${maxInsurance}
Bankroll: $${bankroll}
Respond with JSON: {"action":"insurance","take":true|false,"amount":<integer up to ${maxInsurance}>,"reasoning":"<brief explanation>"}`
    }
  ];

  const parsed = await callOpenAI(model, messages);
  const take = !!parsed.take;
  const amount = take ? Math.max(1, Math.min(maxInsurance, Math.round(Number(parsed.amount) || maxInsurance))) : 0;
  console.log('[LLM] Insurance decision:', take, amount, '-', parsed.reasoning);
  return { take, amount, reasoning: parsed.reasoning || '' };
}

export async function getActionDecision(playerName, model, bankroll, hand, dealerUpCard, legalActions, bet, splitInfo, explainLevel = 'basic') {
  const splitText = splitInfo ? ` (Split hand ${splitInfo.index + 1} of ${splitInfo.total})` : '';
  const messages = [
    { role: 'system', content: buildSystemPrompt(playerName, model, bankroll, 10, explainLevel) },
    {
      role: 'user',
      content: `Your turn${splitText}.
Your hand: ${hand.cards.map(c => c.rank + c.suit).join(', ')} — ${hand.label}
Dealer shows: ${dealerUpCard.rank}${dealerUpCard.suit}
Current bet: $${bet}
Bankroll: $${bankroll}
Legal actions: ${legalActions.join(', ')}
Respond with JSON: {"action":"<one of: ${legalActions.join('|')}>","reasoning":"<brief explanation>"}`
    }
  ];

  const parsed = await callOpenAI(model, messages);
  const action = legalActions.includes(parsed.action) ? parsed.action : 'stand';
  if (action !== parsed.action) {
    console.warn('[LLM] Illegal action returned:', parsed.action, '— defaulting to stand');
  }
  console.log('[LLM] Action decision:', action, '-', parsed.reasoning);
  return { action, reasoning: parsed.reasoning || '' };
}

export async function getAdvisorRecommendation(gameState, apiKey, model) {
  const { dealerUpCard, playerHands, currentBankroll, currentBet, deckCount } = gameState;

  const systemPrompt = 'You are a blackjack strategy advisor. Given the current game state, provide a concise strategic recommendation (2-4 sentences). Focus on the optimal play and why. Be direct and actionable.';

  const handsText = playerHands.map((h, i) => {
    const label = h.label || '';
    const cards = (h.cards || []).map(c => c.rank + c.suit).join(', ');
    return `Hand ${i + 1}: ${cards} (${label})`;
  }).join('; ');

  const userPrompt = `Current blackjack game state:
Dealer up card: ${dealerUpCard ? dealerUpCard.rank + dealerUpCard.suit : 'Unknown'}
Your hand(s): ${handsText || 'No hands yet'}
Current bet: $${currentBet || 0}
Bankroll: $${currentBankroll || 0}
Decks in play: ${deckCount || 1}

What is the optimal strategy right now? Provide a direct recommendation.`;

  if (!openaiKey && !apiKey) {
    return 'No API key available — cannot fetch advisor recommendation.';
  }

  const savedKey = openaiKey;
  if (apiKey && apiKey !== openaiKey) openaiKey = apiKey;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + openaiKey
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 200
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.error?.message || `HTTP ${res.status}`;
      console.error('[Advisor] Error:', msg);
      return `Advisor unavailable: ${msg}`;
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';
    console.log('[Advisor] Recommendation:', text);
    return text || 'No recommendation returned.';
  } catch (e) {
    console.error('[Advisor] Fetch error:', e);
    return 'Advisor unavailable — network error.';
  } finally {
    openaiKey = savedKey;
  }
}
