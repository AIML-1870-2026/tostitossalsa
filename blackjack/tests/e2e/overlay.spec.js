import { test, expect } from '@playwright/test';
import { BlackjackGame } from '../helpers/game-actions.js';
import { buildPlayerWinDeck } from '../helpers/deck-builder.js';

test.describe('Result Overlay', () => {
  let game;

  /** Play a full round and land on the overlay, ready for overlay-specific assertions. */
  async function playToOverlay(page, bet = 10) {
    await game.injectDeck(buildPlayerWinDeck());
    await game.setBet(bet);
    await game.deal();
    await game.stand();
    await game.waitForOverlay();
  }

  test.beforeEach(async ({ page }) => {
    await page.clock.install();
    game = new BlackjackGame(page);
    await game.navigate();
  });

  test('overlay appears after round resolution', async ({ page }) => {
    await playToOverlay(page);
    await expect(page.locator('#result-overlay')).toHaveClass(/show/);
  });

  test('overlay is not visible before a round is played', async ({ page }) => {
    await expect(page.locator('#result-overlay')).not.toHaveClass(/show/);
    await expect(page.locator('#result-overlay')).toHaveClass(/hidden/);
  });

  test('overlay contains at least one result line', async ({ page }) => {
    await playToOverlay(page);
    const lines = await page.locator('#result-overlay .result-line').count();
    expect(lines).toBeGreaterThanOrEqual(1);
  });

  test('clicking the overlay dismisses it', async ({ page }) => {
    await playToOverlay(page);
    await game.dismissOverlay();
    await expect(page.locator('#result-overlay')).not.toHaveClass(/show/);
  });

  test('overlay auto-dismisses after 3 seconds', async ({ page }) => {
    await playToOverlay(page);
    // Advance past the 3-second auto-hide timer
    await page.clock.runFor(3100);
    await expect(page.locator('#result-overlay')).not.toHaveClass(/show/);
  });

  test('after overlay is dismissed, game returns to IDLE phase', async ({ page }) => {
    await playToOverlay(page);
    await game.dismissOverlay();
    await page.clock.runFor(1000); // card return animation
    const phase = await game.getPhase();
    expect(phase).toBe('IDLE');
  });

  test('after overlay is dismissed, deal button becomes enabled', async ({ page }) => {
    await playToOverlay(page);
    await game.dismissOverlay();
    await page.clock.runFor(1000);
    await expect(page.locator('#btn-deal')).not.toBeDisabled();
  });

  test('after overlay auto-dismisses, deal button becomes enabled', async ({ page }) => {
    await playToOverlay(page);
    await page.clock.runFor(3100); // auto-dismiss fires
    await page.clock.runFor(1000); // card return animation
    await expect(page.locator('#btn-deal')).not.toBeDisabled();
  });

  test('clicking outside the overlay (on the table) also dismisses it', async ({ page }) => {
    await playToOverlay(page);
    await page.click('#table');
    await expect(page.locator('#result-overlay')).not.toHaveClass(/show/);
  });

  test('cards are removed from the table after overlay is dismissed', async ({ page }) => {
    await playToOverlay(page);
    await game.dismissOverlay();
    await page.clock.runFor(1000); // wait for card return
    const cardCount = await page.locator('.card').count();
    expect(cardCount).toBe(0);
  });
});
