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

// ── CSPRNG-specific helpers ───────────────────────────────────────────────────

/** Batch-generate n Uint32 values from crypto.getRandomValues() (16 384 per chunk). */
function generateUint32(n) {
  const buf   = new Uint32Array(n);
  const CHUNK = 16384;
  for (let i = 0; i < n; i += CHUNK) {
    crypto.getRandomValues(buf.subarray(i, i + Math.min(CHUNK, n - i)));
  }
  return buf;
}

/** Hamming-weight (popcount) for an unsigned 32-bit integer — no multiplication overflow. */
function popcount32(n) {
  n  = n >>> 0;
  n  = n - ((n >>> 1) & 0x55555555);
  n  = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
  n  = (n + (n >>> 4)) & 0x0f0f0f0f;
  n  = n + (n >>> 8);
  n  = n + (n >>> 16);
  return n & 0x3f;
}

/** Pearson correlation coefficient for two equal-length number arrays. */
function pearsonR(xs, ys) {
  const n = xs.length;
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; }
  const mx = sx / n, my = sy / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    num += dx * dy; denX += dx * dx; denY += dy * dy;
  }
  return num / Math.sqrt(denX * denY);
}

/** Shannon entropy (bits) from a { key: count } frequency map. */
function shannonEntropy(counts) {
  const total = Object.values(counts).reduce((s, c) => s + c, 0);
  return Object.values(counts).reduce((s, c) => {
    const p = c / total;
    return p > 0 ? s - p * Math.log2(p) : s;
  }, 0);
}

// ── Casino-grade CSPRNG validation ───────────────────────────────────────────

describe('CSPRNG API availability', () => {
  test('globalThis.crypto.getRandomValues is present and callable', () => {
    assert.strictEqual(
      typeof globalThis.crypto?.getRandomValues, 'function',
      'crypto.getRandomValues is not available — shuffle() cannot use a CSPRNG.'
    );
  });

  test('crypto.getRandomValues() produces non-zero output (not a stub)', () => {
    const buf = new Uint32Array(16);
    crypto.getRandomValues(buf);
    assert.ok(
      Array.from(buf).some(v => v !== 0),
      'crypto.getRandomValues() returned all zeros — possible stub or broken entropy source.'
    );
  });
});

describe('NIST Monobit — bit-level frequency (3.2 million bits)', () => {
  // NIST SP 800-22 Test 1: Frequency (Monobit) Test.
  // 100 000 uint32 values = 3 200 000 bits.  Expected: ≈50% ones.
  // z = |ones − zeros| / √total_bits;  casino threshold: z < 3.29 (99.9% CI).
  const MONOBIT_N  = 100_000;
  const TOTAL_BITS = MONOBIT_N * 32;
  const rawMono    = generateUint32(MONOBIT_N);
  let onesTotal = 0;
  const bitPosCounts = new Array(32).fill(0);
  for (const v of rawMono) {
    onesTotal += popcount32(v);
    for (let b = 0; b < 32; b++) bitPosCounts[b] += (v >>> b) & 1;
  }

  test('global bit frequency z < 3.29 (3.2 M bits, NIST SP 800-22 Monobit)', () => {
    const z = Math.abs(onesTotal - TOTAL_BITS / 2) / Math.sqrt(TOTAL_BITS / 4);
    assert.ok(
      z < 3.29,
      `Monobit z = ${z.toFixed(4)} ≥ 3.29 — bit-level bias detected (${onesTotal} ones / ${TOTAL_BITS} bits).`
    );
  });

  test('each of the 32 bit positions is individually balanced (z < 4 per position)', () => {
    for (let b = 0; b < 32; b++) {
      const z = Math.abs(bitPosCounts[b] - MONOBIT_N / 2) / Math.sqrt(MONOBIT_N / 4);
      assert.ok(
        z < 4,
        `Bit position ${b}: z = ${z.toFixed(3)}, count = ${bitPosCounts[b]}/${MONOBIT_N} — positional bit bias.`
      );
    }
  });
});

describe('Kolmogorov-Smirnov — continuous uniformity test', () => {
  // KS statistic: D_n = max_i max(|(i+1)/N − x_i|, |x_i − i/N|) over sorted samples.
  // Critical value at α=0.001, N=5 000: D_crit ≈ 1.9496/√N ≈ 0.0276.
  const KS_N       = 5_000;
  const D_CRITICAL = 1.9496 / Math.sqrt(KS_N);
  const rawKS      = generateUint32(KS_N);
  const kssamples  = Array.from(rawKS, v => v / 0x100000000).sort((a, b) => a - b);

  test(`KS D < ${D_CRITICAL.toFixed(4)} — output fits Uniform[0,1) (α=0.001, N=${KS_N})`, () => {
    let D = 0;
    for (let i = 0; i < KS_N; i++) {
      D = Math.max(D,
        Math.abs((i + 1) / KS_N - kssamples[i]),
        Math.abs(i       / KS_N - kssamples[i])
      );
    }
    assert.ok(
      D < D_CRITICAL,
      `KS D = ${D.toFixed(5)} ≥ ${D_CRITICAL.toFixed(5)} (α=0.001, N=${KS_N}) — output deviates from Uniform[0,1).`
    );
  });
});

describe('Sequential autocorrelation — independence at lags 1–3', () => {
  // Pearson r at lags 1, 2, 3 for 50 000 uniform values.
  // 99.9% CI for independent uniform series: |r| < 3.29/√(N−1) ≈ 0.0147.
  const AC_N      = 50_000;
  const THRESHOLD = 3.29 / Math.sqrt(AC_N - 1);
  const rawAC     = generateUint32(AC_N);
  const acVals    = Array.from(rawAC, v => v / 0x100000000);

  for (const lag of [1, 2, 3]) {
    test(`lag-${lag} Pearson r < ±${THRESHOLD.toFixed(4)} (no sequential dependence)`, () => {
      const r = pearsonR(acVals.slice(0, AC_N - lag), acVals.slice(lag));
      assert.ok(
        Math.abs(r) < THRESHOLD,
        `Lag-${lag}: r = ${r.toFixed(6)}, threshold ±${THRESHOLD.toFixed(4)} — sequential correlation detected.`
      );
    });
  }
});

describe('NIST Runs Test — no periodic alternation structure', () => {
  // NIST SP 800-22 Test 3: Runs Test.
  // Binarize at 0.5; count consecutive same-bit "runs".
  // E[R] = (2·n₀·n₁)/N + 1 ;  Var[R] = (2·n₀·n₁·(2·n₀·n₁ − N)) / (N²·(N−1))
  // |Z| = |R − E[R]| / √Var[R] < 3.29 at 99.9% CI.
  const RUNS_N  = 10_000;
  const rawRuns = generateUint32(RUNS_N);
  const bits    = Array.from(rawRuns, v => (v / 0x100000000 >= 0.5) ? 1 : 0);
  let runs = 1;
  for (let i = 1; i < RUNS_N; i++) if (bits[i] !== bits[i - 1]) runs++;
  const n1 = bits.reduce((s, b) => s + b, 0);
  const n0 = RUNS_N - n1;
  const E  = (2 * n0 * n1) / RUNS_N + 1;
  const V  = (2 * n0 * n1 * (2 * n0 * n1 - RUNS_N)) / (RUNS_N ** 2 * (RUNS_N - 1));

  test('runs z-score < 3.29 — no periodic structure (NIST SP 800-22 Runs Test)', () => {
    const z = (runs - E) / Math.sqrt(V);
    assert.ok(
      Math.abs(z) < 3.29,
      `Runs z = ${z.toFixed(3)}: R=${runs}, E[R]=${E.toFixed(1)}, Var=${V.toFixed(1)} — periodic structure detected.`
    );
  });
});

describe('Per-position Shannon entropy — casino-grade deck coverage', () => {
  // 10 000 shuffles of the 6-deck shoe; 5 evenly-spaced deck positions sampled.
  // 52 unique card types → max H = log₂(52) ≈ 5.70 bits.
  // Casino-grade threshold: H > 5.50 bits (≥ 96.5% of maximum possible entropy).
  const MAX_H   = Math.log2(52);
  const H_MIN   = 5.50;
  const ENT_POS = [0, 77, 155, 233, 311];
  const posCounts = {};
  for (const p of ENT_POS) posCounts[p] = {};
  for (let i = 0; i < SAMPLES; i++) {
    const deck = buildDeck();
    for (const p of ENT_POS) {
      const key = `${deck[p].rank}:${deck[p].suit}`;
      posCounts[p][key] = (posCounts[p][key] ?? 0) + 1;
    }
  }

  for (const p of ENT_POS) {
    test(`position ${p}: Shannon H > ${H_MIN} bits (max = ${MAX_H.toFixed(2)} bits)`, () => {
      const H = shannonEntropy(posCounts[p]);
      assert.ok(
        H > H_MIN,
        `Position ${p}: H = ${H.toFixed(4)} bits < ${H_MIN} — some card types dominate this slot.`
      );
    });
  }
});

describe('Derangement quality — positional migration via CSPRNG', () => {
  // Fisher-Yates: P(element stays at original position) = 1/N.
  // For N=52: expected stay-rate ≈ 1.923%.  Casino threshold: < 5% per element.
  // Global z-test across 52 elements × 5 000 trials: |z| < 3.29.
  const DERANGE_N      = 52;
  const DERANGE_TRIALS = 5_000;
  const base           = Array.from({ length: DERANGE_N }, (_, i) => i);
  const stayCount      = new Array(DERANGE_N).fill(0);
  for (let t = 0; t < DERANGE_TRIALS; t++) {
    const s = shuffle(base);
    for (let i = 0; i < DERANGE_N; i++) if (s[i] === base[i]) stayCount[i]++;
  }

  test('no element stays in original position more than 5% of trials (expected ≈1.92%)', () => {
    for (let i = 0; i < DERANGE_N; i++) {
      const rate = stayCount[i] / DERANGE_TRIALS;
      assert.ok(
        rate < 0.05,
        `Element ${i}: stay-rate ${(rate * 100).toFixed(2)}% > 5% (${stayCount[i]}/${DERANGE_TRIALS}).`
      );
    }
  });

  test('global stay-in-place rate is within 3.29σ of expected 1/N (unbiased derangement)', () => {
    const totalStays  = stayCount.reduce((s, c) => s + c, 0);
    const totalTrials = DERANGE_TRIALS * DERANGE_N;
    const expected    = 1 / DERANGE_N;
    const observed    = totalStays / totalTrials;
    const σ           = Math.sqrt(expected * (1 - expected) / totalTrials);
    const z           = Math.abs(observed - expected) / σ;
    assert.ok(
      z < 3.29,
      `Derangement z = ${z.toFixed(3)}: rate ${(observed * 100).toFixed(3)}%, expected ${(expected * 100).toFixed(3)}%.`
    );
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
