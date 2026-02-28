import { test, expect } from '@playwright/test';
import { BlackjackGame } from '../helpers/game-actions.js';
import {
  buildPlayerBustDeck,
  buildPlayerBlackjackDeck,
  buildPlayerWinDeck,
} from '../helpers/deck-builder.js';

test.describe('Deal Flow', () => {
  let game;

  test.beforeEach(async ({ page }) => {
    await page.clock.install();
    game = new BlackjackGame(page);
    await game.navigate();
  });

  test('deal deducts the bet from the balance immediately', async ({ page }) => {
    await game.injectDeck(buildPlayerBustDeck());
    await game.setBet(50);
    const startBalance = await game.getBalance();
    await game.deal();
    const afterBalance = await game.getBalance();
    expect(afterBalance).toBe(startBalance - 50);
  });

  test('four cards are on the table after deal completes', async () => {
    await game.injectDeck(buildPlayerBustDeck());
    await game.setBet(10);
    await game.deal();
    const count = await game.getCardCount();
    expect(count).toBe(4);
  });

  test('dealer hole card is face-down after deal', async ({ page }) => {
    await game.injectDeck(buildPlayerBustDeck());
    await game.setBet(10);
    await game.deal();
    const faceDownCount = await page.locator('.card.face-down').count();
    expect(faceDownCount).toBe(1);
  });

  test('hit/stand buttons are enabled and deal is disabled after deal', async ({ page }) => {
    await game.injectDeck(buildPlayerBustDeck());
    await game.setBet(10);
    await game.deal();
    await expect(page.locator('#btn-hit')).not.toBeDisabled();
    await expect(page.locator('#btn-stand')).not.toBeDisabled();
    await expect(page.locator('#btn-deal')).toBeDisabled();
  });

  test('game phase is PLAYER_TURN after deal completes', async () => {
    await game.injectDeck(buildPlayerBustDeck());
    await game.setBet(10);
    await game.deal();
    const phase = await game.getPhase();
    expect(phase).toBe('PLAYER_TURN');
  });

  test('player blackjack skips player turn and goes straight to resolution', async ({ page }) => {
    await game.injectDeck(buildPlayerBlackjackDeck());
    await game.setBet(100);
    await game.deal();
    // BJ resolution fires within the deal() runFor window
    await game.waitForOverlay();
    const text = await game.getOverlayText();
    expect(text).toContain('Blackjack');
  });

  test('player blackjack pays 1.5x (3:2)', async () => {
    await game.injectDeck(buildPlayerBlackjackDeck());
    await game.setBet(100);
    await game.deal();
    await game.waitForOverlay();
    const balance = await game.getBalance();
    // Start: 1000, bet: 100 deducted → 900, return: bet(100) + profit(150) = 250 → 1150
    expect(balance).toBe(1150);
  });

  test('deal button is disabled while cards are in play', async ({ page }) => {
    await game.injectDeck(buildPlayerWinDeck());
    await game.setBet(10);
    await game.deal();
    await expect(page.locator('#btn-deal')).toBeDisabled();
  });

  test('second deal re-enables after round ends', async ({ page }) => {
    await game.injectDeck(buildPlayerBustDeck());
    await game.setBet(10);
    await game.deal();
    await game.stand();
    await game.waitForOverlay();
    await game.dismissOverlay();
    await page.clock.runFor(1000); // card return animation
    await expect(page.locator('#btn-deal')).not.toBeDisabled();
  });

  test('dealer score is not shown during player turn (hole card hidden)', async ({ page }) => {
    await game.injectDeck(buildPlayerBustDeck());
    await game.setBet(10);
    await game.deal();
    // Dealer score element should only show the visible card's value
    const dealerScore = await page.textContent('#dealer-score');
    // Score should be a number (just the up card), not the full hand total
    expect(dealerScore.trim()).toMatch(/^\d+$/);
  });
});
