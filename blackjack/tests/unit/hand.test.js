/**
 * Unit tests for src/game/hand.js — pure functions with no DOM or browser dependencies.
 * Run with: npm run test:unit
 * Requires Node.js 18+ (uses built-in node:test runner, no extra packages needed).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handValue, isBust, isBlackjack, canSplit, scoreLabel } from '../../src/game/hand.js';

// Helper: create a card object (faceDown defaults to false)
const c = (rank, suit = 'spades', faceDown = false) => ({ rank, suit, faceDown });

// ── handValue ────────────────────────────────────────────────────────────────

test('handValue: basic numeric sum', () => {
  assert.equal(handValue([c(7), c(8)]), 15);
});

test('handValue: face cards (J, Q, K) count as 10', () => {
  assert.equal(handValue([c(11), c(12), c(13)]), 30);
});

test('handValue: 10 counts as 10', () => {
  assert.equal(handValue([c(10), c(7)]), 17);
});

test('handValue: Ace counts as 11 when it keeps total at or below 21', () => {
  assert.equal(handValue([c(1), c(9)]), 20); // A=11, 9 → 20
});

test('handValue: Ace falls back to 1 when 11 would bust', () => {
  assert.equal(handValue([c(1), c(9), c(5)]), 15); // A=1, 9, 5 → 15
});

test('handValue: two Aces — one counts as 11, one as 1', () => {
  assert.equal(handValue([c(1), c(1)]), 12); // A=11 + A=1 = 12
});

test('handValue: three Aces', () => {
  assert.equal(handValue([c(1), c(1), c(1)]), 13); // A=11 + A=1 + A=1 = 13
});

test('handValue: natural blackjack (Ace + King)', () => {
  assert.equal(handValue([c(1), c(13)]), 21);
});

test('handValue: natural blackjack (Ace + 10)', () => {
  assert.equal(handValue([c(1), c(10)]), 21);
});

test('handValue: ignores face-down cards', () => {
  // Only the face-up 10 should be counted
  assert.equal(handValue([c(10), c(10, 'hearts', true)]), 10);
});

test('handValue: all face-down returns 0', () => {
  assert.equal(handValue([c(5, 'spades', true), c(7, 'clubs', true)]), 0);
});

test('handValue: bust total returned when all aces used as 1 still bust', () => {
  // 10 + 10 + 10 = 30 — no aces, cannot reduce
  assert.equal(handValue([c(10), c(10), c(10)]), 30);
});

// ── isBust ───────────────────────────────────────────────────────────────────

test('isBust: true when total exceeds 21', () => {
  assert.equal(isBust([c(10), c(10), c(5)]), true); // 25
});

test('isBust: false when total is exactly 21', () => {
  assert.equal(isBust([c(10), c(10), c(1)]), false); // 21
});

test('isBust: false when total is under 21', () => {
  assert.equal(isBust([c(10), c(8)]), false); // 18
});

test('isBust: Ace saves from bust when possible', () => {
  assert.equal(isBust([c(1), c(9), c(5)]), false); // A=1, total=15
});

// ── isBlackjack ──────────────────────────────────────────────────────────────

test('isBlackjack: true for Ace + 10', () => {
  assert.equal(isBlackjack([c(1), c(10)]), true);
});

test('isBlackjack: true for Ace + Jack', () => {
  assert.equal(isBlackjack([c(1), c(11)]), true);
});

test('isBlackjack: true for Ace + Queen', () => {
  assert.equal(isBlackjack([c(1), c(12)]), true);
});

test('isBlackjack: true for Ace + King', () => {
  assert.equal(isBlackjack([c(1), c(13)]), true);
});

test('isBlackjack: false for 3-card 21 (7+7+7)', () => {
  assert.equal(isBlackjack([c(7), c(7), c(7)]), false);
});

test('isBlackjack: false for 2-card non-21 (10+9)', () => {
  assert.equal(isBlackjack([c(10), c(9)]), false);
});

test('isBlackjack: false for single card', () => {
  assert.equal(isBlackjack([c(1)]), false);
});

test('isBlackjack: counts face-down cards (dealer hole card scenario)', () => {
  // Dealer up=Ace (face-up), hole=King (face-down) → still blackjack
  assert.equal(isBlackjack([c(1, 'clubs', false), c(13, 'hearts', true)]), true);
});

test('isBlackjack: false when 10-value card is not paired with Ace', () => {
  assert.equal(isBlackjack([c(10), c(10)]), false); // 20, not 21
});

// ── canSplit ─────────────────────────────────────────────────────────────────

test('canSplit: true for two cards with identical rank', () => {
  assert.equal(canSplit([c(8, 'spades'), c(8, 'clubs')]), true);
});

test('canSplit: true for pair of Aces', () => {
  assert.equal(canSplit([c(1, 'hearts'), c(1, 'diamonds')]), true);
});

test('canSplit: false when ranks differ even if both worth 10 (10 vs King)', () => {
  assert.equal(canSplit([c(10), c(13)]), false);
});

test('canSplit: false when ranks differ even if both worth 10 (Jack vs Queen)', () => {
  assert.equal(canSplit([c(11), c(12)]), false);
});

test('canSplit: false for a 3-card hand', () => {
  assert.equal(canSplit([c(8), c(8), c(8)]), false);
});

test('canSplit: false for a single card', () => {
  assert.equal(canSplit([c(8)]), false);
});

// ── scoreLabel ───────────────────────────────────────────────────────────────

test('scoreLabel: plain number for hard hand', () => {
  assert.equal(scoreLabel([c(10), c(7)]), '17');
});

test('scoreLabel: "soft X" when Ace is counted as 11', () => {
  assert.equal(scoreLabel([c(1), c(6)]), 'soft 17');
});

test('scoreLabel: no "soft" prefix when Ace is forced to 1', () => {
  assert.equal(scoreLabel([c(1), c(9), c(5)]), '15');
});

test('scoreLabel: Ace + 10-value = "21" (not "soft 21")', () => {
  assert.equal(scoreLabel([c(1), c(13)]), '21');
});

test('scoreLabel: two Aces = "12" (not "soft 12" — raw sum busts)', () => {
  // raw = 11+11 = 22 > 21 → isSoft false → shows '12'
  assert.equal(scoreLabel([c(1), c(1)]), '12');
});

test('scoreLabel: ignores face-down cards in label', () => {
  // Only the face-up 9 is visible; 5 is hidden
  assert.equal(scoreLabel([c(9, 'spades', false), c(5, 'clubs', true)]), '9');
});
