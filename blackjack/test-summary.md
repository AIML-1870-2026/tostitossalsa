# Blackjack Test Results — Summary

**Date:** 2026-02-27 | **Engine:** Playwright 1.50 + Node.js test runner | **Browser:** Chromium (headless)

## Overall Results: 171/171 Tests Passed ✅

| Suite | Tests | Status |
|---|---|---|
| Unit — `hand.js` | 37/37 | ✅ |
| E2E — Betting, Deal Flow, Player Actions, Insurance, Resolution, Overlay, Accessibility, Settings | 94/94 | ✅ |
| Randomness — `deck-randomness.test.js` | 40/40 | ✅ |
| **Total** | **171/171** | ✅ |

---

## Unit Tests (37/37)

All pure logic functions in `hand.js` pass in under 1 ms each, covering hand value calculation, bust detection, blackjack identification, split eligibility, and score labeling. Key edge cases verified include correct multi-Ace handling, rank-based (not value-based) split logic, and proper ignoring of face-down dealer cards during the player turn.

---

## E2E Tests (94/94)

Tests run in real Chromium with deterministic card injection via `window.__testDeck`. All core gameplay flows pass:

- **Betting:** Chip accumulation, balance clamping, input validation, panel locking during play.
- **Deal Flow:** Correct card counts, hole card hidden during player turn, blackjack skips player turn and pays 3:2.
- **Player Actions:** Hit, stand, double down, and split all behave correctly — including balance deductions, card counts, and win/loss payouts.
- **Insurance:** Correct prompting on dealer Ace, proper 2:1 payout, break-even on dealer BJ, and correct net outcomes for all take/decline × BJ/no-BJ combinations.
- **Resolution:** Win, loss, bust, push, and blackjack all produce correct overlay messages and balance changes across multiple rounds.
- **Overlay & Accessibility:** Overlay appears/dismisses correctly; all 15 accessibility tests pass.
- **Settings:** All 10 settings tests pass.

---

## Randomness Tests (40/40)

The shuffle uses `crypto.getRandomValues()` (a cryptographically secure PRNG backed by OS entropy). All statistical tests confirm casino-grade quality:

- **Uniformity:** Chi-squared values for rank and suit distribution are well within thresholds at all deck positions.
- **Sequential independence:** Joint chi-squared (150.28 vs. threshold 300) and same-card adjacency rate (1.55% vs. theoretical 1.61%) confirm cards are not predictable from prior cards.
- **Fisher-Yates integrity:** All positions reachable; element-0 displacement rate of 81.2% matches the theoretical 80%, ruling out the common Sattolo off-by-one bug.
- **NIST SP 800-22:** Monobit z = 0.88 and Runs z = 1.22 — both comfortably within the safe zone.
- **KS uniformity:** D = 0.00883 vs. critical value 0.02757 — excellent fit to Uniform[0,1).
- **Autocorrelation:** Zero sequential dependence at lags 1–3 (max |r| = 0.006 vs. threshold 0.015).
- **Shannon entropy:** Every sampled deck position exceeds 99.9% of theoretical maximum (5.70 bits).

**Verdict:** The shuffle is correct, unbiased, and casino-grade. It is not predictable or reproducible by an adversary observing prior outputs.
