import { test, expect } from '@playwright/test';
import { BlackjackGame } from '../helpers/game-actions.js';
import { buildPlayerBustDeck } from '../helpers/deck-builder.js';

test.describe('Keyboard Navigation & Accessibility', () => {
  let game;

  test.beforeEach(async ({ page }) => {
    await page.clock.install();
    game = new BlackjackGame(page);
    await game.navigate();
  });

  // ── ARIA labels ────────────────────────────────────────────────────────────

  test('all main action buttons have aria-label attributes', async ({ page }) => {
    const buttons = [
      '#btn-deal',
      '#btn-hit',
      '#btn-stand',
      '#btn-double',
      '#btn-split',
      '#btn-insurance',
      '#btn-no-insurance',
    ];
    for (const selector of buttons) {
      const label = await page.getAttribute(selector, 'aria-label');
      expect(label, `${selector} should have an aria-label`).toBeTruthy();
    }
  });

  test('header controls have aria-label attributes', async ({ page }) => {
    const controls = ['#card-style-toggle', '#mute-btn'];
    for (const selector of controls) {
      const label = await page.getAttribute(selector, 'aria-label');
      expect(label, `${selector} should have an aria-label`).toBeTruthy();
    }
  });

  test('bet input has an aria-label', async ({ page }) => {
    const label = await page.getAttribute('#bet-input', 'aria-label');
    expect(label).toBeTruthy();
  });

  test('dealer hand container has an aria-label', async ({ page }) => {
    const label = await page.getAttribute('#dealer-hand', 'aria-label');
    expect(label).toBeTruthy();
  });

  test('result overlay has role="alert" and aria-live="assertive"', async ({ page }) => {
    const role = await page.getAttribute('#result-overlay', 'role');
    const live = await page.getAttribute('#result-overlay', 'aria-live');
    expect(role).toBe('alert');
    expect(live).toBe('assertive');
  });

  // ── Keyboard activation ────────────────────────────────────────────────────

  test('Deal button can be activated with Enter key', async ({ page }) => {
    await game.injectDeck(buildPlayerBustDeck());
    await game.setBet(10);
    await page.locator('#btn-deal').focus();
    await page.keyboard.press('Enter');
    await page.clock.runFor(500);
    // Phase should no longer be IDLE
    const phase = await game.getPhase();
    expect(phase).not.toBe('IDLE');
  });

  test('Deal button can be activated with Space key', async ({ page }) => {
    await game.injectDeck(buildPlayerBustDeck());
    await game.setBet(10);
    await page.locator('#btn-deal').focus();
    await page.keyboard.press('Space');
    await page.clock.runFor(500);
    const phase = await game.getPhase();
    expect(phase).not.toBe('IDLE');
  });

  test('chip buttons can be activated with Space key', async ({ page }) => {
    await game.clearBet();
    const chipBtn = page.locator('[data-denom="25"]').first();
    await chipBtn.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#bet-input')).toHaveValue('25');
  });

  test('Tab key moves focus through interactive elements', async ({ page }) => {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  // ── Disabled state ─────────────────────────────────────────────────────────

  test('Hit is disabled during IDLE phase', async ({ page }) => {
    await expect(page.locator('#btn-hit')).toBeDisabled();
  });

  test('Stand is disabled during IDLE phase', async ({ page }) => {
    await expect(page.locator('#btn-stand')).toBeDisabled();
  });

  test('Double is disabled during IDLE phase', async ({ page }) => {
    await expect(page.locator('#btn-double')).toBeDisabled();
  });

  test('Split is disabled during IDLE phase', async ({ page }) => {
    await expect(page.locator('#btn-split')).toBeDisabled();
  });

  test('Deal is disabled during PLAYER_TURN phase', async ({ page }) => {
    await game.injectDeck(buildPlayerBustDeck());
    await game.setBet(10);
    await game.deal();
    await expect(page.locator('#btn-deal')).toBeDisabled();
  });

  test('Hit and Stand are disabled after round ends', async ({ page }) => {
    await game.injectDeck(buildPlayerBustDeck());
    await game.setBet(10);
    await game.deal();
    await game.stand();
    await game.waitForOverlay();
    await expect(page.locator('#btn-hit')).toBeDisabled();
    await expect(page.locator('#btn-stand')).toBeDisabled();
  });
});
