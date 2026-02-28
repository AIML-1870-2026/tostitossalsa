import { test, expect } from '@playwright/test';
import { BlackjackGame } from '../helpers/game-actions.js';
import {
  buildPlayerWinDeck,
  buildPlayerLoseDeck,
  buildPlayerBustDeck,
  buildPushDeck,
  buildPlayerBlackjackDeck,
} from '../helpers/deck-builder.js';

test.describe('Round Resolution', () => {
  let game;

  test.beforeEach(async ({ page }) => {
    await page.clock.install();
    game = new BlackjackGame(page);
    await game.navigate();
  });

  // ── Win ────────────────────────────────────────────────────────────────────

  test('player wins: overlay shows Win with positive delta', async () => {
    await game.injectDeck(buildPlayerWinDeck()); // player 19 > dealer 17
    await game.setBet(100);
    await game.deal();
    await game.stand();
    await game.waitForOverlay();
    const text = await game.getOverlayText();
    expect(text).toContain('Win');
    expect(text).toContain('+100');
  });

  test('player wins: balance increases by the bet amount', async () => {
    await game.injectDeck(buildPlayerWinDeck());
    await game.setBet(100);
    const start = await game.getBalance();
    await game.deal();
    await game.stand();
    await game.waitForOverlay();
    const final = await game.getBalance();
    expect(final).toBe(start + 100);
  });

  // ── Lose ───────────────────────────────────────────────────────────────────

  test('player loses: overlay shows Lose with negative delta', async () => {
    await game.injectDeck(buildPlayerLoseDeck()); // player 15 < dealer 18
    await game.setBet(100);
    await game.deal();
    await game.stand();
    await game.waitForOverlay();
    const text = await game.getOverlayText();
    expect(text.toLowerCase()).toContain('lose');
    expect(text).toContain('-100');
  });

  test('player loses: balance decreases by the bet amount', async () => {
    await game.injectDeck(buildPlayerLoseDeck());
    await game.setBet(100);
    const start = await game.getBalance();
    await game.deal();
    await game.stand();
    await game.waitForOverlay();
    const final = await game.getBalance();
    expect(final).toBe(start - 100);
  });

  // ── Bust ───────────────────────────────────────────────────────────────────

  test('player busts: overlay shows Lose', async ({ page }) => {
    await game.injectDeck(buildPlayerBustDeck());
    await game.setBet(100);
    await game.deal();
    await game.hit();
    await page.clock.runFor(2500);
    await game.waitForOverlay();
    const text = await game.getOverlayText();
    expect(text.toLowerCase()).toContain('lose');
  });

  test('player busts: entire bet is lost', async ({ page }) => {
    await game.injectDeck(buildPlayerBustDeck());
    await game.setBet(200);
    const start = await game.getBalance();
    await game.deal();
    await game.hit();
    await page.clock.runFor(2500);
    await game.waitForOverlay();
    const final = await game.getBalance();
    expect(final).toBe(start - 200);
  });

  // ── Push ───────────────────────────────────────────────────────────────────

  test('push: overlay shows Push with bet-returned message', async () => {
    await game.injectDeck(buildPushDeck()); // player 17 = dealer 17
    await game.setBet(100);
    await game.deal();
    await game.stand();
    await game.waitForOverlay();
    const text = await game.getOverlayText();
    expect(text.toLowerCase()).toContain('push');
  });

  test('push: balance is unchanged (bet returned)', async () => {
    await game.injectDeck(buildPushDeck());
    await game.setBet(100);
    const start = await game.getBalance();
    await game.deal();
    await game.stand();
    await game.waitForOverlay();
    const final = await game.getBalance();
    expect(final).toBe(start);
  });

  // ── Blackjack ──────────────────────────────────────────────────────────────

  test('blackjack: overlay shows Blackjack! with 1.5x payout', async () => {
    await game.injectDeck(buildPlayerBlackjackDeck()); // A + K
    await game.setBet(100);
    await game.deal();
    await game.waitForOverlay();
    const text = await game.getOverlayText();
    expect(text).toContain('Blackjack');
    expect(text).toContain('+150');
  });

  test('blackjack: balance reflects 3:2 payout', async () => {
    await game.injectDeck(buildPlayerBlackjackDeck());
    await game.setBet(100);
    const start = await game.getBalance();
    await game.deal();
    await game.waitForOverlay();
    const final = await game.getBalance();
    // Bet 100, profit 150, net +150
    expect(final).toBe(start + 150);
  });

  // ── Multiple rounds ────────────────────────────────────────────────────────

  test('balance carries forward correctly across two rounds', async ({ page }) => {
    // Round 1: win +100
    await game.injectDeck(buildPlayerWinDeck());
    await game.setBet(100);
    await game.deal();
    await game.stand();
    await game.waitForOverlay();
    await game.dismissOverlay();
    await page.clock.runFor(1000);

    const balanceAfterRound1 = await game.getBalance();
    expect(balanceAfterRound1).toBe(1100);

    // Round 2: lose -100
    await game.injectDeck(buildPlayerLoseDeck());
    await game.setBet(100);
    await game.deal();
    await game.stand();
    await game.waitForOverlay();
    const balanceAfterRound2 = await game.getBalance();
    expect(balanceAfterRound2).toBe(1000);
  });
});
