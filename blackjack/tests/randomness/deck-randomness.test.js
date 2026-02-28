/**
 * Deck Randomness & Composition Tests
 *
 * Tests the deck.js shuffle implementation against:
 *   1. Composition    — exactly 312 cards, 6 of every rank-suit pair
 *   2. Uniqueness     — no consecutive decks share the same sequence
 *   3. Distribution   — first-card frequency passes a chi-squared test (uniform)
 *   4. Rank balance   — every rank appears in every position with roughly equal frequency
 *   5. Suit balance   — every suit appears in every position with roughly equal frequency
 *   6. Independence   — second card distribution is unaffected by the first card's rank
 *   7. Algorithm      — Fisher-Yates produces full 0..N-1 range of j values (not clipped)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildDeck, shuffle } from '../../src/game/deck.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const DECK_COUNT  = 6;
const SUITS       = ['clubs', 'diamonds', 'hearts', 'spades'];
const RANKS       = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const UNIQUE_CARD_TYPES = SUITS.length * RANKS.length;   // 52
const DECK_SIZE   = UNIQUE_CARD_TYPES * DECK_COUNT;       // 312
const SAMPLES     = 10_000;

// Chi-squared critical value for the given df at alpha=0.0001
// For df=51: 102.1   For df=12: 32.9   For df=3: 21.1
// These are ultra-conservative thresholds — a broken shuffle would produce
// values orders of magnitude higher; a good one stays near df.
const CHI2_THRESHOLD = {
  df51:  200,   // first-card by (rank,suit) type — df = 52-1 = 51
  df12:  80,    // rank frequency per position   — df = 13-1 = 12
  df3:   30,    // suit frequency per position   — df = 4-1  = 3
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** chi-squared statistic: sum((obs - exp)^2 / exp) */
function chiSquared(observed, expected) {
  return observed.reduce((sum, o, i) => sum + (o - expected[i]) ** 2 / expected[i], 0);
}

/** Deck fingerprint for identity checks */
function fingerprint(deck) {
  return deck.map(c => `${c.rank}:${c.suit}`).join(',');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Deck composition', () => {
  test('deck has exactly 312 cards', () => {
    const deck = buildDeck();
    assert.strictEqual(deck.length, DECK_SIZE);
  });

  test('every rank-suit pair appears exactly 6 times (DECK_COUNT)', () => {
    const deck = buildDeck();
    const counts = {};
    for (const card of deck) {
      const key = `${card.rank}:${card.suit}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        const key = `${rank}:${suit}`;
        assert.strictEqual(
          counts[key],
          DECK_COUNT,
          `Expected ${key} to appear ${DECK_COUNT} times, got ${counts[key]}`
        );
      }
    }
  });

  test('no card objects share the same reference (independent copies)', () => {
    const deck = buildDeck();
    const set = new Set(deck);
    assert.strictEqual(set.size, DECK_SIZE, 'Found duplicate object references in deck');
  });

  test('all cards have valid rank (1-13) and valid suit', () => {
    const deck = buildDeck();
    const validSuits = new Set(SUITS);
    for (const card of deck) {
      assert.ok(RANKS.includes(card.rank), `Invalid rank: ${card.rank}`);
      assert.ok(validSuits.has(card.suit), `Invalid suit: ${card.suit}`);
    }
  });

  test('all cards start with faceDown: false', () => {
    const deck = buildDeck();
    for (const card of deck) {
      assert.strictEqual(card.faceDown, false);
    }
  });
});

describe('Shuffle uniqueness', () => {
  test('50 consecutive shuffles all produce different sequences', () => {
    const seen = new Set();
    for (let i = 0; i < 50; i++) {
      const fp = fingerprint(buildDeck());
      assert.ok(!seen.has(fp), `Shuffle produced an identical sequence at iteration ${i}`);
      seen.add(fp);
    }
  });

  test('shuffle(deck) does not mutate the original array', () => {
    const original = buildDeck();
    const copy = [...original];
    shuffle(original);
    // shuffle() returns a new array — original should be unchanged
    assert.deepStrictEqual(original, copy);
  });

  test('shuffling the same input twice produces different outputs', () => {
    const base = buildDeck();
    const a = shuffle(base);
    const b = shuffle(base);
    assert.notDeepStrictEqual(a, b, 'Two shuffles of the same input were identical');
  });
});

describe('First-card distribution (chi-squared, 10 000 samples)', () => {
  // Collect frequencies of which card type (rank:suit) appears first
  const firstCardCounts = {};
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      firstCardCounts[`${rank}:${suit}`] = 0;
    }
  }
  for (let i = 0; i < SAMPLES; i++) {
    const deck = buildDeck();
    const top = deck[deck.length - 1]; // pop() deals from the end
    firstCardCounts[`${top.rank}:${top.suit}`]++;
  }

  test('every card type appears at least once in first position across 10 000 shuffles', () => {
    for (const [key, count] of Object.entries(firstCardCounts)) {
      assert.ok(count > 0, `Card ${key} never appeared in first position across ${SAMPLES} shuffles`);
    }
  });

  test('first-card distribution is approximately uniform (chi-squared < threshold)', () => {
    const expectedPerType = SAMPLES / UNIQUE_CARD_TYPES; // ~192.3
    const observed = Object.values(firstCardCounts);
    const expected  = observed.map(() => expectedPerType);
    const chi2 = chiSquared(observed, expected);
    assert.ok(
      chi2 < CHI2_THRESHOLD.df51,
      `Chi-squared ${chi2.toFixed(2)} exceeds threshold ${CHI2_THRESHOLD.df51} (df=51). ` +
      `Expected ~51 for a uniform distribution.`
    );
  });

  test('no single card type dominates first position (< 3x expected frequency)', () => {
    const expectedPerType = SAMPLES / UNIQUE_CARD_TYPES;
    for (const [key, count] of Object.entries(firstCardCounts)) {
      assert.ok(
        count < expectedPerType * 3,
        `Card ${key} appeared ${count} times in first position (expected ~${expectedPerType.toFixed(1)})`
      );
    }
  });
});

describe('Rank and suit distribution per position (chi-squared, 10 000 samples)', () => {
  // Sample positions 0 (first dealt) and 155 (mid-deck) and 311 (last)
  const POSITIONS = [
    { name: 'first (index 311)', idx: 311 },
    { name: 'mid   (index 156)', idx: 156 },
    { name: 'last  (index   0)', idx:   0 },
  ];

  const rankCounts = {}; // positionName → rank → count
  const suitCounts = {}; // positionName → suit → count
  for (const { name } of POSITIONS) {
    rankCounts[name] = Object.fromEntries(RANKS.map(r => [r, 0]));
    suitCounts[name] = Object.fromEntries(SUITS.map(s => [s, 0]));
  }

  for (let i = 0; i < SAMPLES; i++) {
    const deck = buildDeck();
    for (const { name, idx } of POSITIONS) {
      rankCounts[name][deck[idx].rank]++;
      suitCounts[name][deck[idx].suit]++;
    }
  }

  for (const { name } of POSITIONS) {
    test(`rank distribution at ${name} is approximately uniform`, () => {
      const expectedPerRank = SAMPLES / RANKS.length; // ~769.2
      const observed = RANKS.map(r => rankCounts[name][r]);
      const expected  = observed.map(() => expectedPerRank);
      const chi2 = chiSquared(observed, expected);
      assert.ok(
        chi2 < CHI2_THRESHOLD.df12,
        `Rank chi-squared at ${name}: ${chi2.toFixed(2)} > threshold ${CHI2_THRESHOLD.df12} (df=12)`
      );
    });

    test(`suit distribution at ${name} is approximately uniform`, () => {
      const expectedPerSuit = SAMPLES / SUITS.length; // 2500
      const observed = SUITS.map(s => suitCounts[name][s]);
      const expected  = observed.map(() => expectedPerSuit);
      const chi2 = chiSquared(observed, expected);
      assert.ok(
        chi2 < CHI2_THRESHOLD.df3,
        `Suit chi-squared at ${name}: ${chi2.toFixed(2)} > threshold ${CHI2_THRESHOLD.df3} (df=3)`
      );
    });
  }
});

describe('Sequential independence', () => {
  test('first and second card ranks are not correlated (chi-squared on joint counts)', () => {
    // Build a 13x13 contingency table: first-card rank × second-card rank
    const joint = Array.from({ length: 13 }, () => Array(13).fill(0));
    for (let i = 0; i < SAMPLES; i++) {
      const deck = buildDeck();
      const first  = deck[deck.length - 1].rank - 1; // 0-based index
      const second = deck[deck.length - 2].rank - 1;
      joint[first][second]++;
    }

    // Expected frequency for any cell: SAMPLES / (13 * 13) ≈ 59.2
    // If cards were independent, chi-squared over 169 cells (df=144) ≈ 144.
    // Broken independence would spike this dramatically.
    const expectedPerCell = SAMPLES / (13 * 13);
    let chi2 = 0;
    for (let r = 0; r < 13; r++) {
      for (const c of joint[r]) {
        chi2 += (c - expectedPerCell) ** 2 / expectedPerCell;
      }
    }
    // Threshold for df=144, alpha=0.0001 ≈ 195. Use 300 as ultra-conservative.
    assert.ok(
      chi2 < 300,
      `Joint first×second rank chi-squared ${chi2.toFixed(2)} > 300. Cards may not be independent.`
    );
  });

  test('adjacent positions (311, 310) share no rank-suit pair more than 3% of the time', () => {
    // With 6 decks, the same rank+suit appears 6 times in 312 cards.
    // Probability consecutive positions are identical card type ≈ 5/311 ≈ 1.6%.
    // Allow up to 3% to avoid flakiness.
    let sameCount = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const deck = buildDeck();
      const a = deck[311];
      const b = deck[310];
      if (a.rank === b.rank && a.suit === b.suit) sameCount++;
    }
    const rate = sameCount / SAMPLES;
    assert.ok(rate < 0.03, `Adjacent same-card rate ${(rate * 100).toFixed(2)}% exceeds 3% threshold`);
  });
});

describe('Fisher-Yates algorithm integrity', () => {
  test('shuffle produces all positions — no element is ever stuck at its original index', () => {
    // For a 10-card deck, shuffle 5000 times and verify every element appears
    // in every index at least once (approximate birthday coverage).
    const N = 10;
    const deck = Array.from({ length: N }, (_, i) => i);
    const positionCounts = Array.from({ length: N }, () => Array(N).fill(0));
    for (let trial = 0; trial < 5000; trial++) {
      const shuffled = shuffle(deck);
      for (let pos = 0; pos < N; pos++) {
        positionCounts[pos][shuffled[pos]]++;
      }
    }
    for (let pos = 0; pos < N; pos++) {
      for (let elem = 0; elem < N; elem++) {
        assert.ok(
          positionCounts[pos][elem] > 0,
          `Element ${elem} never appeared at position ${pos} in 5000 shuffles`
        );
      }
    }
  });

  test('shuffle(deck) preserves deck length', () => {
    for (let size of [1, 10, 52, 312]) {
      const deck = Array.from({ length: size }, (_, i) => i);
      const shuffled = shuffle(deck);
      assert.strictEqual(shuffled.length, size);
    }
  });

  test('shuffle([]) returns empty array without error', () => {
    const result = shuffle([]);
    assert.deepStrictEqual(result, []);
  });

  test('shuffle([x]) returns single-element array unchanged', () => {
    const result = shuffle([{ rank: 1, suit: 'hearts' }]);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].rank, 1);
  });

  test('Fisher-Yates swap range covers index 0 — j can equal 0', () => {
    // If j could never be 0, element at index 0 could never move.
    // Test by checking element 0 moves from position 0 with expected frequency.
    const deck = [0, 1, 2, 3, 4];
    let movedFromZero = 0;
    for (let i = 0; i < 5000; i++) {
      const s = shuffle(deck);
      if (s[0] !== 0) movedFromZero++;
    }
    // Expected probability element 0 moves from pos 0 = 4/5 = 80%
    const rate = movedFromZero / 5000;
    assert.ok(rate > 0.70, `Element 0 only moved from position 0 in ${(rate*100).toFixed(1)}% of shuffles (expected ~80%). Possible off-by-one in j range.`);
    assert.ok(rate < 0.90, `Element 0 moved too often (${(rate*100).toFixed(1)}%). Possible j never equals i.`);
  });
});
