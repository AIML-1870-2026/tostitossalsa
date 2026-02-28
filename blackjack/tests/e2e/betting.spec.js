import { test, expect } from '@playwright/test';
import { BlackjackGame } from '../helpers/game-actions.js';
import { buildPlayerBustDeck } from '../helpers/deck-builder.js';

test.describe('Betting Panel', () => {
  let game;

  test.beforeEach(async ({ page }) => {
    await page.clock.install();
    game = new BlackjackGame(page);
    await game.navigate();
  });

  test('all five chip denominations add to bet input', async ({ page }) => {
    for (const denom of [1, 5, 25, 100, 500]) {
      await game.clearBet();
      await game.clickChip(denom);
      await expect(page.locator('#bet-input')).toHaveValue(String(denom));
    }
  });

  test('clicking multiple chips accumulates the total', async ({ page }) => {
    await game.clearBet();
    await game.clickChip(25);
    await game.clickChip(25);
    await game.clickChip(100);
    await expect(page.locator('#bet-input')).toHaveValue('150');
  });

  test('clear button resets bet input to 0', async ({ page }) => {
    await game.clickChip(100);
    await game.clearBet();
    await expect(page.locator('#bet-input')).toHaveValue('0');
  });

  test('typing directly in the bet input is accepted', async ({ page }) => {
    await game.setBet(42);
    await expect(page.locator('#bet-input')).toHaveValue('42');
  });

  test('bet is clamped to balance — cannot exceed 1000 at start', async ({ page }) => {
    await game.setBet(99999);
    const value = parseInt(await page.inputValue('#bet-input'), 10);
    expect(value).toBeLessThanOrEqual(1000);
  });

  test('dealing with a 0 bet flashes the input red and does not deal', async ({ page }) => {
    await game.clearBet();
    await page.click('#btn-deal');
    // Browsers normalise hex → rgb when reading back computed style
    const outlineColor = await page.evaluate(() => document.getElementById('bet-input').style.outlineColor);
    expect(outlineColor).toMatch(/e74c3c|rgb\(231,\s*76,\s*60\)/i);
    // Phase should still be IDLE — no deal happened
    const phase = await game.getPhase();
    expect(phase).toBe('IDLE');
  });

  test('bet panel is locked while deal animation plays', async ({ page }) => {
    await game.injectDeck(buildPlayerBustDeck());
    await game.setBet(10);
    await page.click('#btn-deal');
    // Immediately after click (before runFor), panel should be locked
    await expect(page.locator('#bet-input')).toBeDisabled();
    await expect(page.locator('#clear-bet-btn')).toBeDisabled();
    await expect(page.locator('.chip-btn').first()).toBeDisabled();
  });

  test('bet panel unlocks after round ends and overlay is dismissed', async ({ page }) => {
    await game.injectDeck(buildPlayerBustDeck());
    await game.setBet(10);
    await game.deal();
    await game.stand();
    await game.waitForOverlay();
    await game.dismissOverlay();
    await page.clock.runFor(1000); // card return animation
    await expect(page.locator('#bet-input')).not.toBeDisabled();
    await expect(page.locator('#clear-bet-btn')).not.toBeDisabled();
  });

  test('bet stack chips are rendered when bet input has a value', async ({ page }) => {
    await game.setBet(125);
    // toBeEmpty() checks for text — chips are image-only divs.
    // Check for DOM children instead.
    const childCount = await page.locator('#bet-chip-stack > *').count();
    expect(childCount).toBeGreaterThan(0);
  });
});
