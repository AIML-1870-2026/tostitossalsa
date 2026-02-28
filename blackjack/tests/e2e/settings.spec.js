import { test, expect } from '@playwright/test';
import { BlackjackGame } from '../helpers/game-actions.js';
import { buildPlayerWinDeck } from '../helpers/deck-builder.js';

test.describe('Settings Controls', () => {
  let game;

  test.beforeEach(async ({ page }) => {
    await page.clock.install();
    game = new BlackjackGame(page);
    await game.navigate();
  });

  // ── Mute toggle ────────────────────────────────────────────────────────────

  test('mute button starts showing "Sound ON"', async ({ page }) => {
    await expect(page.locator('#mute-btn')).toHaveText('Sound ON');
  });

  test('clicking mute toggles text to "Sound OFF"', async ({ page }) => {
    await page.click('#mute-btn');
    await expect(page.locator('#mute-btn')).toHaveText('Sound OFF');
  });

  test('clicking mute twice restores "Sound ON"', async ({ page }) => {
    await page.click('#mute-btn');
    await page.click('#mute-btn');
    await expect(page.locator('#mute-btn')).toHaveText('Sound ON');
  });

  test('mute state is reflected in window.__gameState', async ({ page }) => {
    await page.click('#mute-btn');
    const isMuted = await page.evaluate(() => window.__gameState.muted);
    expect(isMuted).toBe(true);
    await page.click('#mute-btn');
    const isUnmuted = await page.evaluate(() => window.__gameState.muted);
    expect(isUnmuted).toBe(false);
  });

  // ── Card style toggle ──────────────────────────────────────────────────────

  test('card style button starts showing "Traditional"', async ({ page }) => {
    await expect(page.locator('#card-style-toggle')).toHaveText('Traditional');
  });

  test('clicking card style toggles text to "High Contrast"', async ({ page }) => {
    await page.click('#card-style-toggle');
    await expect(page.locator('#card-style-toggle')).toHaveText('High Contrast');
  });

  test('clicking card style twice restores "Traditional"', async ({ page }) => {
    await page.click('#card-style-toggle');
    await page.click('#card-style-toggle');
    await expect(page.locator('#card-style-toggle')).toHaveText('Traditional');
  });

  test('switching to High Contrast adds the high-contrast class to body', async ({ page }) => {
    await page.click('#card-style-toggle');
    await expect(page.locator('body')).toHaveClass(/high-contrast/);
  });

  test('switching back to Traditional removes the high-contrast class from body', async ({ page }) => {
    await page.click('#card-style-toggle');
    await page.click('#card-style-toggle');
    await expect(page.locator('body')).not.toHaveClass(/high-contrast/);
  });

  test('card style change is stored in window.__gameState.cardStyle', async ({ page }) => {
    await page.click('#card-style-toggle');
    const style = await page.evaluate(() => window.__gameState.cardStyle);
    expect(style).toBe('highcontrast');
  });

  test('toggled card style persists across a deal', async ({ page }) => {
    await page.click('#card-style-toggle'); // switch to high contrast
    await game.injectDeck(buildPlayerWinDeck());
    await game.setBet(10);
    await game.deal();
    // Style state should still be highcontrast after the deal
    const style = await page.evaluate(() => window.__gameState.cardStyle);
    expect(style).toBe('highcontrast');
    // Body class should still be present
    await expect(page.locator('body')).toHaveClass(/high-contrast/);
  });
});
