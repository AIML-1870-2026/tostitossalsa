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

function buildSystemPrompt(playerName, model, bankroll, minBet) {
  return `You are ${playerName}, an AI Blackjack player using the ${model} model.
Respond ONLY with valid JSON in the exact format requested.
Your current bankroll: $${bankroll}
Minimum bet: $${minBet}
Play strategically to maximize long-term winnings.`;
}

export async function getBetDecision(playerName, model, bankroll, minBet, handHistory) {
  const historyText = handHistory.length
    ? handHistory.map(h => `${h.outcome} $${h.amount}`).join(', ')
    : 'No previous hands';

  const messages = [
    { role: 'system', content: buildSystemPrompt(playerName, model, bankroll, minBet) },
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

export async function getInsuranceDecision(playerName, model, bankroll, bet, hand, handHistory) {
  const maxInsurance = Math.floor(bet / 2);
  const messages = [
    { role: 'system', content: buildSystemPrompt(playerName, model, bankroll, 10) },
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

export async function getActionDecision(playerName, model, bankroll, hand, dealerUpCard, legalActions, bet, splitInfo) {
  const splitText = splitInfo ? ` (Split hand ${splitInfo.index + 1} of ${splitInfo.total})` : '';
  const messages = [
    { role: 'system', content: buildSystemPrompt(playerName, model, bankroll, 10) },
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
