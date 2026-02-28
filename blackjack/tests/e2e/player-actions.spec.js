import { test, expect } from '@playwright/test';
import { BlackjackGame } from '../helpers/game-actions.js';
import {
  buildPlayerBustDeck,
  buildPlayerWinDeck,
  buildSplitDeck,
  buildDoubleDownDeck,
} from '../helpers/deck-builder.js';

test.describe('Player Actions', () => {
  let game;

  test.beforeEach(async ({ page }) => {
    await page.clock.install();
    game = new BlackjackGame(page);
    await game.navigate();
  });

  // ── Hit ────────────────────────────────────────────────────────────────────

  test('hit adds one card to the player hand', async ({ page }) => {
    await game.injectDeck(buildPlayerBustDeck());
    await game.setBet(10);
    await game.deal();
    const before = await page.locator('#player-hands-wrap .card').count();
    await game.hit();
    const after = await page.locator('#player-hands-wrap .card').count();
    expect(after).toBe(before + 1);
  });

  test('busting after hit shows Lose in the result overlay', async ({ page }) => {
    // buildPlayerBustDeck: player 10+5=15, hits 10 → busts (25)
    await game.injectDeck(buildPlayerBustDeck());
    await game.setBet(10);
    await game.deal();
    await game.hit();
    // Bust triggers dealer turn — advance clock to cover it
    await page.clock.runFor(2500);
    await game.waitForOverlay();
    const text = await game.getOverlayText();
    expect(text.toLowerCase()).toContain('lose');
  });

  test('player loses the full bet amount on bust', async ({ page }) => {
    await game.injectDeck(buildPlayerBustDeck());
    await game.setBet(100);
    const start = await game.getBalance();
    await game.deal();
    await game.hit();
    await page.clock.runFor(2500);
    await game.waitForOverlay();
    const final = await game.getBalance();
    expect(final).toBe(start - 100);
  });

  // ── Stand ──────────────────────────────────────────────────────────────────

  test('standing triggers dealer turn and shows a result', async () => {
    await game.injectDeck(buildPlayerWinDeck());
    await game.setBet(10);
    await game.deal();
    await game.stand();
    await game.waitForOverlay();
    const text = await game.getOverlayText();
    expect(text).toMatch(/Win|Lose|Push/);
  });

  test('dealer hole card is revealed after player stands', async ({ page }) => {
    await game.injectDeck(buildPlayerWinDeck());
    await game.setBet(10);
    await game.deal();
    expect(await page.locator('.card.face-down').count()).toBe(1);
    await game.stand();
    await game.waitForOverlay();
    expect(await page.locator('.card.face-down').count()).toBe(0);
  });

  // ── Double Down ────────────────────────────────────────────────────────────

  test('double down button is enabled when balance covers the extra bet', async ({ page }) => {
    await game.injectDeck(buildDoubleDownDeck());
    await game.setBet(50);
    await game.deal();
    await expect(page.locator('#btn-double')).not.toBeDisabled();
  });

  test('double down deducts an additional bet equal to the original immediately', async ({ page }) => {
    await game.injectDeck(buildDoubleDownDeck());
    await game.setBet(50);
    await game.deal();
    const balanceAfterDeal = await game.getBalance(); // 1000 - 50 = 950
    // Click directly and read BEFORE advancing the clock so we see the deduction
    await page.click('#btn-double'); // synchronously deducts the additional bet
    const balanceAfterDouble = await game.getBalance();
    expect(balanceAfterDouble).toBe(balanceAfterDeal - 50); // 950 - 50 = 900
    await page.clock.runFor(2000); // finish the round
  });

  test('double down deals exactly one card then ends player turn', async ({ page }) => {
    await game.injectDeck(buildDoubleDownDeck());
    await game.setBet(50);
    await game.deal();
    await game.doubleDown();
    await game.waitForOverlay();
    const playerCards = await page.locator('#player-hands-wrap .card').count();
    expect(playerCards).toBe(3);
  });

  test('double down is disabled when balance is less than the current bet', async ({ page }) => {
    // Bet 600 → remaining balance = 400, which is less than bet
    await game.injectDeck(buildDoubleDownDeck());
    await game.setBet(600);
    await game.deal();
    await expect(page.locator('#btn-double')).toBeDisabled();
  });

  test('double down win credits 2x the doubled bet', async () => {
    // buildDoubleDownDeck: player 5+6+10=21 beats dealer 18 → WIN
    // Bet 100, doubled to 200. Win: return 200 bet + 200 profit = 400. Net: +200.
    await game.injectDeck(buildDoubleDownDeck());
    await game.setBet(100);
    const start = await game.getBalance();
    await game.deal();
    await game.doubleDown();
    await game.waitForOverlay();
    const final = await game.getBalance();
    expect(final).toBe(start + 200);
  });

  // ── Split ──────────────────────────────────────────────────────────────────

  test('split button is enabled when the player has a matching pair', async ({ page }) => {
    await game.injectDeck(buildSplitDeck());
    await game.setBet(50);
    await game.deal();
    await expect(page.locator('#btn-split')).not.toBeDisabled();
  });

  test('split button is disabled when the player does not have a pair', async ({ page }) => {
    // buildPlayerBustDeck: player gets 10+5 — not a pair
    await game.injectDeck(buildPlayerBustDeck());
    await game.setBet(10);
    await game.deal();
    await expect(page.locator('#btn-split')).toBeDisabled();
  });

  test('split creates two separate hand panels', async ({ page }) => {
    await game.injectDeck(buildSplitDeck());
    await game.setBet(50);
    await game.deal();
    await game.split();
    const handPanels = await page.locator('#player-hands-wrap .hand').count();
    expect(handPanels).toBe(2);
  });

  test('split deducts an additional bet equal to the original', async () => {
    await game.injectDeck(buildSplitDeck());
    await game.setBet(50);
    await game.deal();
    const balanceAfterDeal = await game.getBalance();
    await game.split();
    const balanceAfterSplit = await game.getBalance();
    expect(balanceAfterSplit).toBe(balanceAfterDeal - 50);
  });

  test('each split hand has 2 cards after the split', async ({ page }) => {
    await game.injectDeck(buildSplitDeck());
    await game.setBet(50);
    await game.deal();
    await game.split();
    const hands = page.locator('#player-hands-wrap .hand');
    const count = await hands.count();
    expect(count).toBe(2);
    for (let i = 0; i < count; i++) {
      const cardCount = await hands.nth(i).locator('.card').count();
      expect(cardCount).toBe(2);
    }
  });

  test('split is disabled when balance cannot cover the extra bet', async ({ page }) => {
    // Bet 600 → remaining balance = 400, less than bet of 600
    await game.injectDeck(buildSplitDeck());
    await game.setBet(600);
    await game.deal();
    await expect(page.locator('#btn-split')).toBeDisabled();
  });
});
